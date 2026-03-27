import type { Currency } from "@/types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  AUD: "A$",
  BTC: "₿",
  ETH: "Ξ",
  USDC: "$",
  USDT: "$",
};

export function formatCurrency(
  value: number,
  currency: Currency | string = "GBP",
  options: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = false, decimals } = options;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";

  if (["BTC", "ETH"].includes(currency)) {
    const dp = decimals ?? 6;
    return `${symbol}${value.toFixed(dp)}`;
  }

  if (compact && Math.abs(value) >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(1)}k`;
  }

  const dp = decimals ?? 2;
  return `${symbol}${value.toLocaleString("en-GB", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })}`;
}

export function formatPct(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 4): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
  return value.toLocaleString("en-GB", { maximumFractionDigits: decimals });
}

export function formatDate(dateStr: string, style: "short" | "medium" | "long" = "medium"): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const opts: Intl.DateTimeFormatOptions =
    style === "short"
      ? { day: "2-digit", month: "short" }
      : style === "medium"
      ? { day: "2-digit", month: "short", year: "numeric" }
      : { day: "2-digit", month: "long", year: "numeric" };
  return d.toLocaleDateString("en-GB", opts);
}

export function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// Returns a CSS class for positive/negative/neutral values
export function pnlClass(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-slate-400";
}

export function pnlBgClass(value: number): string {
  if (value > 0) return "bg-emerald-400/10 text-emerald-400";
  if (value < 0) return "bg-red-400/10 text-red-400";
  return "bg-slate-400/10 text-slate-400";
}
