"use client";

import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { formatCurrency, formatMonthYear, formatPct } from "@/lib/utils/format";
import { Card, CardHeader } from "@/components/ui/Card";
import type { PerformanceDataPoint, DrawdownPoint } from "@/types";

interface ClassPerf {
  assetClass: string;
  totalValue: number;
  totalCost: number;
  pnl: number;
  pnlPct: number;
}

interface PerformanceChartsProps {
  history: PerformanceDataPoint[];
  drawdowns: DrawdownPoint[];
  rolling3m: Array<{ date: string; returnPct: number }>;
  classPerformance: ClassPerf[];
  baseCurrency: string;
}

const CLASS_COLORS: Record<string, string> = {
  crypto: "#f59e0b",
  equity: "#3b82f6",
  cash:   "#10b981",
  property: "#8b5cf6",
  other:  "#6b7280",
};

function AxisTick({ date }: { date: string }) {
  const [y, m] = date.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]} '${y.slice(2)}`;
}

export function PerformanceCharts({
  history,
  drawdowns,
  rolling3m,
  classPerformance,
  baseCurrency,
}: PerformanceChartsProps) {
  return (
    <div className="space-y-6">
      {/* Growth vs Contribution */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardHeader
            title="Portfolio Growth"
            subtitle="Market value vs. capital contributed over time"
          />
        </div>
        <div className="h-72 px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradValue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => AxisTick({ date: v })}
                tick={{ fill: "#7d8590", fontSize: 11 }}
                axisLine={{ stroke: "#21262d" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, baseCurrency, { compact: true })}
                tick={{ fill: "#7d8590", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                formatter={(v: unknown) => [
                  formatCurrency(Number(v ?? 0), baseCurrency),
                ]}
                labelFormatter={(l) => formatMonthYear(l)}
                contentStyle={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: "8px" }}
                labelStyle={{ color: "#7d8590", fontSize: 12 }}
                itemStyle={{ color: "#e6edf3", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="cumulativeContributed"
                name="Contributed"
                stroke="#10b981"
                strokeWidth={1.5}
                fill="url(#gradGain)"
                strokeDasharray="4 2"
              />
              <Area
                type="monotone"
                dataKey="portfolioValueBase"
                name="Portfolio Value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gradValue2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drawdown */}
        <Card padding="none">
          <div className="p-5 pb-0">
            <CardHeader title="Drawdown" subtitle="% decline from all-time high" />
          </div>
          <div className="h-52 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdowns} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => AxisTick({ date: v })}
                  tick={{ fill: "#7d8590", fontSize: 11 }}
                  axisLine={{ stroke: "#21262d" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  tick={{ fill: "#7d8590", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <ReferenceLine y={0} stroke="#30363d" />
                <Tooltip
                formatter={(v: unknown) => [`${Number(v ?? 0).toFixed(2)}%`, "Drawdown"]}
                  labelFormatter={(l) => formatMonthYear(l)}
                  contentStyle={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: "8px" }}
                  labelStyle={{ color: "#7d8590", fontSize: 12 }}
                  itemStyle={{ color: "#ef4444", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="drawdownPct"
                  name="Drawdown"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="url(#gradDD)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Performance by class */}
        <Card padding="md">
          <CardHeader title="Return by Asset Class" subtitle="Unrealised P&L vs. cost basis" />
          <div className="space-y-3">
            {classPerformance
              .sort((a, b) => b.pnlPct - a.pnlPct)
              .map((cp) => (
                <div key={cp.assetClass}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CLASS_COLORS[cp.assetClass] ?? "#6b7280" }}
                      />
                      <span className="text-sm text-[#c9d1d9] capitalize">{cp.assetClass}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={cp.pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {formatPct(cp.pnlPct)}
                      </span>
                      <span className="text-[#7d8590] tabular-nums">
                        {formatCurrency(cp.totalValue, baseCurrency, { compact: true })}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(Math.abs(cp.pnlPct), 100)}%`,
                        backgroundColor: CLASS_COLORS[cp.assetClass] ?? "#6b7280",
                        opacity: cp.pnlPct < 0 ? 0.4 : 1,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Rolling 3M returns */}
      {rolling3m.length > 0 && (
        <Card padding="none">
          <div className="p-5 pb-0">
            <CardHeader title="Rolling 3-Month Return" subtitle="Portfolio return over trailing 3 months" />
          </div>
          <div className="h-48 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rolling3m} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => AxisTick({ date: v })}
                  tick={{ fill: "#7d8590", fontSize: 11 }}
                  axisLine={{ stroke: "#21262d" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  tick={{ fill: "#7d8590", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <ReferenceLine y={0} stroke="#30363d" />
                <Tooltip
                formatter={(v: unknown) => [`${Number(v ?? 0).toFixed(2)}%`, "Return"]}
                  labelFormatter={(l) => formatMonthYear(l)}
                  contentStyle={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: "8px" }}
                  labelStyle={{ color: "#7d8590", fontSize: 12 }}
                  itemStyle={{ color: "#e6edf3", fontSize: 12 }}
                />
                <Bar dataKey="returnPct" radius={[2, 2, 0, 0]}>
                  {rolling3m.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.returnPct >= 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
