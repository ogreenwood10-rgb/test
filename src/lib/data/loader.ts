/**
 * Server-side data loader.
 *
 * Priority:
 *   1. src/data/portfolio.xlsx  — if it exists, all sheets are read from here
 *   2. src/data/*.json          — fallback (sample data / manual JSON editing)
 *
 * To use Excel: place your portfolio.xlsx in src/data/ and restart the server.
 * To use JSON:  remove portfolio.xlsx (or don't create it) and edit the JSON files.
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

import configData      from "@/data/config.json";
import accountsData    from "@/data/accounts.json";
import assetsData      from "@/data/assets.json";
import holdingsData    from "@/data/holdings.json";
import transactionsData from "@/data/transactions.json";
import goalsData       from "@/data/goals.json";
import fxData          from "@/data/fx-rates.json";

import {
  excelFileExists,
  loadConfigFromExcel,
  loadAccountsFromExcel,
  loadAssetsFromExcel,
  loadHoldingsFromExcel,
  loadTransactionsFromExcel,
  loadGoalsFromExcel,
} from "./excel";

const usingExcel = excelFileExists();

export function getDataSource(): "excel" | "json" {
  return usingExcel ? "excel" : "json";
}

export function getConfig(): AppConfig {
  if (usingExcel) return loadConfigFromExcel() ?? (configData as AppConfig);
  return configData as AppConfig;
}

export function getAccounts(): Account[] {
  if (usingExcel) return loadAccountsFromExcel() ?? (accountsData as Account[]);
  return accountsData as Account[];
}

export function getAssets(): Asset[] {
  if (usingExcel) return loadAssetsFromExcel() ?? (assetsData as Asset[]);
  return assetsData as Asset[];
}

export function getHoldings(): Holding[] {
  if (usingExcel) return loadHoldingsFromExcel() ?? (holdingsData as Holding[]);
  return holdingsData as Holding[];
}

export function getTransactions(): Transaction[] {
  const txs: Transaction[] = usingExcel
    ? (loadTransactionsFromExcel() ?? (transactionsData as Transaction[]))
    : (transactionsData as Transaction[]);

  return txs.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getGoals(): Goal[] {
  if (usingExcel) return loadGoalsFromExcel() ?? (goalsData as Goal[]);
  return goalsData as Goal[];
}

export function getFxRates(): FxRates {
  return fxData as FxRates;
}

// Lookup helpers
export function getAssetById(id: string): Asset | undefined {
  return getAssets().find((a) => a.id === id);
}

export function getAccountById(id: string): Account | undefined {
  return getAccounts().find((a) => a.id === id);
}
