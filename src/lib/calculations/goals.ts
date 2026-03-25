/**
 * Goal tracking and forecasting engine.
 */
import type { Goal, ForecastScenario, ForecastPoint } from "@/types";

export interface GoalProgress {
  goal: Goal;
  currentValue: number;
  progressPct: number;
  remaining: number;
  estimatedCompletionDate: string | null;
  onTrack: boolean;
}

/** Calculate progress toward each goal. */
export function calcGoalProgress(
  goals: Goal[],
  snapshot: {
    totalNetWorthBase: number;
    totalAnnualIncomeBase: number;
    enrichedHoldings: Array<{ assetId: string; quantity: number }>;
  },
  monthlyContribution: number,
  annualGrowthPct: number
): GoalProgress[] {
  return goals.map((goal) => {
    let currentValue = 0;

    if (goal.type === "net_worth") {
      currentValue = snapshot.totalNetWorthBase;
    } else if (goal.type === "passive_income") {
      currentValue = snapshot.totalAnnualIncomeBase / 12; // monthly
    } else if (goal.type === "crypto_stack" && goal.assetId) {
      const holding = snapshot.enrichedHoldings.find((h) => h.assetId === goal.assetId);
      currentValue = holding?.quantity ?? 0;
    } else {
      currentValue = snapshot.totalNetWorthBase;
    }

    const progressPct = goal.targetValue > 0 ? Math.min((currentValue / goal.targetValue) * 100, 100) : 0;
    const remaining = Math.max(goal.targetValue - currentValue, 0);

    // Estimate completion date (simple compound growth + contribution model)
    let estimatedCompletionDate: string | null = null;
    if (goal.type === "net_worth" && currentValue < goal.targetValue) {
      const monthlyRate = annualGrowthPct / 100 / 12;
      estimatedCompletionDate = estimateCompletionDate(currentValue, goal.targetValue, monthlyContribution, monthlyRate);
    }

    let onTrack = progressPct >= 50;
    if (goal.deadline) {
      const monthsLeft = monthsBetween(new Date(), new Date(goal.deadline));
      const requiredMonthly =
        monthsLeft > 0 ? (goal.targetValue - currentValue) / monthsLeft : Infinity;
      onTrack = requiredMonthly <= monthlyContribution * 1.5;
    }

    return { goal, currentValue, progressPct, remaining, estimatedCompletionDate, onTrack };
  });
}

/** Build forecast scenarios. */
export function buildForecastScenarios(
  currentValue: number,
  monthlyContribution: number,
  annualGrowthPct: number
): ForecastScenario[] {
  const scenarios = [
    { label: "Conservative (5%)", monthlyContribution, annualGrowthPct: 5, annualYieldPct: 2 },
    { label: "Base Case (8%)", monthlyContribution, annualGrowthPct: 8, annualYieldPct: 3 },
    { label: "Optimistic (12%)", monthlyContribution, annualGrowthPct: 12, annualYieldPct: 4 },
    { label: "High Contribution (+50%)", monthlyContribution: monthlyContribution * 1.5, annualGrowthPct, annualYieldPct: 3 },
  ];

  return scenarios.map((s) => {
    const dataPoints = projectGrowth(currentValue, s.monthlyContribution, s.annualGrowthPct + s.annualYieldPct, 240); // 20 years
    return { ...s, dataPoints };
  });
}

function projectGrowth(
  initialValue: number,
  monthlyContribution: number,
  annualGrowthPct: number,
  months: number
): ForecastPoint[] {
  const monthlyRate = annualGrowthPct / 100 / 12;
  const points: ForecastPoint[] = [];
  let value = initialValue;
  let totalContributed = 0;
  const startDate = new Date();

  for (let i = 0; i <= months; i += 3) { // quarterly data points
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);

    points.push({
      date: d.toISOString().substring(0, 7),
      projectedValue: Math.round(value),
      contributed: Math.round(totalContributed),
      growth: Math.round(Math.max(value - initialValue - totalContributed, 0)),
    });

    // Advance 3 months
    for (let m = 0; m < 3; m++) {
      value = value * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;
    }
  }

  return points;
}

function estimateCompletionDate(
  current: number,
  target: number,
  monthlyContribution: number,
  monthlyRate: number
): string | null {
  if (current >= target) return null;
  let value = current;
  const now = new Date();
  for (let i = 0; i < 600; i++) { // max 50 years
    value = value * (1 + monthlyRate) + monthlyContribution;
    if (value >= target) {
      const d = new Date(now);
      d.setMonth(d.getMonth() + i + 1);
      return d.toISOString().substring(0, 10);
    }
  }
  return null;
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
