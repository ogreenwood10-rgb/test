"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { TxTypeBadge } from "@/components/ui/Badge";
import type { MonthlyIncomeSummary, IncomeEvent } from "@/types";
import type { Asset, Account } from "@/types";

interface EnrichedEvent extends IncomeEvent {
  asset: Asset | null;
  account: Account | null;
}

interface IncomeViewProps {
  monthlySummaries: MonthlyIncomeSummary[];
  incomeEvents: EnrichedEvent[];
  baseCurrency: string;
}

const TYPE_COLORS: Record<string, string> = {
  staking_reward: "#f59e0b",
  dividend:       "#3b82f6",
  interest:       "#10b981",
  airdrop:        "#8b5cf6",
};

export function IncomeView({ monthlySummaries, incomeEvents, baseCurrency }: IncomeViewProps) {
  // Build asset breakdown
  const assetTotals: Record<string, { label: string; total: number; type: string }> = {};
  for (const e of incomeEvents) {
    const key = e.assetId;
    if (!assetTotals[key]) {
      assetTotals[key] = {
        label: e.asset?.symbol ?? e.assetId,
        total: 0,
        type: e.type,
      };
    }
    assetTotals[key].total += e.amountBase;
  }

  const assetBreakdown = Object.values(assetTotals).sort((a, b) => b.total - a.total);
  const maxAssetIncome = Math.max(...assetBreakdown.map((a) => a.total), 1);

  return (
    <div className="space-y-6">
      {/* Monthly bar chart */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardHeader title="Monthly Income" subtitle="All income sources combined" />
        </div>
        <div className="h-56 px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySummaries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="month"
                tickFormatter={(v) => {
                  const [, m] = v.split("-");
                  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1];
                }}
                tick={{ fill: "#7d8590", fontSize: 11 }}
                axisLine={{ stroke: "#21262d" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, baseCurrency, { compact: true })}
                tick={{ fill: "#7d8590", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                formatter={(v: unknown) => [formatCurrency(Number(v ?? 0), baseCurrency), "Income"]}
                labelFormatter={(l) => formatMonthYear(l)}
                contentStyle={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: "8px" }}
                labelStyle={{ color: "#7d8590", fontSize: 12 }}
                itemStyle={{ color: "#e6edf3", fontSize: 12 }}
              />
              <Bar dataKey="totalBase" radius={[3, 3, 0, 0]}>
                {monthlySummaries.map((_, i) => (
                  <Cell key={i} fill="#10b981" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By asset */}
        <Card padding="md">
          <CardHeader title="Income by Asset" subtitle="All-time totals" />
          <div className="space-y-3">
            {assetBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[item.type] ?? "#6b7280" }}
                    />
                    <span className="text-sm text-[#c9d1d9]">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-[#e6edf3] tabular-nums">
                    {formatCurrency(item.total, baseCurrency)}
                  </span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.total / maxAssetIncome) * 100}%`,
                      backgroundColor: TYPE_COLORS[item.type] ?? "#6b7280",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent income events */}
        <Card padding="md">
          <CardHeader title="Recent Income Events" />
          <div className="space-y-0">
            {incomeEvents.slice(0, 10).map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-[#21262d] last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TxTypeBadge type={e.type} />
                  <div className="min-w-0">
                    <p className="text-sm text-[#c9d1d9]">{e.asset?.symbol ?? e.assetId}</p>
                    <p className="text-xs text-[#7d8590]">{e.account?.name ?? e.accountId}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-medium text-emerald-400 tabular-nums">
                    +{formatCurrency(e.amountBase, baseCurrency)}
                  </p>
                  <p className="text-xs text-[#7d8590]">{formatDate(e.date, "short")}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
