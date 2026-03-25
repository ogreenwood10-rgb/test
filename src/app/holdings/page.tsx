import { getHoldings, getAssets, getAccounts, getTransactions, getConfig } from "@/lib/data/loader";
import { fetchAllPrices } from "@/lib/data/prices";
import { buildPortfolioSnapshot } from "@/lib/calculations/portfolio";
import { setFxRates, fetchLiveFxRates } from "@/lib/utils/fx";
import { HoldingsTable } from "@/components/holdings/HoldingsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { formatCurrency } from "@/lib/utils/format";
import { Wallet, TrendingUp, BarChart2, DollarSign } from "lucide-react";

export const revalidate = 300;

export default async function HoldingsPage() {
  const assets = getAssets();
  const accounts = getAccounts();
  const holdings = getHoldings();
  const transactions = getTransactions();
  const config = getConfig();

  const [fxRates, prices] = await Promise.all([
    fetchLiveFxRates(config.baseCurrency),
    fetchAllPrices(assets),
  ]);
  setFxRates(fxRates);
  const assetsMap = new Map(assets.map((a) => [a.id, a]));
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));
  const snapshot = buildPortfolioSnapshot(holdings, assetsMap, accountsMap, prices, transactions);

  const cur = config.baseCurrency;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Holdings"
        subtitle="All positions across accounts and asset classes"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Value"
          value={formatCurrency(snapshot.totalMarketValueBase, cur)}
          icon={<Wallet size={14} />}
          accent="blue"
        />
        <StatTile
          label="Cost Basis"
          value={formatCurrency(snapshot.totalCostBasisBase, cur)}
          icon={<BarChart2 size={14} />}
          accent="violet"
        />
        <StatTile
          label="Unrealised P&L"
          value={formatCurrency(snapshot.totalUnrealisedPnlBase, cur)}
          change={snapshot.totalUnrealisedPnlPct}
          icon={<TrendingUp size={14} />}
          accent={snapshot.totalUnrealisedPnlBase >= 0 ? "green" : "red"}
        />
        <StatTile
          label="Annual Income"
          value={formatCurrency(snapshot.totalAnnualIncomeBase, cur)}
          subValue={`${snapshot.totalYieldPct.toFixed(2)}% yield`}
          icon={<DollarSign size={14} />}
          accent="amber"
        />
      </div>

      <HoldingsTable holdings={snapshot.enrichedHoldings} baseCurrency={cur} />
    </div>
  );
}
