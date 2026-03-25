import { NextResponse } from "next/server";
import { getTransactions, getAssets, getAccounts } from "@/lib/data/loader";

export async function GET() {
  try {
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
    }));

    return NextResponse.json({ transactions: enriched });
  } catch (err) {
    console.error("Transactions API error:", err);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}
