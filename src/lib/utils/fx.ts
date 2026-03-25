/**
 * FX conversion engine.
 *
 * Live rates fetched from Frankfurter API (https://api.frankfurter.app)
 * which provides ECB rates — free, no API key, updated daily.
 * Falls back to fx-rates.json if the API is unavailable.
 */
import type { Currency, FxRates } from "@/types";
import fallbackRates from "@/data/fx-rates.json";

let _rates: FxRates = fallbackRates as FxRates;

export function setFxRates(rates: FxRates): void {
  _rates = rates;
}

export function getFxRates(): FxRates {
  return _rates;
}

/**
 * Fetch live FX rates from Frankfurter API (ECB rates, updated daily).
 * Returns the stored fallback rates if the fetch fails.
 *
 * Rates are returned as "1 GBP = X foreign currency" to match our internal format.
 */
export async function fetchLiveFxRates(baseCurrency: string = "GBP"): Promise<FxRates> {
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${baseCurrency}`,
      { next: { revalidate: 3600 } } // cache for 1 hour — ECB rates only update daily
    );
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);

    const data: { base: string; date: string; rates: Record<string, number> } = await res.json();

    // Include the base currency itself at rate 1
    const rates: Record<string, number> = { [baseCurrency]: 1, ...data.rates };

    // Crypto rates aren't in Frankfurter — carry them over from the fallback
    const fallback = fallbackRates as FxRates;
    const cryptoCurrencies = ["BTC", "ETH", "USDC", "USDT"];
    for (const c of cryptoCurrencies) {
      if (fallback.rates[c]) rates[c] = fallback.rates[c];
    }

    return {
      base: baseCurrency as Currency,
      rates,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[fx] Live FX fetch failed, using fallback rates:", err);
    return fallbackRates as FxRates;
  }
}

/**
 * Convert an amount from one currency to another.
 * All stored rates are expressed as "1 base = X foreign currency".
 */
export function convert(amount: number, from: Currency | string, to: Currency | string): number {
  if (from === to) return amount;

  const rates = _rates.rates;
  const base = _rates.base;

  // rate = "1 GBP = X units of currency"
  // to go from -> GBP:  amount / rate[from]
  // to go from GBP -> to: * rate[to]
  const fromRate = from === base ? 1 : (rates[from] ?? 1);
  const toRate   = to   === base ? 1 : (rates[to]   ?? 1);

  return (amount / fromRate) * toRate;
}

/** Convert amount to base currency. */
export function toBase(amount: number, currency: Currency | string): number {
  return convert(amount, currency, _rates.base);
}

/** Rate: 1 unit of `currency` expressed in base currency. */
export function rateToBase(currency: Currency | string): number {
  if (currency === _rates.base) return 1;
  const r = _rates.rates[currency];
  return r ? 1 / r : 1;
}
