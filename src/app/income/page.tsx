import { getTransactions, getAssets, getAccounts, getConfig } from "@/lib/data/loader";
import { extractIncomeEvents, buildMonthlySummaries, calcTotalIncome } from "@/lib/calculations/income";
import { setFxRates, getFxRates } from "@/lib/utils/fx";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { IncomeView } from "@/components/income/IncomeView";
import { formatCurrency } from "@/lib/utils/format";
import { DollarSign, TrendingUp } from "lucide-react";

export default function IncomePage() {
  const transactions = getTransactions();
  const assets = getAssets();
  const accounts = getAccounts();
  const config = getConfig();

  setFxRates(getFxRates());

  const assetsMap = new Map(assets.map((a) => [a.id, a]));
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));

  const incomeEvents = extractIncomeEvents(transactions);
  const monthlySummaries = buildMonthlySummaries(incomeEvents);

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const ytdIncome = calcTotalIncome(incomeEvents, yearStart);
  const mtdIncome = calcTotalIncome(incomeEvents, monthStart);
  const totalIncome = calcTotalIncome(incomeEvents);

  const annualRunRate =
    monthlySummaries.length > 0
      ? (monthlySummaries
          .slice(-6)
          .reduce((s, m) => s + m.totalBase, 0) /
          Math.min(monthlySummaries.length, 6)) *
        12
      : 0;

  const cur = config.baseCurrency;

  // Enrich income events
  const enrichedEvents = incomeEvents.map((e) => ({
    ...e,
    asset: assetsMap.get(e.assetId) ?? null,
    account: accountsMap.get(e.accountId) ?? null,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Income & Yield"
        subtitle="Staking rewards, dividends, and interest earned"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="This Month"
          value={formatCurrency(mtdIncome, cur)}
          icon={<DollarSign size={14} />}
          accent="green"
        />
        <StatTile
          label="Year to Date"
          value={formatCurrency(ytdIncome, cur)}
          icon={<TrendingUp size={14} />}
          accent="blue"
        />
        <StatTile
          label="All Time"
          value={formatCurrency(totalIncome, cur)}
          icon={<DollarSign size={14} />}
          accent="violet"
        />
        <StatTile
          label="Annual Run Rate"
          value={formatCurrency(annualRunRate, cur)}
          subValue="Based on last 6 months"
          icon={<TrendingUp size={14} />}
          accent="amber"
        />
      </div>

      <IncomeView
        monthlySummaries={monthlySummaries}
        incomeEvents={enrichedEvents}
        baseCurrency={cur}
      />
    </div>
  );
}
