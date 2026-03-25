/**
 * Price fetching abstraction.
 *
 * Sources (in priority order, live overrides mock):
 *  1. CoinGecko public API  — crypto prices (free, no key)
 *  2. Yahoo Finance          — equity / ETF prices via yahoo-finance2 (free, no key)
 *  3. Mock fallback          — used when any live source fails
 *
 * Cash assets (isCash: true) are priced at 1 unit of their native currency.
 * FX conversion to base currency happens separately in fx.ts.
 */
import type { Asset, PriceMap } from "@/types";

// ---------------------------------------------------------------------------
// Fallback prices — updated when live fetch fails
// Prices are in the asset's native currency (see assets.json "currency" field)
// ---------------------------------------------------------------------------
const MOCK_PRICES: Record<string, { price: number; change24h: number; change7d: number }> = {
  // Crypto (USD)
  BTC:      { price: 87000,  change24h: 0, change7d: 0 },
  ETH:      { price: 2050,   change24h: 0, change7d: 0 },
  SOL:      { price: 140,    change24h: 0, change7d: 0 },
  LINK:     { price: 14.50,  change24h: 0, change7d: 0 },
  USDC:     { price: 1.0,    change24h: 0, change7d: 0 },
  USDT:     { price: 1.0,    change24h: 0, change7d: 0 },
  // Equities (native currency per assets.json)
  VUSA:     { price: 97.20,  change24h: 0, change7d: 0 },
  VWRL:     { price: 110.50, change24h: 0, change7d: 0 },
  AAPL:     { price: 213.50, change24h: 0, change7d: 0 },
  NVDA:     { price: 875.00, change24h: 0, change7d: 0 },
  // Cash — always 1 unit of their currency
  GBP_CASH: { price: 1.0, change24h: 0, change7d: 0 },
  USD_CASH: { price: 1.0, change24h: 0, change7d: 0 },
  EUR_CASH: { price: 1.0, change24h: 0, change7d: 0 },
};

// ---------------------------------------------------------------------------
// CoinGecko — crypto prices
// ---------------------------------------------------------------------------
async function fetchCoinGeckoPrices(assets: Asset[]): Promise<PriceMap> {
  const cryptoAssets = assets.filter((a) => a.assetClass === "crypto" && a.coingeckoId && !a.isCash);
  if (cryptoAssets.length === 0) return {};

  const ids = cryptoAssets.map((a) => a.coingeckoId!).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_7d_change=true`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    const data: Record<string, Record<string, number>> = await res.json();
    const priceMap: PriceMap = {};
    const now = new Date().toISOString();

    for (const asset of cryptoAssets) {
      const d = data[asset.coingeckoId!];
      if (!d) continue;
      priceMap[asset.id] = {
        assetId: asset.id,
        price: d["usd"] ?? 0,
        currency: "USD",
        change24hPct: d["usd_24h_change"] ?? 0,
        change7dPct: d["usd_7d_change"] ?? 0,
        fetchedAt: now,
      };
    }
    return priceMap;
  } catch (err) {
    console.warn("[prices] CoinGecko fetch failed:", err);
    return {};
  }
}

// ---------------------------------------------------------------------------
// Yahoo Finance — equities and ETFs
// ---------------------------------------------------------------------------
async function fetchYahooPrices(assets: Asset[]): Promise<PriceMap> {
  const equityAssets = assets.filter((a) => a.assetClass === "equity" && a.yahooSymbol);
  if (equityAssets.length === 0) return {};

  // yahoo-finance2 is a server-only package — dynamic import keeps it out of client bundles
  // v3 API requires instantiation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const YahooFinance = (await import("yahoo-finance2")).default as any;
  const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

  const priceMap: PriceMap = {};
  const now = new Date().toISOString();

  // Fetch all symbols in parallel
  const results = await Promise.allSettled(
    equityAssets.map(async (asset) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quote: any = await yahooFinance.quote(asset.yahooSymbol!, {}, { validateResult: false });
      return { asset, quote };
    })
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("[prices] Yahoo Finance fetch failed for an asset:", result.reason);
      continue;
    }
    const { asset, quote } = result.value;
    if (!quote || !quote.regularMarketPrice) continue;

    priceMap[asset.id] = {
      assetId: asset.id,
      price: quote.regularMarketPrice as number,
      currency: (quote.currency ?? asset.currency) as typeof asset.currency,
      change24hPct: (quote.regularMarketChangePercent as number) ?? 0,
      change7dPct: 0, // Yahoo doesn't return 7d in the basic quote endpoint
      marketCap: quote.marketCap as number | undefined,
      volume24h: quote.regularMarketVolume as number | undefined,
      fetchedAt: now,
    };
  }

  return priceMap;
}

// ---------------------------------------------------------------------------
// Stablecoin and cash — always priced at 1 unit of native currency
// ---------------------------------------------------------------------------
function buildCashPrices(assets: Asset[]): PriceMap {
  const priceMap: PriceMap = {};
  const now = new Date().toISOString();

  const cashAssets = assets.filter((a) => a.isCash);
  for (const asset of cashAssets) {
    priceMap[asset.id] = {
      assetId: asset.id,
      price: 1,
      currency: asset.currency,
      change24hPct: 0,
      change7dPct: 0,
      fetchedAt: now,
    };
  }
  return priceMap;
}

// ---------------------------------------------------------------------------
// Mock fallback
// ---------------------------------------------------------------------------
function buildMockPrices(assets: Asset[]): PriceMap {
  const priceMap: PriceMap = {};
  const now = new Date().toISOString();

  for (const asset of assets) {
    const mock = MOCK_PRICES[asset.id];
    if (mock) {
      priceMap[asset.id] = {
        assetId: asset.id,
        price: mock.price,
        currency: asset.currency,
        change24hPct: mock.change24h,
        change7dPct: mock.change7d,
        fetchedAt: now,
      };
    }
  }
  return priceMap;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export async function fetchAllPrices(assets: Asset[]): Promise<PriceMap> {
  // Layer 1: mock baseline (guarantees every asset has a price)
  const mockMap = buildMockPrices(assets);

  // Layer 2: cash/stablecoins (always accurate — no API needed)
  const cashMap = buildCashPrices(assets);

  // Layer 3: live crypto + equities in parallel
  const [cryptoMap, equityMap] = await Promise.all([
    fetchCoinGeckoPrices(assets),
    fetchYahooPrices(assets),
  ]);

  // Later layers override earlier ones
  return { ...mockMap, ...cashMap, ...cryptoMap, ...equityMap };
}

export function getMockPrices(assets: Asset[]): PriceMap {
  return { ...buildMockPrices(assets), ...buildCashPrices(assets) };
}
