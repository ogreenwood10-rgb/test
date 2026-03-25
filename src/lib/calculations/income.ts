/**
 * Income and yield calculation engine.
 */
import type { Transaction, IncomeEvent, MonthlyIncomeSummary } from "@/types";
import { toBase } from "@/lib/utils/fx";

const INCOME_TYPES = new Set(["staking_reward", "dividend", "interest", "airdrop"]);

/** Extract all income events from transaction history. */
export function extractIncomeEvents(transactions: Transaction[]): IncomeEvent[] {
  return transactions
    .filter((tx) => INCOME_TYPES.has(tx.type))
    .map((tx) => {
      const amountNative = tx.quantity * tx.pricePerUnit;
      return {
        date: tx.date,
        assetId: tx.assetId,
        accountId: tx.accountId,
        type: tx.type as IncomeEvent["type"],
        amountNative,
        amountBase: toBase(amountNative, tx.priceCurrency),
        currency: tx.priceCurrency,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Group income events into monthly summaries. */
export function buildMonthlySummaries(events: IncomeEvent[]): MonthlyIncomeSummary[] {
  const groups: Record<string, MonthlyIncomeSummary> = {};

  for (const event of events) {
    const month = event.date.substring(0, 7);
    if (!groups[month]) {
      groups[month] = { month, totalBase: 0, byType: {}, byAsset: {} };
    }
    const g = groups[month];
    g.totalBase += event.amountBase;
    g.byType[event.type] = (g.byType[event.type] ?? 0) + event.amountBase;
    g.byAsset[event.assetId] = (g.byAsset[event.assetId] ?? 0) + event.amountBase;
  }

  return Object.values(groups).sort((a, b) => a.month.localeCompare(b.month));
}

/** Annualised income by asset using last 12 months of events. */
export function calcAnnualisedIncomeByAsset(
  events: IncomeEvent[]
): Record<string, number> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const last12 = events.filter((e) => new Date(e.date) >= cutoff);
  const byAsset: Record<string, number> = {};
  for (const e of last12) {
    byAsset[e.assetId] = (byAsset[e.assetId] ?? 0) + e.amountBase;
  }
  return byAsset;
}

/** Total income for a given period. */
export function calcTotalIncome(
  events: IncomeEvent[],
  fromDate?: Date,
  toDate?: Date
): number {
  return events
    .filter((e) => {
      const d = new Date(e.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    })
    .reduce((s, e) => s + e.amountBase, 0);
}
