"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils/format";
import { TxTypeBadge, AssetClassBadge } from "@/components/ui/Badge";
import type { Transaction, Asset, Account } from "@/types";

interface EnrichedTx extends Transaction {
  asset: Asset | null;
  account: Account | null;
  totalValue: number;
}

interface TransactionsTableProps {
  transactions: EnrichedTx[];
}

const TX_TYPES = [
  "all", "buy", "sell", "deposit", "withdrawal",
  "staking_reward", "dividend", "interest", "transfer_in", "transfer_out", "fee",
];

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const filtered = useMemo(() => {
    let data = transactions;
    if (typeFilter !== "all") {
      data = data.filter((tx) => tx.type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (tx) =>
          tx.asset?.name?.toLowerCase().includes(q) ||
          tx.asset?.symbol?.toLowerCase().includes(q) ||
          tx.account?.name?.toLowerCase().includes(q) ||
          tx.notes?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [transactions, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalIncome = filtered
    .filter((tx) => ["staking_reward", "dividend", "interest", "airdrop"].includes(tx.type))
    .reduce((s, tx) => s + tx.totalValue, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8590]" />
          <input
            type="text"
            placeholder="Search asset, account, or note..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-[#161b22] border border-[#21262d] rounded-lg text-sm text-[#c9d1d9] placeholder:text-[#7d8590] focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="bg-[#161b22] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-blue-500/50"
        >
          {TX_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All types" : t.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Summary row */}
      <div className="flex gap-4 text-xs text-[#7d8590]">
        <span>{filtered.length} transactions</span>
        {totalIncome > 0 && (
          <span className="text-emerald-400">
            {formatCurrency(totalIncome, "GBP")} income total
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full portfolio-table">
            <thead>
              <tr>
                <th className="text-left pl-5">Date</th>
                <th className="text-left">Type</th>
                <th className="text-left">Asset</th>
                <th className="text-left">Account</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
                <th className="text-right pr-5">Fee</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((tx) => (
                <tr key={tx.id}>
                  <td className="pl-5">
                    <p className="text-sm text-[#7d8590]">{formatDate(tx.date, "medium")}</p>
                  </td>
                  <td>
                    <TxTypeBadge type={tx.type} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#c9d1d9]">
                          {tx.asset?.symbol ?? tx.assetId}
                        </p>
                        {tx.asset && (
                          <AssetClassBadge assetClass={tx.asset.assetClass} />
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm text-[#7d8590]">{tx.account?.name ?? tx.accountId}</p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className="text-sm text-[#c9d1d9]">{formatNumber(tx.quantity, 6)}</p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className="text-sm text-[#7d8590]">
                      {formatCurrency(tx.pricePerUnit, tx.priceCurrency)}
                    </p>
                  </td>
                  <td className="text-right tabular-nums">
                    <p className="text-sm font-medium text-[#e6edf3]">
                      {formatCurrency(tx.totalValue, tx.priceCurrency)}
                    </p>
                  </td>
                  <td className="text-right pr-5 tabular-nums">
                    {tx.feeAmount > 0 ? (
                      <p className="text-xs text-red-400">
                        -{formatCurrency(tx.feeAmount, tx.feeCurrency)}
                      </p>
                    ) : (
                      <p className="text-xs text-[#484f58]">—</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#21262d]">
            <p className="text-xs text-[#7d8590]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-[#21262d] text-[#7d8590] rounded-md disabled:opacity-40 hover:text-[#c9d1d9] transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs bg-[#21262d] text-[#7d8590] rounded-md disabled:opacity-40 hover:text-[#c9d1d9] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
