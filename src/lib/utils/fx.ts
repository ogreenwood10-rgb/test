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
 * Convert an amount from one currency to another using stored FX rates.
 * All rates in the store are against the base currency (GBP).
 */
export function convert(amount: number, from: Currency | string, to: Currency | string): number {
  if (from === to) return amount;

  const rates = _rates.rates;
  const base = _rates.base;

  // Convert from -> base, then base -> to
  const fromRate = from === base ? 1 : (rates[from] ?? 1);
  const toRate = to === base ? 1 : (rates[to] ?? 1);

  // fromRate is "1 GBP = X from-currency", so to go from->GBP: amount / fromRate
  // toRate is "1 GBP = Y to-currency", so to go from GBP->to: * toRate
  return (amount / fromRate) * toRate;
}

/**
 * Convert amount to base currency.
 */
export function toBase(amount: number, currency: Currency | string): number {
  return convert(amount, currency, _rates.base);
}

/**
 * Get the rate for converting 1 unit of `currency` to base currency.
 */
export function rateToBase(currency: Currency | string): number {
  if (currency === _rates.base) return 1;
  const r = _rates.rates[currency];
  return r ? 1 / r : 1;
}
