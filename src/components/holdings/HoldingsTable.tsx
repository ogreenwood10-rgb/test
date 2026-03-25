"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import { formatCurrency, formatPct, formatNumber, pnlClass } from "@/lib/utils/format";
import { AssetClassBadge } from "@/components/ui/Badge";
import type { EnrichedHolding } from "@/types";

type SortKey = keyof Pick<
  EnrichedHolding,
  | "marketValueBase"
  | "unrealisedPnlBase"
  | "unrealisedPnlPct"
  | "allocationPct"
  | "priceChange24hPct"
  | "annualYieldPct"
>;

interface HoldingsTableProps {
  holdings: EnrichedHolding[];
  baseCurrency: string;
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown size={12} className="text-[#484f58]" />;
  return dir === "asc" ? (
    <ChevronUp size={12} className="text-blue-400" />
  ) : (
    <ChevronDown size={12} className="text-blue-400" />
  );
}

export function HoldingsTable({ holdings, baseCurrency }: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("marketValueBase");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");

  const classes = useMemo(() => {
    const set = new Set(holdings.map((h) => h.asset.assetClass));
    return ["all", ...Array.from(set)];
  }, [holdings]);

  const sorted = useMemo(() => {
    let filtered = holdings;
    if (filterClass !== "all") {
      filtered = filtered.filter((h) => h.asset.assetClass === filterClass);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.asset.name.toLowerCase().includes(q) ||
          h.asset.symbol.toLowerCase().includes(q) ||
          h.account.name.toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [holdings, sortKey, sortDir, search, filterClass]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const TH = ({
    label,
    field,
    align = "right",
  }: {
    label: string;
    field?: SortKey;
    align?: "left" | "right";
  }) => (
    <th
      className={`${align === "right" ? "text-right" : "text-left"} ${field ? "cursor-pointer select-none hover:text-[#c9d1d9]" : ""}`}
      onClick={field ? () => toggleSort(field) : undefined}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {label}
        {field && <SortIcon field={field} active={sortKey === field} dir={sortDir} />}
      </span>
    </th>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8590]" />
          <input
            type="text"
            placeholder="Search by name, symbol, or account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161b22] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder:text-[#7d8590] focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-1 bg-[#161b22] border border-[#21262d] rounded-lg p-1">
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setFilterClass(cls)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                filterClass === cls
                  ? "bg-[#21262d] text-[#e6edf3]"
                  : "text-[#7d8590] hover:text-[#c9d1d9]"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full portfolio-table">
            <thead>
              <tr>
                <TH label="Asset" align="left" />
                <TH label="Account" align="left" />
                <TH label="Qty" />
                <TH label="Avg Cost" />
                <TH label="Price" />
                <TH label="Value" field="marketValueBase" />
                <TH label="P&L" field="unrealisedPnlBase" />
                <TH label="P&L %" field="unrealisedPnlPct" />
                <TH label="24h" field="priceChange24hPct" />
                <TH label="Yield" field="annualYieldPct" />
                <TH label="Alloc" field="allocationPct" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr key={h.id}>
                  <td className="pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#21262d] flex items-center justify-center text-xs font-bold text-[#7d8590] flex-shrink-0">
                        {h.asset.symbol.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#c9d1d9]">{h.asset.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-[#7d8590]">{h.asset.symbol}</span>
                          <AssetClassBadge assetClass={h.asset.assetClass} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm text-[#7d8590]">{h.account.name}</p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className="text-sm text-[#c9d1d9]">{formatNumber(h.quantity, 6)}</p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className="text-sm text-[#7d8590]">
                      {formatCurrency(h.avgCostPerUnit, h.avgCostCurrency)}
                    </p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className="text-sm text-[#c9d1d9]">
                      {formatCurrency(h.currentPrice, h.currentPriceCurrency)}
                    </p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className="text-sm font-medium text-[#e6edf3]">
                      {formatCurrency(h.marketValueBase, baseCurrency)}
                    </p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className={`text-sm font-medium ${pnlClass(h.unrealisedPnlBase)}`}>
                      {formatCurrency(h.unrealisedPnlBase, baseCurrency)}
                    </p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className={`text-sm font-medium ${pnlClass(h.unrealisedPnlPct)}`}>
                      {formatPct(h.unrealisedPnlPct)}
                    </p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className={`text-sm ${pnlClass(h.priceChange24hPct)}`}>
                      {formatPct(h.priceChange24hPct)}
                    </p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className="text-sm text-amber-400">
                      {h.annualYieldPct > 0 ? `${h.annualYieldPct.toFixed(1)}%` : "—"}
                    </p>
                  </td>
                  <td className="text-right pr-5 tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(h.allocationPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#7d8590] w-10 text-right">
                        {h.allocationPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr className="border-t border-[#21262d]">
                <td colSpan={5} className="pl-5 py-3">
                  <p className="text-xs font-medium text-[#7d8590]">
                    {sorted.length} position{sorted.length !== 1 ? "s" : ""}
                  </p>
                </td>
                <td className="text-right tabular-nums py-3">
                  <p className="text-sm font-semibold text-[#e6edf3]">
                    {formatCurrency(sorted.reduce((s, h) => s + h.marketValueBase, 0), baseCurrency)}
                  </p>
                </td>
                <td className="text-right tabular-nums py-3">
                  <p className={`text-sm font-semibold ${pnlClass(sorted.reduce((s, h) => s + h.unrealisedPnlBase, 0))}`}>
                    {formatCurrency(sorted.reduce((s, h) => s + h.unrealisedPnlBase, 0), baseCurrency)}
                  </p>
                </td>
                <td colSpan={4} className="pr-5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
