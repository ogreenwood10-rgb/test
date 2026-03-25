"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { CheckCircle2, Circle, Target, Clock } from "lucide-react";
import { formatCurrency, formatDate, formatMonthYear, formatPct } from "@/lib/utils/format";
import { Card, CardHeader } from "@/components/ui/Card";
import type { GoalProgress } from "@/lib/calculations/goals";
import type { ForecastScenario, AppConfig } from "@/types";

interface GoalsViewProps {
  goalProgress: GoalProgress[];
  scenarios: ForecastScenario[];
  config: AppConfig;
  currentValue: number;
  baseCurrency: string;
}

const SCENARIO_COLORS = ["#6b7280", "#3b82f6", "#10b981", "#f59e0b"];

export function GoalsView({ goalProgress, scenarios, config, currentValue, baseCurrency }: GoalsViewProps) {
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  const displayScenarios =
    activeScenario !== null ? [scenarios[activeScenario]] : scenarios;

  const allDates = scenarios[0]?.dataPoints.map((p) => p.date) ?? [];

  // Merge all scenario data into one array for the chart
  const chartData = allDates.map((date, i) => {
    const point: Record<string, string | number> = { date };
    scenarios.forEach((s, si) => {
      point[`scenario_${si}`] = s.dataPoints[i]?.projectedValue ?? 0;
    });
    return point;
  });

  return (
    <div className="space-y-6">
      {/* Goals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goalProgress.map(({ goal, currentValue: cv, progressPct, remaining, estimatedCompletionDate, onTrack }) => (
          <Card key={goal.id} padding="md">
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  progressPct >= 100
                    ? "bg-emerald-500/15"
                    : onTrack
                    ? "bg-blue-500/15"
                    : "bg-amber-500/15"
                }`}
              >
                {progressPct >= 100 ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Target size={18} className={onTrack ? "text-blue-400" : "text-amber-400"} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#c9d1d9]">{goal.label}</p>
                {goal.notes && <p className="text-xs text-[#7d8590] mt-0.5">{goal.notes}</p>}
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  progressPct >= 100
                    ? "bg-emerald-500/15 text-emerald-400"
                    : onTrack
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {progressPct >= 100 ? "Complete" : onTrack ? "On track" : "Behind"}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-[#7d8590] mb-1.5">
                <span>Progress</span>
                <span className="font-semibold text-[#e6edf3]">{progressPct.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPct >= 100
                      ? "bg-emerald-500"
                      : onTrack
                      ? "bg-gradient-to-r from-blue-500 to-blue-400"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#21262d]">
              <div>
                <p className="text-[11px] text-[#7d8590]">Current</p>
                <p className="text-sm font-medium text-[#c9d1d9] tabular-nums mt-0.5">
                  {goal.type === "crypto_stack"
                    ? `${cv.toFixed(4)} ${goal.targetCurrency}`
                    : formatCurrency(cv, baseCurrency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#7d8590]">Target</p>
                <p className="text-sm font-medium text-[#c9d1d9] tabular-nums mt-0.5">
                  {goal.type === "crypto_stack"
                    ? `${goal.targetValue} ${goal.targetCurrency}`
                    : formatCurrency(goal.targetValue, baseCurrency)}
                </p>
              </div>
              {remaining > 0 && (
                <div>
                  <p className="text-[11px] text-[#7d8590]">Remaining</p>
                  <p className="text-sm font-medium text-red-400 tabular-nums mt-0.5">
                    {goal.type === "crypto_stack"
                      ? `${remaining.toFixed(4)} ${goal.targetCurrency}`
                      : formatCurrency(remaining, baseCurrency)}
                  </p>
                </div>
              )}
              {(estimatedCompletionDate || goal.deadline) && (
                <div>
                  <p className="text-[11px] text-[#7d8590]">
                    {estimatedCompletionDate ? "Est. date" : "Deadline"}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-[#7d8590]" />
                    <p className="text-sm text-[#c9d1d9]">
                      {formatDate(estimatedCompletionDate ?? goal.deadline ?? "", "medium")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Forecast chart */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardHeader
            title="Growth Forecast"
            subtitle={`Starting from ${formatCurrency(currentValue, baseCurrency)} with ${formatCurrency(config.contributionMonthly, baseCurrency)}/mo contributions`}
            action={
              <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1">
                <button
                  onClick={() => setActiveScenario(null)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeScenario === null ? "bg-[#21262d] text-[#e6edf3]" : "text-[#7d8590] hover:text-[#c9d1d9]"
                  }`}
                >
                  All
                </button>
                {scenarios.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveScenario(i)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeScenario === i ? "bg-[#21262d] text-[#e6edf3]" : "text-[#7d8590] hover:text-[#c9d1d9]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            }
          />
        </div>
        <div className="h-80 px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => {
                  const [y] = v.split("-");
                  return `${y}`;
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
              <Tooltip
                formatter={(v: unknown, name: unknown) => {
                  const idx = parseInt(String(name).split("_")[1]);
                  return [formatCurrency(Number(v ?? 0), baseCurrency), scenarios[idx]?.label ?? String(name)];
                }}
                labelFormatter={(l) => formatMonthYear(l)}
                contentStyle={{ background: "#1c2128", border: "1px solid #30363d", borderRadius: "8px" }}
                labelStyle={{ color: "#7d8590", fontSize: 12 }}
                itemStyle={{ fontSize: 12 }}
              />
              {/* Target line */}
              <ReferenceLine
                y={config.targetNetWorth}
                stroke="#f59e0b"
                strokeDasharray="4 2"
                label={{ value: "Target", fill: "#f59e0b", fontSize: 11, position: "right" }}
              />
              {scenarios.map((_, i) => {
                const isActive = activeScenario === null || activeScenario === i;
                return (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`scenario_${i}`}
                    stroke={SCENARIO_COLORS[i]}
                    strokeWidth={isActive ? 2 : 1}
                    dot={false}
                    strokeOpacity={isActive ? 1 : 0.2}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Scenario legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveScenario(activeScenario === i ? null : i)}
            className={`p-4 rounded-xl border text-left transition-colors ${
              activeScenario === i
                ? "border-[#30363d] bg-[#1c2128]"
                : "border-[#21262d] bg-[#161b22] hover:border-[#30363d]"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SCENARIO_COLORS[i] }} />
              <p className="text-xs font-medium text-[#c9d1d9]">{s.label}</p>
            </div>
            <p className="text-lg font-bold text-[#e6edf3] tabular-nums">
              {formatCurrency(s.dataPoints[s.dataPoints.length - 1]?.projectedValue ?? 0, baseCurrency, { compact: true })}
            </p>
            <p className="text-[11px] text-[#7d8590] mt-0.5">in 20 years</p>
          </button>
        ))}
      </div>
    </div>
  );
}
