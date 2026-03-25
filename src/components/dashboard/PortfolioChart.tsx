"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatMonthYear } from "@/lib/utils/format";
import { Card, CardHeader } from "@/components/ui/Card";
import type { PerformanceDataPoint } from "@/types";

interface PortfolioChartProps {
  history: PerformanceDataPoint[];
  baseCurrency: string;
}

type Range = "6M" | "1Y" | "ALL";

function CustomTooltip({
  active,
  payload,
  label,
  baseCurrency,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  baseCurrency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-2.5 shadow-xl">
      <p className="text-xs text-[#7d8590] mb-2">{label && formatMonthYear(label)}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[#8b949e]">{p.name}</span>
          <span className="font-semibold text-[#e6edf3] tabular-nums">
            {formatCurrency(p.value, baseCurrency, { compact: true })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PortfolioChart({ history, baseCurrency }: PortfolioChartProps) {
  const [range, setRange] = useState<Range>("ALL");

  const cutoffs: Record<Range, number> = {
    "6M": 6,
    "1Y": 12,
    ALL: Infinity,
  };

  const displayData =
    range === "ALL"
      ? history
      : history.slice(-cutoffs[range]);

  return (
    <Card padding="none">
      <div className="p-5 pb-0">
        <CardHeader
          title="Portfolio Value"
          subtitle="Market value vs. cost basis over time"
          action={
            <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1">
              {(["6M", "1Y", "ALL"] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    range === r
                      ? "bg-[#21262d] text-[#e6edf3]"
                      : "text-[#7d8590] hover:text-[#c9d1d9]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        />
      </div>
      <div className="h-64 px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradContrib" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                const [y, m] = v.split("-");
                return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m) - 1]} ${y.slice(2)}`;
              }}
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
            <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} />} />
            <Area
              type="monotone"
              dataKey="cumulativeContributed"
              name="Contributed"
              stroke="#10b981"
              strokeWidth={1.5}
              fill="url(#gradContrib)"
              strokeDasharray="4 2"
            />
            <Area
              type="monotone"
              dataKey="portfolioValueBase"
              name="Portfolio Value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
