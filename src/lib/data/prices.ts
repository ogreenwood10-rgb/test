/**
 * Price fetching abstraction.
 * - Fetches live crypto prices from CoinGecko public API (no key required for basic use)
 * - Uses mock/fallback prices for equities (swap in a real API key later)
 * - Returns a PriceMap keyed by assetId
 */
import type { Asset, PriceMap, PriceQuote } from "@/types";

// Fallback/mock prices for when APIs are unavailable
const MOCK_PRICES: Record<string, { price: number; change24h: number; change7d: number }> = {
  BTC:      { price: 87000,  change24h: 2.4,   change7d: 5.1  },
  ETH:      { price: 2050,   change24h: 1.8,   change7d: -2.3 },
  SOL:      { price: 140,    change24h: 3.2,   change7d: 8.5  },
  LINK:     { price: 14.50,  change24h: -0.8,  change7d: 1.2  },
  USDC:     { price: 1.0,    change24h: 0.01,  change7d: 0.0  },
  VUSA:     { price: 97.20,  change24h: 0.4,   change7d: 1.1  },
  VWRL:     { price: 110.50, change24h: 0.3,   change7d: 0.9  },
  AAPL:     { price: 213.50, change24h: 0.6,   change7d: 2.1  },
  NVDA:     { price: 875.00, change24h: 4.2,   change7d: 11.3 },
  GBP_CASH: { price: 1.0,    change24h: 0.0,   change7d: 0.0  },
  USD_CASH: { price: 0.787,  change24h: 0.0,   change7d: 0.0  }, // 1/1.27 GBP
};

async function fetchCoinGeckoPrices(
  assets: Asset[]
): Promise<PriceMap> {
  const cryptoAssets = assets.filter((a) => a.assetClass === "crypto" && a.coingeckoId);
  if (cryptoAssets.length === 0) return {};

  const ids = cryptoAssets.map((a) => a.coingeckoId!).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,gbp&include_24hr_change=true&include_7d_change=true`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 }, // cache for 5 minutes
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    const data: Record<string, Record<string, number>> = await res.json();
    const priceMap: PriceMap = {};

    for (const asset of cryptoAssets) {
      const cgData = data[asset.coingeckoId!];
      if (!cgData) continue;

      priceMap[asset.id] = {
        assetId: asset.id,
        price: cgData["usd"] ?? 0,
        currency: "USD",
        change24hPct: cgData["usd_24h_change"] ?? 0,
        change7dPct: cgData["usd_7d_change"] ?? 0,
        fetchedAt: new Date().toISOString(),
      };
    }
    return priceMap;
  } catch {
    // Silently fall back to mock prices
    return {};
  }
}

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

export async function fetchAllPrices(assets: Asset[]): Promise<PriceMap> {
  // Start with mock prices as baseline
  const mockMap = buildMockPrices(assets);

  // Attempt live crypto prices
  const liveMap = await fetchCoinGeckoPrices(assets);

  // Merge: live overrides mock
  return { ...mockMap, ...liveMap };
}

// For stale-while-revalidate pattern in API routes
export function getMockPrices(assets: Asset[]): PriceMap {
  return buildMockPrices(assets);
}
