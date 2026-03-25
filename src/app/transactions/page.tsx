import { getTransactions, getAssets, getAccounts } from "@/lib/data/loader";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Transaction, Asset, Account } from "@/types";

export default function TransactionsPage() {
  const transactions = getTransactions();
  const assets = getAssets();
  const accounts = getAccounts();

  const assetsMap = new Map(assets.map((a) => [a.id, a]));
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));

  const enriched = transactions.map((tx) => ({
    ...tx,
    asset: assetsMap.get(tx.assetId) ?? null,
    account: accountsMap.get(tx.accountId) ?? null,
    totalValue: tx.quantity * tx.pricePerUnit,
  })) as Array<Transaction & { asset: Asset | null; account: Account | null; totalValue: number }>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Transactions"
        subtitle="Full ledger of all portfolio activity"
      />
      <TransactionsTable transactions={enriched} />
    </div>
  );
}
