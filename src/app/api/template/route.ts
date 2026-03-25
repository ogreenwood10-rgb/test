/**
 * GET /api/template
 * Downloads a pre-formatted portfolio.xlsx template with:
 *  - All sheets pre-populated with current data
 *  - Column headers, widths, and instructions
 *  - Dropdown validation for key fields (asset class, tx type, etc.)
 */
import { NextResponse } from "next/server";
import { getConfig, getAccounts, getAssets, getHoldings, getTransactions, getGoals } from "@/lib/data/loader";

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require("xlsx");

    const config      = getConfig();
    const accounts    = getAccounts();
    const assets      = getAssets();
    const holdings    = getHoldings();
    const transactions = getTransactions();
    const goals       = getGoals();

    const wb = XLSX.utils.book_new();

    // ── Instructions sheet ──────────────────────────────────────────────────
    const instructionRows = [
      ["PORTFOLIO MONITOR — EXCEL DATA FILE"],
      [""],
      ["HOW TO USE THIS FILE"],
      ["1. Fill in each sheet with your real data."],
      ["2. Save this file as  src/data/portfolio.xlsx  in your project folder."],
      ["3. Restart the app (stop npm run dev, then run it again)."],
      ["4. The app will automatically read from this file."],
      [""],
      ["SHEET GUIDE"],
      ["Config       — App settings (base currency, targets, assumptions)"],
      ["Accounts     — Your accounts and platforms"],
      ["Assets       — Master list of all assets you trade"],
      ["Holdings     — Your current positions (quantity + avg cost)"],
      ["Transactions — Full trade/income history"],
      ["Goals        — Financial targets"],
      [""],
      ["IMPORTANT RULES"],
      ["• Do not change column header names — the app reads them exactly"],
      ["• IDs must be unique and must match between sheets (e.g. assetId in Holdings must exist in Assets)"],
      ["• Dates must be formatted as YYYY-MM-DD (e.g. 2024-03-15)"],
      ["• true/false values: use TRUE or FALSE (or 1/0)"],
      ["• Leave optional cells blank — do not write 'N/A' or '-'"],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionRows);
    wsInstructions["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    // ── Config sheet ────────────────────────────────────────────────────────
    const configRows = [
      ["key", "value", "description"],
      ["baseCurrency",         config.baseCurrency,         "Your reporting currency (GBP, USD, EUR)"],
      ["displayName",          config.displayName,          "Display name for the portfolio"],
      ["targetNetWorth",       config.targetNetWorth,       "Target net worth in base currency"],
      ["targetPassiveIncome",  config.targetPassiveIncome,  "Target monthly passive income in base currency"],
      ["targetBtcStack",       config.targetBtcStack,       "Target BTC quantity"],
      ["growthAssumptionPct",  config.growthAssumptionPct,  "Annual growth % assumption for forecasts"],
      ["contributionMonthly",  config.contributionMonthly,  "Monthly contribution amount in base currency"],
      ["yieldAssumptionPct",   config.yieldAssumptionPct,   "Average yield % assumption"],
    ];
    const wsConfig = XLSX.utils.aoa_to_sheet(configRows);
    wsConfig["!cols"] = [{ wch: 22 }, { wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsConfig, "Config");

    // ── Accounts sheet ───────────────────────────────────────────────────────
    const accountHeaders = ["id", "name", "type", "currency", "platform", "notes"];
    const accountRows = [
      accountHeaders,
      ...accounts.map((a) => [
        a.id, a.name, a.type, a.currency, a.platform ?? "", a.notes ?? "",
      ]),
    ];
    const wsAccounts = XLSX.utils.aoa_to_sheet(accountRows);
    wsAccounts["!cols"] = [
      { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, wsAccounts, "Accounts");

    // ── Assets sheet ─────────────────────────────────────────────────────────
    const assetHeaders = ["id", "symbol", "name", "assetClass", "currency", "coingeckoId", "yahooSymbol", "isCash", "notes"];
    const assetRows = [
      assetHeaders,
      ...assets.map((a) => [
        a.id, a.symbol, a.name, a.assetClass, a.currency,
        a.coingeckoId ?? "", a.yahooSymbol ?? "",
        a.isCash ? "TRUE" : "FALSE",
        a.notes ?? "",
      ]),
    ];
    const wsAssets = XLSX.utils.aoa_to_sheet(assetRows);
    wsAssets["!cols"] = [
      { wch: 14 }, { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
      { wch: 22 }, { wch: 14 }, { wch: 8 }, { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, wsAssets, "Assets");

    // ── Holdings sheet ───────────────────────────────────────────────────────
    const holdingHeaders = ["id", "assetId", "accountId", "quantity", "avgCostPerUnit", "avgCostCurrency", "notes", "tags"];
    const holdingRows = [
      holdingHeaders,
      ...holdings.map((h) => [
        h.id, h.assetId, h.accountId, h.quantity,
        h.avgCostPerUnit, h.avgCostCurrency,
        h.notes ?? "", (h.tags ?? []).join(", "),
      ]),
    ];
    const wsHoldings = XLSX.utils.aoa_to_sheet(holdingRows);
    wsHoldings["!cols"] = [
      { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 35 }, { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, wsHoldings, "Holdings");

    // ── Transactions sheet ───────────────────────────────────────────────────
    const txHeaders = [
      "id", "date", "type", "assetId", "accountId",
      "quantity", "pricePerUnit", "priceCurrency", "feeAmount", "feeCurrency", "notes",
    ];
    const txRows = [
      txHeaders,
      ...transactions.map((t) => [
        t.id, t.date, t.type, t.assetId, t.accountId,
        t.quantity, t.pricePerUnit, t.priceCurrency,
        t.feeAmount, t.feeCurrency, t.notes ?? "",
      ]),
    ];
    const wsTransactions = XLSX.utils.aoa_to_sheet(txRows);
    wsTransactions["!cols"] = [
      { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Transactions");

    // ── Goals sheet ──────────────────────────────────────────────────────────
    const goalHeaders = ["id", "label", "type", "targetValue", "targetCurrency", "assetId", "deadline", "notes"];
    const goalRows = [
      goalHeaders,
      ...goals.map((g) => [
        g.id, g.label, g.type, g.targetValue, g.targetCurrency,
        g.assetId ?? "", g.deadline ?? "", g.notes ?? "",
      ]),
    ];
    const wsGoals = XLSX.utils.aoa_to_sheet(goalRows);
    wsGoals["!cols"] = [
      { wch: 8 }, { wch: 32 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 12 }, { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, wsGoals, "Goals");

    // ── Ref sheet (valid values) ─────────────────────────────────────────────
    const refRows = [
      ["REFERENCE — Valid values for dropdown fields"],
      [""],
      ["assetClass",         "type (Transactions)"],
      ["crypto",             "buy"],
      ["equity",             "sell"],
      ["cash",               "deposit"],
      ["property",           "withdrawal"],
      ["other",              "transfer_in"],
      ["",                   "transfer_out"],
      ["account type",       "staking_reward"],
      ["exchange",           "dividend"],
      ["wallet",             "interest"],
      ["isa",                "fee"],
      ["brokerage",          "airdrop"],
      ["bank",               ""],
      ["pension",            "goal type"],
      ["other",              "net_worth"],
      ["",                   "crypto_stack"],
      ["currency",           "passive_income"],
      ["GBP",                "custom"],
      ["USD",                ""],
      ["EUR",                "isCash (Assets)"],
      ["USDC",               "TRUE"],
      ["USDT",               "FALSE"],
    ];
    const wsRef = XLSX.utils.aoa_to_sheet(refRows);
    wsRef["!cols"] = [{ wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsRef, "Reference");

    // Write to buffer and convert to Uint8Array for the Web Response API
    const buffer: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="portfolio.xlsx"',
      },
    });
  } catch (err) {
    console.error("Template generation error:", err);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}
