"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { TxTypeBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import type { Transaction, Asset, Account } from "@/types";

interface EnrichedTx extends Transaction {
  asset: Asset | null;
  account: Account | null;
  totalValue: number;
}

interface RecentTransactionsProps {
  transactions: EnrichedTx[];
  baseCurrency: string;
}

export function RecentTransactions({ transactions, baseCurrency }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 6);

  return (
    <Card padding="none">
      <div className="p-5 pb-0">
        <CardHeader
          title="Recent Activity"
          action={
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-xs text-[#7d8590] hover:text-[#c9d1d9] transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          }
        />
      </div>
      <div className="px-5 pb-4">
        <table className="w-full portfolio-table">
          <tbody>
            {recent.map((tx) => (
              <tr key={tx.id}>
                <td className="pl-0">
                  <TxTypeBadge type={tx.type} />
                </td>
                <td>
                  <p className="text-sm text-[#c9d1d9] font-medium">{tx.asset?.symbol ?? tx.assetId}</p>
                  <p className="text-xs text-[#7d8590]">{tx.account?.name ?? tx.accountId}</p>
                </td>
                <td className="text-right">
                  <p className="text-sm tabular-nums text-[#c9d1d9]">
                    {tx.quantity.toLocaleString("en-GB", { maximumFractionDigits: 6 })}
                  </p>
                  <p className="text-xs text-[#7d8590] tabular-nums">
                    {formatCurrency(tx.totalValue, tx.priceCurrency)}
                  </p>
                </td>
                <td className="text-right pr-0">
                  <p className="text-xs text-[#7d8590]">{formatDate(tx.date, "short")}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
