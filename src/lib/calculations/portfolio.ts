/**
 * Core portfolio calculation engine.
 * All values are computed deterministically from holdings + prices + fx rates.
 */
import type {
  Holding,
  Asset,
  Account,
  EnrichedHolding,
  PriceMap,
  PortfolioSnapshot,
  AllocationBreakdown,
  Transaction,
} from "@/types";
import { toBase } from "@/lib/utils/fx";

// Colour palette for allocation charts
const ASSET_CLASS_COLORS: Record<string, string> = {
  crypto:   "#f59e0b",
  equity:   "#3b82f6",
  cash:     "#10b981",
  property: "#8b5cf6",
  other:    "#6b7280",
};

const ACCOUNT_COLORS = [
  "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6",
  "#ef4444", "#06b6d4", "#f97316", "#84cc16",
];

const CURRENCY_COLORS: Record<string, string> = {
  GBP:  "#10b981",
  USD:  "#3b82f6",
  EUR:  "#8b5cf6",
  BTC:  "#f59e0b",
  ETH:  "#6366f1",
  USDC: "#06b6d4",
  USDT: "#22d3ee",
};

// Annual yield rates by asset (where not derivable from transaction history)
const DEFAULT_YIELD_RATES: Record<string, number> = {
  ETH:      4.0,
  SOL:      6.5,
  GBP_CASH: 4.5, // savings account rate
  VUSA:     1.3,
  VWRL:     1.8,
  AAPL:     0.5,
};

/** Calculate realised P&L for an asset from transaction history (FIFO). */
export function calcRealisedPnl(
  assetId: string,
  transactions: Transaction[],
  baseCurrency: string
): number {
  const assetTxs = transactions
    .filter((tx) => tx.assetId === assetId && ["buy", "sell"].includes(tx.type))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const buyQueue: { qty: number; costPerUnit: number; currency: string }[] = [];
  let realisedPnl = 0;

  for (const tx of assetTxs) {
    if (tx.type === "buy") {
      buyQueue.push({ qty: tx.quantity, costPerUnit: tx.pricePerUnit, currency: tx.priceCurrency });
    } else if (tx.type === "sell") {
      let qtyToSell = tx.quantity;
      const salePrice = toBase(tx.pricePerUnit, tx.priceCurrency);

      while (qtyToSell > 0 && buyQueue.length > 0) {
        const lot = buyQueue[0];
        const qtySold = Math.min(qtyToSell, lot.qty);
        const costBasis = toBase(lot.costPerUnit, lot.currency);
        realisedPnl += qtySold * (salePrice - costBasis);
        lot.qty -= qtySold;
        qtyToSell -= qtySold;
        if (lot.qty <= 0) buyQueue.shift();
      }
    }
  }

  return realisedPnl;
}

/** Enrich a single holding with current prices and computed metrics. */
export function enrichHolding(
  holding: Holding,
  asset: Asset,
  account: Account,
  prices: PriceMap,
  transactions: Transaction[],
  totalPortfolioValueBase: number
): EnrichedHolding {
  const quote = prices[holding.assetId];
  const currentPrice = quote?.price ?? 0;
  const priceCurrency = quote?.currency ?? asset.currency;

  const marketValueNative = holding.quantity * currentPrice;
  const marketValueBase = toBase(marketValueNative, priceCurrency);

  const costBasisNative = holding.quantity * holding.avgCostPerUnit;
  const costBasisBase = toBase(costBasisNative, holding.avgCostCurrency);

  const unrealisedPnlNative = marketValueNative - toBase(costBasisBase, priceCurrency);
  const unrealisedPnlBase = marketValueBase - costBasisBase;
  const unrealisedPnlPct = costBasisBase > 0 ? (unrealisedPnlBase / costBasisBase) * 100 : 0;

  const realisedPnlBase = calcRealisedPnl(asset.id, transactions, "GBP");

  const yieldRate = DEFAULT_YIELD_RATES[asset.id] ?? 0;
  const annualIncomeBase = (marketValueBase * yieldRate) / 100;
  const annualYieldPct = yieldRate;

  const allocationPct =
    totalPortfolioValueBase > 0 ? (marketValueBase / totalPortfolioValueBase) * 100 : 0;

  return {
    ...holding,
    asset,
    account,
    currentPrice,
    currentPriceCurrency: priceCurrency,
    marketValueNative,
    marketValueBase,
    costBasisNative,
    costBasisBase,
    unrealisedPnlNative,
    unrealisedPnlBase,
    unrealisedPnlPct,
    realisedPnlBase,
    annualYieldPct,
    annualIncomeBase,
    priceChange24hPct: quote?.change24hPct ?? 0,
    allocationPct,
  };
}

/** Build the full portfolio snapshot from raw data. */
export function buildPortfolioSnapshot(
  holdings: Holding[],
  assetsMap: Map<string, Asset>,
  accountsMap: Map<string, Account>,
  prices: PriceMap,
  transactions: Transaction[]
): PortfolioSnapshot {
  // First pass: compute market values to get total
  const rawValues = holdings.map((h) => {
    const asset = assetsMap.get(h.assetId);
    const quote = prices[h.assetId];
    if (!asset || !quote) return 0;
    return toBase(h.quantity * quote.price, quote.currency);
  });
  const totalMarketValueBase = rawValues.reduce((s, v) => s + v, 0);

  // Second pass: enrich all holdings
  const enrichedHoldings = holdings
    .map((h) => {
      const asset = assetsMap.get(h.assetId);
      const account = accountsMap.get(h.accountId);
      if (!asset || !account) return null;
      return enrichHolding(h, asset, account, prices, transactions, totalMarketValueBase);
    })
    .filter((h): h is EnrichedHolding => h !== null)
    .sort((a, b) => b.marketValueBase - a.marketValueBase);

  const totalCostBasisBase = enrichedHoldings.reduce((s, h) => s + h.costBasisBase, 0);
  const totalUnrealisedPnlBase = enrichedHoldings.reduce((s, h) => s + h.unrealisedPnlBase, 0);
  const totalUnrealisedPnlPct =
    totalCostBasisBase > 0 ? (totalUnrealisedPnlBase / totalCostBasisBase) * 100 : 0;
  const totalRealisedPnlBase = enrichedHoldings.reduce((s, h) => s + h.realisedPnlBase, 0);
  const totalAnnualIncomeBase = enrichedHoldings.reduce((s, h) => s + h.annualIncomeBase, 0);
  const totalYieldPct =
    totalMarketValueBase > 0 ? (totalAnnualIncomeBase / totalMarketValueBase) * 100 : 0;

  const cashHoldings = enrichedHoldings.filter(
    (h) => h.asset.isCash || h.asset.assetClass === "cash"
  );
  const cashAvailableBase = cashHoldings.reduce((s, h) => s + h.marketValueBase, 0);

  // Allocation breakdowns
  const allocationByClass = buildAllocationByClass(enrichedHoldings, totalMarketValueBase);
  const allocationByAccount = buildAllocationByAccount(enrichedHoldings, totalMarketValueBase);
  const allocationByCurrency = buildAllocationByCurrency(enrichedHoldings, totalMarketValueBase);

  // Top movers (by 24h change %)
  const movableHoldings = enrichedHoldings.filter((h) => !h.asset.isCash);
  const topGainers = [...movableHoldings]
    .sort((a, b) => b.priceChange24hPct - a.priceChange24hPct)
    .slice(0, 4);
  const topLosers = [...movableHoldings]
    .sort((a, b) => a.priceChange24hPct - b.priceChange24hPct)
    .slice(0, 4);

  return {
    totalNetWorthBase: totalMarketValueBase,
    totalMarketValueBase,
    totalCostBasisBase,
    totalUnrealisedPnlBase,
    totalUnrealisedPnlPct,
    totalRealisedPnlBase,
    totalAnnualIncomeBase,
    totalYieldPct,
    cashAvailableBase,
    allocationByClass,
    allocationByAccount,
    allocationByCurrency,
    topGainers,
    topLosers,
    enrichedHoldings,
    snapshotDate: new Date().toISOString(),
  };
}

function buildAllocationByClass(
  holdings: EnrichedHolding[],
  total: number
): AllocationBreakdown[] {
  const groups: Record<string, number> = {};
  for (const h of holdings) {
    const cls = h.asset.assetClass;
    groups[cls] = (groups[cls] ?? 0) + h.marketValueBase;
  }
  return Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .map(([label, valueBase]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      valueBase,
      pct: total > 0 ? (valueBase / total) * 100 : 0,
      color: ASSET_CLASS_COLORS[label] ?? "#6b7280",
    }));
}

function buildAllocationByAccount(
  holdings: EnrichedHolding[],
  total: number
): AllocationBreakdown[] {
  const groups: Record<string, { value: number; label: string }> = {};
  for (const h of holdings) {
    const key = h.accountId;
    if (!groups[key]) groups[key] = { value: 0, label: h.account.name };
    groups[key].value += h.marketValueBase;
  }
  return Object.entries(groups)
    .sort((a, b) => b[1].value - a[1].value)
    .map(([, { value, label }], i) => ({
      label,
      valueBase: value,
      pct: total > 0 ? (value / total) * 100 : 0,
      color: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
    }));
}

function buildAllocationByCurrency(
  holdings: EnrichedHolding[],
  total: number
): AllocationBreakdown[] {
  const groups: Record<string, number> = {};
  for (const h of holdings) {
    const cur = h.asset.currency;
    groups[cur] = (groups[cur] ?? 0) + h.marketValueBase;
  }
  return Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .map(([label, valueBase]) => ({
      label,
      valueBase,
      pct: total > 0 ? (valueBase / total) * 100 : 0,
      color: CURRENCY_COLORS[label] ?? "#6b7280",
    }));
}
