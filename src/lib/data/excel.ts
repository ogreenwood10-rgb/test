/**
 * Excel data loader.
 *
 * Reads portfolio.xlsx from src/data/ if it exists.
 * Each sheet maps to one data type:
 *
 *   Sheet name    → Data type
 *   ──────────────────────────
 *   Config        → AppConfig (single row of key/value pairs)
 *   Accounts      → Account[]
 *   Assets        → Asset[]
 *   Holdings      → Holding[]
 *   Transactions  → Transaction[]
 *   Goals         → Goal[]
 *
 * Column headers must match the field names exactly (case-insensitive).
 * Extra columns are ignored. Missing optional fields default to undefined.
 */
import path from "path";
import fs from "fs";
import type {
  AppConfig,
  Account,
  Asset,
  Holding,
  Transaction,
  Goal,
} from "@/types";

const EXCEL_PATH = path.join(process.cwd(), "src", "data", "portfolio.xlsx");

export function excelFileExists(): boolean {
  return fs.existsSync(EXCEL_PATH);
}

/** Load the workbook. Returns null if file doesn't exist. */
function loadWorkbook() {
  if (!excelFileExists()) return null;
  // Dynamic require so Next.js doesn't bundle xlsx into client chunks
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  return XLSX.readFile(EXCEL_PATH);
}

/** Convert a worksheet to an array of plain objects (header row = keys). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sheetToObjects(wb: any, sheetName: string): Record<string, string | number>[] {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const rows: Record<string, string | number>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    blankrows: false,
  });
  // Normalise keys to lowercase for case-insensitive matching
  return rows.map((row) => {
    const normalised: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(row)) {
      normalised[k.trim().toLowerCase()] = v;
    }
    return normalised;
  });
}

function str(v: string | number | undefined): string {
  return v !== undefined && v !== "" ? String(v).trim() : "";
}
function num(v: string | number | undefined): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------
// Public loaders — return null if sheet is missing so caller can fall back
// ---------------------------------------------------------------------------

export function loadConfigFromExcel(): AppConfig | null {
  const wb = loadWorkbook();
  if (!wb) return null;

  const rows = sheetToObjects(wb, "Config");
  if (rows.length === 0) return null;

  // Config sheet: two columns — "key" and "value"
  const map: Record<string, string | number> = {};
  for (const row of rows) {
    const key = str(row["key"]).toLowerCase().replace(/\s+/g, "");
    const value = row["value"];
    if (key) map[key] = value;
  }

  return {
    baseCurrency: (str(map["basecurrency"]) || "GBP") as AppConfig["baseCurrency"],
    displayName: str(map["displayname"]) || "My Portfolio",
    targetNetWorth: num(map["targetnetworth"]),
    targetPassiveIncome: num(map["targetpassiveincome"]),
    targetBtcStack: num(map["targetbtcstack"]),
    growthAssumptionPct: num(map["growthassumptionpct"]),
    contributionMonthly: num(map["contributionmonthly"]),
    yieldAssumptionPct: num(map["yieldassumptionpct"]),
  };
}

export function loadAccountsFromExcel(): Account[] | null {
  const wb = loadWorkbook();
  if (!wb) return null;
  const rows = sheetToObjects(wb, "Accounts");
  if (rows.length === 0) return null;

  return rows.map((r) => ({
    id: str(r["id"]),
    name: str(r["name"]),
    type: str(r["type"]) as Account["type"],
    currency: str(r["currency"]) as Account["currency"],
    platform: str(r["platform"]) || undefined,
    notes: str(r["notes"]) || undefined,
  })).filter((a) => a.id && a.name);
}

export function loadAssetsFromExcel(): Asset[] | null {
  const wb = loadWorkbook();
  if (!wb) return null;
  const rows = sheetToObjects(wb, "Assets");
  if (rows.length === 0) return null;

  return rows.map((r) => ({
    id: str(r["id"]),
    symbol: str(r["symbol"]),
    name: str(r["name"]),
    assetClass: str(r["assetclass"]) as Asset["assetClass"],
    currency: str(r["currency"]) as Asset["currency"],
    coingeckoId: str(r["coingeckoid"]) || undefined,
    yahooSymbol: str(r["yahoosymbol"]) || undefined,
    isCash: str(r["iscash"]).toLowerCase() === "true" || str(r["iscash"]) === "1",
    notes: str(r["notes"]) || undefined,
  })).filter((a) => a.id && a.symbol);
}

export function loadHoldingsFromExcel(): Holding[] | null {
  const wb = loadWorkbook();
  if (!wb) return null;
  const rows = sheetToObjects(wb, "Holdings");
  if (rows.length === 0) return null;

  return rows.map((r, i) => ({
    id: str(r["id"]) || `h${i + 1}`,
    assetId: str(r["assetid"]),
    accountId: str(r["accountid"]),
    quantity: num(r["quantity"]),
    avgCostPerUnit: num(r["avgcostperunit"]),
    avgCostCurrency: str(r["avgcostcurrency"]) as Holding["avgCostCurrency"],
    notes: str(r["notes"]) || undefined,
    tags: str(r["tags"]) ? str(r["tags"]).split(",").map((t) => t.trim()) : undefined,
  })).filter((h) => h.assetId && h.accountId && h.quantity > 0);
}

export function loadTransactionsFromExcel(): Transaction[] | null {
  const wb = loadWorkbook();
  if (!wb) return null;
  const rows = sheetToObjects(wb, "Transactions");
  if (rows.length === 0) return null;

  return rows.map((r, i) => {
    // Handle Excel date serial numbers
    let date = str(r["date"]);
    if (!date && typeof r["date"] === "number") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = require("xlsx");
      date = XLSX.SSF.format("yyyy-mm-dd", r["date"]);
    }
    return {
      id: str(r["id"]) || `tx${i + 1}`,
      date,
      type: str(r["type"]) as Transaction["type"],
      assetId: str(r["assetid"]),
      accountId: str(r["accountid"]),
      quantity: num(r["quantity"]),
      pricePerUnit: num(r["priceperunit"]),
      priceCurrency: str(r["pricecurrency"]) as Transaction["priceCurrency"],
      feeAmount: num(r["feeamount"]),
      feeCurrency: (str(r["feecurrency"]) || str(r["pricecurrency"])) as Transaction["feeCurrency"],
      notes: str(r["notes"]) || undefined,
    };
  }).filter((t) => t.assetId && t.accountId && t.date && t.type);
}

export function loadGoalsFromExcel(): Goal[] | null {
  const wb = loadWorkbook();
  if (!wb) return null;
  const rows = sheetToObjects(wb, "Goals");
  if (rows.length === 0) return null;

  return rows.map((r, i) => ({
    id: str(r["id"]) || `g${i + 1}`,
    label: str(r["label"]),
    type: str(r["type"]) as Goal["type"],
    targetValue: num(r["targetvalue"]),
    targetCurrency: str(r["targetcurrency"]) as Goal["targetCurrency"],
    assetId: str(r["assetid"]) || undefined,
    deadline: str(r["deadline"]) || undefined,
    notes: str(r["notes"]) || undefined,
  })).filter((g) => g.label && g.targetValue > 0);
}
