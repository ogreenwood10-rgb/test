"use client";

import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Card, CardHeader } from "@/components/ui/Card";
import type { GoalProgress } from "@/lib/calculations/goals";

interface GoalProgressWidgetProps {
  goals: GoalProgress[];
  baseCurrency: string;
}

export function GoalProgressWidget({ goals, baseCurrency }: GoalProgressWidgetProps) {
  return (
    <Card padding="md">
      <CardHeader title="Goal Progress" />
      <div className="space-y-4">
        {goals.map(({ goal, currentValue, progressPct, estimatedCompletionDate, onTrack }) => (
          <div key={goal.id}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#c9d1d9] font-medium">{goal.label}</p>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    onTrack ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {onTrack ? "On track" : "Off track"}
                </span>
              </div>
              <span className="text-xs font-semibold text-[#e6edf3] tabular-nums">
                {progressPct.toFixed(1)}%
              </span>
            </div>

            <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  onTrack ? "bg-gradient-to-r from-blue-500 to-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-[#7d8590]">
                {goal.type === "crypto_stack"
                  ? `${currentValue.toFixed(4)} / ${goal.targetValue} ${goal.targetCurrency}`
                  : `${formatCurrency(currentValue, baseCurrency, { compact: true })} / ${formatCurrency(goal.targetValue, baseCurrency, { compact: true })}`}
              </p>
              {estimatedCompletionDate && (
                <p className="text-[11px] text-[#7d8590]">
                  Est. {formatDate(estimatedCompletionDate, "medium")}
                </p>
              )}
              {goal.deadline && !estimatedCompletionDate && (
                <p className="text-[11px] text-[#7d8590]">
                  Target: {formatDate(goal.deadline, "medium")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
