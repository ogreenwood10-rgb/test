import { getHoldings, getAssets, getAccounts, getTransactions, getConfig } from "@/lib/data/loader";
import { fetchAllPrices } from "@/lib/data/prices";
import { buildPortfolioSnapshot } from "@/lib/calculations/portfolio";
import { buildPerformanceHistory, calcDrawdowns, calcRollingReturns, calcClassPerformance } from "@/lib/calculations/performance";
import { setFxRates, getFxRates } from "@/lib/utils/fx";
import { PageHeader } from "@/components/ui/PageHeader";
import { PerformanceCharts } from "@/components/performance/PerformanceCharts";
import { formatCurrency } from "@/lib/utils/format";
import { StatTile } from "@/components/ui/StatTile";
import { TrendingUp, BarChart2, ArrowDown } from "lucide-react";

export const revalidate = 300;

export default async function PerformancePage() {
  const assets = getAssets();
  const accounts = getAccounts();
  const holdings = getHoldings();
  const transactions = getTransactions();
  const config = getConfig();

  setFxRates(getFxRates());
  const prices = await fetchAllPrices(assets);
  const assetsMap = new Map(assets.map((a) => [a.id, a]));
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));
  const snapshot = buildPortfolioSnapshot(holdings, assetsMap, accountsMap, prices, transactions);

  const history = buildPerformanceHistory(transactions, snapshot.totalMarketValueBase);
  const drawdowns = calcDrawdowns(history);
  const rolling3m = calcRollingReturns(history, 3);
  const classPerf = calcClassPerformance(snapshot.enrichedHoldings);

  const maxDrawdown = drawdowns.length > 0 ? Math.min(...drawdowns.map((d) => d.drawdownPct)) : 0;
  const totalReturn =
    snapshot.totalCostBasisBase > 0
      ? ((snapshot.totalMarketValueBase - snapshot.totalCostBasisBase) / snapshot.totalCostBasisBase) * 100
      : 0;

  const cur = config.baseCurrency;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Performance Analytics"
        subtitle="Portfolio returns, drawdowns, and class breakdown"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Return"
          value={`${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`}
          subValue={`${formatCurrency(snapshot.totalUnrealisedPnlBase, cur)} unrealised`}
          icon={<TrendingUp size={14} />}
          accent={totalReturn >= 0 ? "green" : "red"}
        />
        <StatTile
          label="Portfolio Value"
          value={formatCurrency(snapshot.totalMarketValueBase, cur)}
          subValue="Current"
          icon={<BarChart2 size={14} />}
          accent="blue"
        />
        <StatTile
          label="Cost Basis"
          value={formatCurrency(snapshot.totalCostBasisBase, cur)}
          subValue="Total deployed"
          icon={<BarChart2 size={14} />}
          accent="violet"
        />
        <StatTile
          label="Max Drawdown"
          value={`${maxDrawdown.toFixed(2)}%`}
          subValue="From peak"
          icon={<ArrowDown size={14} />}
          accent="red"
        />
      </div>

      <PerformanceCharts
        history={history}
        drawdowns={drawdowns}
        rolling3m={rolling3m}
        classPerformance={classPerf}
        baseCurrency={cur}
      />
    </div>
  );
}
