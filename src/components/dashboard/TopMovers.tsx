"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPct, pnlClass } from "@/lib/utils/format";
import { Card, CardHeader } from "@/components/ui/Card";
import type { EnrichedHolding } from "@/types";

interface TopMoversProps {
  gainers: EnrichedHolding[];
  losers: EnrichedHolding[];
  baseCurrency: string;
}

function MoverRow({ h, baseCurrency }: { h: EnrichedHolding; baseCurrency: string }) {
  const isUp = h.priceChange24hPct >= 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#21262d] last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-full bg-[#21262d] flex items-center justify-center text-xs font-bold text-[#7d8590] flex-shrink-0">
          {h.asset.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#c9d1d9] truncate">{h.asset.symbol}</p>
          <p className="text-[11px] text-[#7d8590]">
            {formatCurrency(h.marketValueBase, baseCurrency, { compact: true })}
          </p>
        </div>
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {formatPct(h.priceChange24hPct)}
      </div>
    </div>
  );
}

export function TopMovers({ gainers, losers, baseCurrency }: TopMoversProps) {
  return (
    <Card padding="md">
      <CardHeader title="Top Movers" subtitle="24h price change" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={12} className="text-emerald-400" />
            <p className="text-xs font-medium text-emerald-400">Gainers</p>
          </div>
          {gainers.map((h) => <MoverRow key={h.id} h={h} baseCurrency={baseCurrency} />)}
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={12} className="text-red-400" />
            <p className="text-xs font-medium text-red-400">Losers</p>
          </div>
          {losers.map((h) => <MoverRow key={h.id} h={h} baseCurrency={baseCurrency} />)}
        </div>
      </div>
    </Card>
  );
}
