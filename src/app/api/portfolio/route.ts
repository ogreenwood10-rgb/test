import { NextResponse } from "next/server";
import { getHoldings, getAssets, getAccounts, getTransactions, getConfig } from "@/lib/data/loader";
import { fetchAllPrices } from "@/lib/data/prices";
import { buildPortfolioSnapshot } from "@/lib/calculations/portfolio";
import { setFxRates, fetchLiveFxRates } from "@/lib/utils/fx";

export async function GET() {
  try {
    const [holdings, assets, accounts, transactions, config] = [
      getHoldings(),
      getAssets(),
      getAccounts(),
      getTransactions(),
      getConfig(),
    ];

    // Fetch live FX rates and prices in parallel
    const [fxRates, prices] = await Promise.all([
      fetchLiveFxRates(config.baseCurrency),
      fetchAllPrices(assets),
    ]);
    setFxRates(fxRates);

    // Build lookup maps
    const assetsMap = new Map(assets.map((a) => [a.id, a]));
    const accountsMap = new Map(accounts.map((a) => [a.id, a]));

    const snapshot = buildPortfolioSnapshot(holdings, assetsMap, accountsMap, prices, transactions);

    return NextResponse.json({
      snapshot,
      config,
      prices,
      baseCurrency: config.baseCurrency,
    });
  } catch (err) {
    console.error("Portfolio API error:", err);
    return NextResponse.json({ error: "Failed to build portfolio" }, { status: 500 });
  }
}
