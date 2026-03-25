import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPct } from "@/lib/utils/format";

interface StatTileProps {
  label: string;
  value: string;
  change?: number;       // percentage change (positive/negative)
  changeLabel?: string;  // e.g. "24h" or "vs cost"
  subValue?: string;
  icon?: ReactNode;
  accent?: "blue" | "green" | "amber" | "violet" | "red";
  size?: "sm" | "md" | "lg";
}

const ACCENT_CLASSES = {
  blue:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  red:    "bg-red-500/10 text-red-400 border-red-500/20",
};

export function StatTile({
  label,
  value,
  change,
  changeLabel,
  subValue,
  icon,
  accent,
  size = "md",
}: StatTileProps) {
  const trendColor =
    change === undefined ? "" : change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-[#7d8590]";
  const TrendIcon =
    change === undefined ? null : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#7d8590] uppercase tracking-wider">{label}</p>
        {icon && accent && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${ACCENT_CLASSES[accent]}`}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <p
          className={`font-semibold tabular-nums ${
            size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl"
          } text-[#e6edf3]`}
        >
          {value}
        </p>
        {subValue && <p className="text-xs text-[#7d8590] mt-0.5">{subValue}</p>}
      </div>

      {change !== undefined && TrendIcon && (
        <div className={`flex items-center gap-1.5 text-xs ${trendColor}`}>
          <TrendIcon size={12} />
          <span className="font-medium">{formatPct(change)}</span>
          {changeLabel && <span className="text-[#7d8590]">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
