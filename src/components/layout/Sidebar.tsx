"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  DollarSign,
  Target,
  Download,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/holdings",      label: "Holdings",     icon: Wallet           },
  { href: "/transactions",  label: "Transactions", icon: ArrowLeftRight   },
  { href: "/performance",   label: "Performance",  icon: TrendingUp       },
  { href: "/income",        label: "Income",       icon: DollarSign       },
  { href: "/goals",         label: "Goals",        icon: Target           },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#161b22] border-r border-[#21262d] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#21262d]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#e6edf3] leading-none">Portfolio</p>
            <p className="text-[11px] text-[#7d8590] mt-0.5">Monitor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2">
        <p className="text-[10px] uppercase tracking-widest text-[#7d8590] font-medium px-3 mb-2 mt-1">
          Overview
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-[#21262d] text-[#e6edf3] font-medium"
                      : "text-[#7d8590] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-blue-400" : "text-[#7d8590]"} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#21262d] space-y-3">
        <a
          href="/api/template"
          download="portfolio.xlsx"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-[#7d8590] hover:text-[#c9d1d9] hover:bg-[#1c2128] transition-colors w-full"
        >
          <Download size={13} />
          Download Excel template
        </a>
        <div>
          <p className="text-[11px] text-[#484f58]">
            Data in <span className="text-[#7d8590] font-medium">AUD</span>
          </p>
          <p className="text-[10px] text-[#484f58] mt-0.5">
            Prices updated every 5 min
          </p>
        </div>
      </div>
    </aside>
  );
}
