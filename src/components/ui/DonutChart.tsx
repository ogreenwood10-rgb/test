"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { AllocationBreakdown } from "@/types";
import { formatCurrency, formatPct } from "@/lib/utils/format";

interface DonutChartProps {
  data: AllocationBreakdown[];
  baseCurrency?: string;
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocationBreakdown }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-[#c9d1d9]">{d.label}</p>
      <p className="text-sm font-semibold text-[#e6edf3] mt-1">
        {formatCurrency(d.valueBase)}
      </p>
      <p className="text-xs text-[#7d8590]">{formatPct(d.pct, 1)}</p>
    </div>
  );
}

export function DonutChart({
  data,
  size = 180,
  innerRadius = 52,
  outerRadius = 80,
}: DonutChartProps) {
  if (!data.length) return null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="valueBase"
            strokeWidth={0}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AllocationLegendProps {
  data: AllocationBreakdown[];
  compact?: boolean;
}

export function AllocationLegend({ data, compact = false }: AllocationLegendProps) {
  return (
    <div className={`space-y-${compact ? "2" : "3"}`}>
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#c9d1d9] truncate">{item.label}</span>
              <span className="text-xs font-medium text-[#7d8590] ml-2">
                {item.pct.toFixed(1)}%
              </span>
            </div>
            {!compact && (
              <div className="mt-1 h-1 bg-[#21262d] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
