"use client";

import { useState } from "react";
import { DonutChart, AllocationLegend } from "@/components/ui/DonutChart";
import { Card, CardHeader } from "@/components/ui/Card";
import type { PortfolioSnapshot } from "@/types";

type AllocView = "class" | "account" | "currency";

interface AllocationSectionProps {
  snapshot: PortfolioSnapshot;
}

export function AllocationSection({ snapshot }: AllocationSectionProps) {
  const [view, setView] = useState<AllocView>("class");

  const dataMap: Record<AllocView, typeof snapshot.allocationByClass> = {
    class:    snapshot.allocationByClass,
    account:  snapshot.allocationByAccount,
    currency: snapshot.allocationByCurrency,
  };

  const data = dataMap[view];

  return (
    <Card padding="md">
      <CardHeader
        title="Allocation"
        action={
          <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1">
            {(["class", "account", "currency"] as AllocView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  view === v
                    ? "bg-[#21262d] text-[#e6edf3]"
                    : "text-[#7d8590] hover:text-[#c9d1d9]"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex items-center gap-6">
        <DonutChart data={data} size={160} innerRadius={45} outerRadius={72} />
        <div className="flex-1 min-w-0">
          <AllocationLegend data={data} />
        </div>
      </div>
    </Card>
  );
}
