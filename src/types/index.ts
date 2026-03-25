// ============================================================
// Core domain types for the portfolio monitoring tool
// ============================================================

export type Currency = "GBP" | "USD" | "EUR" | "BTC" | "ETH" | "USDC" | "USDT";

export type AssetClass = "crypto" | "equity" | "cash" | "property" | "other";

export type AccountType =
  | "exchange"
  | "wallet"
  | "isa"
  | "brokerage"
  | "bank"
  | "pension"
  | "other";

export type TransactionType =
  | "buy"
  | "sell"
  | "deposit"
  | "withdrawal"
  | "transfer_in"
  | "transfer_out"
  | "staking_reward"
  | "dividend"
  | "interest"
  | "fee"
  | "airdrop";

// ============================================================
// Config
// ============================================================

export interface AppConfig {
  baseCurrency: Currency;
  displayName: string;
  targetNetWorth: number;
  targetPassiveIncome: number;
  targetBtcStack: number;
  growthAssumptionPct: number;    // annual % for forecasting
  contributionMonthly: number;    // monthly contribution for forecasting
  yieldAssumptionPct: number;     // avg yield % assumption
}

// ============================================================
// FX Rates
// ============================================================

export interface FxRates {
  base: Currency;
  rates: Record<string, number>; // e.g. { USD: 1.27, EUR: 1.16 }
  updatedAt: string;
}

// ============================================================
// Accounts
// ============================================================

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  platform?: string;
  notes?: string;
}

// ============================================================
// Assets (master list of instruments)
// ============================================================

export interface Asset {
  id: string;            // e.g. "BTC", "AAPL", "VUSA"
  symbol: string;        // display ticker
  name: string;
  assetClass: AssetClass;
  currency: Currency;    // native pricing currency
  coingeckoId?: string;  // for crypto price lookups
  yahooSymbol?: string;  // for equity price lookups
  isCash?: boolean;
  notes?: string;
}

// ============================================================
// Holdings
// ============================================================

export interface Holding {
  id: string;
  assetId: string;
  accountId: string;
  quantity: number;
  avgCostPerUnit: number;   // in the asset's native currency
  avgCostCurrency: Currency;
  notes?: string;
  tags?: string[];
}

// Computed/enriched holding (calculated at runtime)
export interface EnrichedHolding extends Holding {
  asset: Asset;
  account: Account;
  currentPrice: number;
  currentPriceCurrency: Currency;
  marketValueNative: number;     // quantity × current price (native)
  marketValueBase: number;       // converted to base currency
  costBasisNative: number;       // quantity × avg cost (native)
  costBasisBase: number;
  unrealisedPnlNative: number;
  unrealisedPnlBase: number;
  unrealisedPnlPct: number;
  realisedPnlBase: number;
  annualYieldPct: number;
  annualIncomeBase: number;
  priceChange24hPct: number;
  allocationPct: number;         // % of total portfolio
}

// ============================================================
// Transactions
// ============================================================

export interface Transaction {
  id: string;
  date: string;                  // ISO 8601
  type: TransactionType;
  assetId: string;
  accountId: string;
  quantity: number;              // units of asset (positive)
  pricePerUnit: number;          // price at time of transaction
  priceCurrency: Currency;
  feeAmount: number;
  feeCurrency: Currency;
  notes?: string;
  tags?: string[];
}

// ============================================================
// Price Data
// ============================================================

export interface PriceQuote {
  assetId: string;
  price: number;
  currency: Currency;
  change24hPct: number;
  change7dPct: number;
  marketCap?: number;
  volume24h?: number;
  fetchedAt: string;
}

export interface PriceMap {
  [assetId: string]: PriceQuote;
}

// ============================================================
// Portfolio snapshot (computed)
// ============================================================

export interface PortfolioSnapshot {
  totalNetWorthBase: number;
  totalMarketValueBase: number;
  totalCostBasisBase: number;
  totalUnrealisedPnlBase: number;
  totalUnrealisedPnlPct: number;
  totalRealisedPnlBase: number;
  totalAnnualIncomeBase: number;
  totalYieldPct: number;
  cashAvailableBase: number;
  allocationByClass: AllocationBreakdown[];
  allocationByAccount: AllocationBreakdown[];
  allocationByCurrency: AllocationBreakdown[];
  topGainers: EnrichedHolding[];
  topLosers: EnrichedHolding[];
  enrichedHoldings: EnrichedHolding[];
  snapshotDate: string;
}

export interface AllocationBreakdown {
  label: string;
  valueBase: number;
  pct: number;
  color: string;
}

// ============================================================
// Performance
// ============================================================

export interface PerformanceDataPoint {
  date: string;
  portfolioValueBase: number;
  cumulativeContributed: number;
  cumulativeGain: number;
  twr?: number;   // time-weighted return % cumulative
}

export interface DrawdownPoint {
  date: string;
  drawdownPct: number;
}

// ============================================================
// Income
// ============================================================

export interface IncomeEvent {
  date: string;
  assetId: string;
  accountId: string;
  type: "staking_reward" | "dividend" | "interest" | "airdrop";
  amountNative: number;
  amountBase: number;
  currency: Currency;
}

export interface MonthlyIncomeSummary {
  month: string; // "2024-01"
  totalBase: number;
  byType: Record<string, number>;
  byAsset: Record<string, number>;
}

// ============================================================
// Goals / Forecasting
// ============================================================

export interface Goal {
  id: string;
  label: string;
  type: "net_worth" | "crypto_stack" | "passive_income" | "custom";
  targetValue: number;
  targetCurrency: Currency;
  assetId?: string;          // for crypto stack goals
  deadline?: string;         // ISO date
  notes?: string;
}

export interface ForecastScenario {
  label: string;
  monthlyContribution: number;
  annualGrowthPct: number;
  annualYieldPct: number;
  dataPoints: ForecastPoint[];
}

export interface ForecastPoint {
  date: string;
  projectedValue: number;
  contributed: number;
  growth: number;
}
