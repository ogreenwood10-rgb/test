import { getGoals, getHoldings, getAssets, getAccounts, getTransactions, getConfig } from "@/lib/data/loader";
import { fetchAllPrices } from "@/lib/data/prices";
import { buildPortfolioSnapshot } from "@/lib/calculations/portfolio";
import { calcGoalProgress, buildForecastScenarios } from "@/lib/calculations/goals";
import { extractIncomeEvents, buildMonthlySummaries } from "@/lib/calculations/income";
import { setFxRates, fetchLiveFxRates } from "@/lib/utils/fx";
import { PageHeader } from "@/components/ui/PageHeader";
import { GoalsView } from "@/components/goals/GoalsView";

export const revalidate = 300;

export default async function GoalsPage() {
  const assets = getAssets();
  const accounts = getAccounts();
  const holdings = getHoldings();
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

  const incomeEvents = extractIncomeEvents(transactions);
  const monthlySummaries = buildMonthlySummaries(incomeEvents);

  // Monthly passive income (last 3 months avg)
  const recentMonthlyIncome =
    monthlySummaries.length > 0
      ? monthlySummaries.slice(-3).reduce((s, m) => s + m.totalBase, 0) /
        Math.min(3, monthlySummaries.length)
      : 0;

  const snapshotWithIncome = {
    ...snapshot,
    totalAnnualIncomeBase: recentMonthlyIncome * 12,
  };

  const goalProgress = calcGoalProgress(
    goals,
    snapshotWithIncome,
    config.contributionMonthly,
    config.growthAssumptionPct
  );

  const scenarios = buildForecastScenarios(
    snapshot.totalNetWorthBase,
    config.contributionMonthly,
    config.growthAssumptionPct
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Goals & Forecast"
        subtitle="Track progress toward financial targets and model future scenarios"
      />
      <GoalsView
        goalProgress={goalProgress}
        scenarios={scenarios}
        config={config}
        currentValue={snapshot.totalNetWorthBase}
        baseCurrency={config.baseCurrency}
      />
    </div>
  );
}
