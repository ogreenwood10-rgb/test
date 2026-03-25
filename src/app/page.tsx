import { getHoldings, getAssets, getAccounts, getTransactions, getGoals, getConfig } from "@/lib/data/loader";
import { fetchAllPrices } from "@/lib/data/prices";
import { buildPortfolioSnapshot } from "@/lib/calculations/portfolio";
import { buildPerformanceHistory } from "@/lib/calculations/performance";
import { calcGoalProgress } from "@/lib/calculations/goals";
import { extractIncomeEvents } from "@/lib/calculations/income";
import { setFxRates, fetchLiveFxRates } from "@/lib/utils/fx";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { AllocationSection } from "@/components/dashboard/AllocationSection";
import { TopMovers } from "@/components/dashboard/TopMovers";
import { PortfolioChart } from "@/components/dashboard/PortfolioChart";
import { GoalProgressWidget } from "@/components/dashboard/GoalProgressWidget";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { StatTile } from "@/components/ui/StatTile";
import { DollarSign, TrendingUp, Wallet, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { Transaction, Asset, Account } from "@/types";

export const revalidate = 300;

async function getPortfolioData() {
  const holdings = getHoldings();
  const assets = getAssets();
  const accounts = getAccounts();
  const transactions = getTransactions();
  const goals = getGoals();
  const config = getConfig();

  const [fxRates, prices] = await Promise.all([
    fetchLiveFxRates(config.baseCurrency),
    fetchAllPrices(assets),
  ]);
  setFxRates(fxRates);
  const assetsMap = new Map(assets.map((a) => [a.id, a]));
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));

  const snapshot = buildPortfolioSnapshot(holdings, assetsMap, accountsMap, prices, transactions);
  const history = buildPerformanceHistory(transactions, snapshot.totalMarketValueBase);
  const goalProgress = calcGoalProgress(goals, snapshot, config.contributionMonthly, config.growthAssumptionPct);
  const incomeEvents = extractIncomeEvents(transactions);

  const enrichedTxs = transactions.slice(0, 10).map((tx) => ({
    ...tx,
    asset: assetsMap.get(tx.assetId) ?? null,
    account: accountsMap.get(tx.accountId) ?? null,
    totalValue: tx.quantity * tx.pricePerUnit,
  }));

  return { snapshot, history, goalProgress, incomeEvents, enrichedTxs, config };
}

export default async function DashboardPage() {
  const { snapshot, history, goalProgress, enrichedTxs, config } = await getPortfolioData();
  const cur = config.baseCurrency;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <NetWorthHero snapshot={snapshot} config={config} />

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Portfolio Value"
          value={formatCurrency(snapshot.totalMarketValueBase, cur)}
          subValue={`${snapshot.enrichedHoldings.length} positions`}
          icon={<Wallet size={14} />}
          accent="blue"
        />
        <StatTile
          label="Unrealised P&L"
          value={formatCurrency(snapshot.totalUnrealisedPnlBase, cur)}
          change={snapshot.totalUnrealisedPnlPct}
          changeLabel="vs cost"
          icon={<TrendingUp size={14} />}
          accent={snapshot.totalUnrealisedPnlBase >= 0 ? "green" : "red"}
        />
        <StatTile
          label="Annual Yield"
          value={formatCurrency(snapshot.totalAnnualIncomeBase, cur)}
          subValue={`${snapshot.totalYieldPct.toFixed(2)}% blended yield`}
          icon={<DollarSign size={14} />}
          accent="amber"
        />
        <StatTile
          label="Cash Reserve"
          value={formatCurrency(snapshot.cashAvailableBase, cur)}
          subValue="Liquid / deployable"
          icon={<Shield size={14} />}
          accent="violet"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PortfolioChart history={history} baseCurrency={cur} />
        </div>
        <AllocationSection snapshot={snapshot} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={enrichedTxs as Array<Transaction & { asset: Asset | null; account: Account | null; totalValue: number }>}
            baseCurrency={cur}
          />
        </div>
        <GoalProgressWidget goals={goalProgress} baseCurrency={cur} />
      </div>

      {/* Top movers */}
      <TopMovers
        gainers={snapshot.topGainers}
        losers={snapshot.topLosers}
        baseCurrency={cur}
      />
    </div>
  );
}
