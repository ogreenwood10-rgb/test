/**
 * Performance calculation engine.
 * Computes time-weighted returns, drawdowns, and historical performance series.
 */
import type {
  Transaction,
  PerformanceDataPoint,
  DrawdownPoint,
} from "@/types";
import { toBase } from "@/lib/utils/fx";

/** Generate synthetic historical performance data from transactions. */
export function buildPerformanceHistory(
  transactions: Transaction[],
  currentValue: number
): PerformanceDataPoint[] {
  if (transactions.length === 0) return [];

  const sorted = [...transactions]
    .filter((tx) => ["buy", "deposit", "sell", "withdrawal"].includes(tx.type))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length === 0) return [];

  const startDate = new Date(sorted[0].date);
  const endDate = new Date();
  const totalMonths = monthsBetween(startDate, endDate);

  // Build monthly cashflow series
  const cashflows: Record<string, number> = {};
  for (const tx of transactions) {
    const month = tx.date.substring(0, 7); // "YYYY-MM"
    const value = toBase(tx.quantity * tx.pricePerUnit, tx.priceCurrency);
    if (tx.type === "buy" || tx.type === "deposit") {
      cashflows[month] = (cashflows[month] ?? 0) + value;
    } else if (tx.type === "sell" || tx.type === "withdrawal") {
      cashflows[month] = (cashflows[month] ?? 0) - value;
    }
  }

  // Build a simple growth model:
  // Start with first contribution, grow linearly toward current value
  const months = Array.from({ length: totalMonths + 1 }, (_, i) => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    return d.toISOString().substring(0, 7);
  });

  let cumulativeContributed = 0;
  const dataPoints: PerformanceDataPoint[] = [];

  // Total contributed
  const totalContributed = Object.values(cashflows).reduce((s, v) => s + Math.max(0, v), 0);
  // Implied growth factor from contributed to current
  const totalGain = currentValue - totalContributed;
  const contributedSoFar: number[] = [];

  for (let i = 0; i < months.length; i++) {
    const month = months[i];
    cumulativeContributed += cashflows[month] ?? 0;
    contributedSoFar.push(Math.max(0, cumulativeContributed));
  }

  const maxContrib = Math.max(...contributedSoFar, 1);

  for (let i = 0; i < months.length; i++) {
    const contrib = contributedSoFar[i];
    const growthFraction = contrib / maxContrib;
    // Portfolio value = contributed + proportional gain based on time
    // Exponential curve toward current value
    const timeFraction = months.length > 1 ? i / (months.length - 1) : 1;
    const exponentialFactor = Math.pow(timeFraction, 0.8); // slightly front-weighted
    const portfolioValue = contrib + totalGain * exponentialFactor * (contrib / maxContrib || 1);

    dataPoints.push({
      date: months[i],
      portfolioValueBase: Math.max(portfolioValue, 0),
      cumulativeContributed: contrib,
      cumulativeGain: Math.max(portfolioValue - contrib, 0),
      twr: timeFraction > 0 ? ((portfolioValue - contrib) / Math.max(contrib, 1)) * 100 : 0,
    });
  }

  // Ensure last point matches current value exactly
  if (dataPoints.length > 0) {
    dataPoints[dataPoints.length - 1].portfolioValueBase = currentValue;
    dataPoints[dataPoints.length - 1].cumulativeContributed = totalContributed;
    dataPoints[dataPoints.length - 1].cumulativeGain = Math.max(currentValue - totalContributed, 0);
  }

  return dataPoints;
}

/** Compute drawdown series from portfolio value history. */
export function calcDrawdowns(history: PerformanceDataPoint[]): DrawdownPoint[] {
  let peak = 0;
  return history.map((pt) => {
    if (pt.portfolioValueBase > peak) peak = pt.portfolioValueBase;
    const drawdown = peak > 0 ? ((pt.portfolioValueBase - peak) / peak) * 100 : 0;
    return { date: pt.date, drawdownPct: drawdown };
  });
}

/** Rolling N-period return series */
export function calcRollingReturns(
  history: PerformanceDataPoint[],
  windowMonths: number
): Array<{ date: string; returnPct: number }> {
  return history.slice(windowMonths).map((pt, i) => {
    const prev = history[i];
    const ret =
      prev.portfolioValueBase > 0
        ? ((pt.portfolioValueBase - prev.portfolioValueBase) / prev.portfolioValueBase) * 100
        : 0;
    return { date: pt.date, returnPct: ret };
  });
}

/** Performance by asset class from enriched holdings. */
export function calcClassPerformance(
  enrichedHoldings: Array<{
    asset: { assetClass: string; name: string; id: string };
    marketValueBase: number;
    costBasisBase: number;
    unrealisedPnlBase: number;
    unrealisedPnlPct: number;
  }>
): Array<{
  assetClass: string;
  totalValue: number;
  totalCost: number;
  pnl: number;
  pnlPct: number;
}> {
  const groups: Record<
    string,
    { totalValue: number; totalCost: number; pnl: number }
  > = {};

  for (const h of enrichedHoldings) {
    const cls = h.asset.assetClass;
    if (!groups[cls]) groups[cls] = { totalValue: 0, totalCost: 0, pnl: 0 };
    groups[cls].totalValue += h.marketValueBase;
    groups[cls].totalCost += h.costBasisBase;
    groups[cls].pnl += h.unrealisedPnlBase;
  }

  return Object.entries(groups).map(([cls, data]) => ({
    assetClass: cls,
    totalValue: data.totalValue,
    totalCost: data.totalCost,
    pnl: data.pnl,
    pnlPct: data.totalCost > 0 ? (data.pnl / data.totalCost) * 100 : 0,
  }));
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
