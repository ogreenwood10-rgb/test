/**
 * Server-side data loader. Reads JSON files from /src/data/.
 * In production this would be replaced by a database or file-watch layer.
 */
import type {
  AppConfig,
  Account,
  Asset,
  Holding,
  Transaction,
  Goal,
  FxRates,
} from "@/types";

import configData from "@/data/config.json";
import accountsData from "@/data/accounts.json";
import assetsData from "@/data/assets.json";
import holdingsData from "@/data/holdings.json";
import transactionsData from "@/data/transactions.json";
import goalsData from "@/data/goals.json";
import fxData from "@/data/fx-rates.json";

export function getConfig(): AppConfig {
  return configData as AppConfig;
}

export function getAccounts(): Account[] {
  return accountsData as Account[];
}

export function getAssets(): Asset[] {
  return assetsData as Asset[];
}

export function getHoldings(): Holding[] {
  return holdingsData as Holding[];
}

export function getTransactions(): Transaction[] {
  // Sort by date descending
  return (transactionsData as Transaction[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getGoals(): Goal[] {
  return goalsData as Goal[];
}

export function getFxRates(): FxRates {
  return fxData as FxRates;
}

// Lookup helpers
export function getAssetById(id: string): Asset | undefined {
  return (assetsData as Asset[]).find((a) => a.id === id);
}

export function getAccountById(id: string): Account | undefined {
  return (accountsData as Account[]).find((a) => a.id === id);
}
