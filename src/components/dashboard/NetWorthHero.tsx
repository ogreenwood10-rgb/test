"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPct, pnlClass } from "@/lib/utils/format";
import type { PortfolioSnapshot, AppConfig } from "@/types";

interface NetWorthHeroProps {
  snapshot: PortfolioSnapshot;
  config: AppConfig;
}

export function NetWorthHero({ snapshot, config }: NetWorthHeroProps) {
  const cur = config.baseCurrency;
  const pnl = snapshot.totalUnrealisedPnlBase;
  const pnlPct = snapshot.totalUnrealisedPnlPct;
  const isPositive = pnl >= 0;

  return (
    <div className="bg-gradient-to-br from-[#161b22] to-[#1c2128] border border-[#21262d] rounded-xl p-6">
      <div className="flex flex-col gap-1 mb-4">
        <p className="text-xs uppercase tracking-widest text-[#7d8590] font-medium">Total Net Worth</p>
        <div className="flex items-end gap-4">
          <h2 className="text-4xl font-bold text-[#e6edf3] tabular-nums">
            {formatCurrency(snapshot.totalNetWorthBase, cur)}
          </h2>
          <div className={`flex items-center gap-1.5 mb-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="text-sm font-medium">{formatPct(pnlPct)}</span>
            <span className="text-xs text-[#7d8590]">unrealised</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#21262d]">
        <div>
          <p className="text-xs text-[#7d8590]">Unrealised P&amp;L</p>
          <p className={`text-base font-semibold tabular-nums mt-0.5 ${pnlClass(pnl)}`}>
            {formatCurrency(pnl, cur)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#7d8590]">Cost Basis</p>
          <p className="text-base font-semibold text-[#c9d1d9] tabular-nums mt-0.5">
            {formatCurrency(snapshot.totalCostBasisBase, cur)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#7d8590]">Annual Income</p>
          <p className="text-base font-semibold text-emerald-400 tabular-nums mt-0.5">
            {formatCurrency(snapshot.totalAnnualIncomeBase, cur)}
            <span className="text-xs text-[#7d8590] ml-1">({snapshot.totalYieldPct.toFixed(2)}% yield)</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-[#7d8590]">Cash Available</p>
          <p className="text-base font-semibold text-blue-400 tabular-nums mt-0.5">
            {formatCurrency(snapshot.cashAvailableBase, cur)}
          </p>
        </div>
      </div>
    </div>
  );
}
