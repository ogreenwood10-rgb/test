# Portfolio Monitor

A personal wealth and portfolio monitoring system built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** — Net worth hero, allocation charts, top movers, goal progress, recent activity
- **Holdings** — Filterable/sortable table of all positions with P&L, yield, allocation
- **Transactions** — Full ledger with type filters and pagination
- **Performance** — Growth chart, drawdown analysis, rolling returns, class breakdown
- **Income** — Monthly income chart, by-asset breakdown, recent events log
- **Goals** — Progress tracking toward financial targets + 20-year forecast scenarios

## Stack

| Layer       | Choice                    |
|-------------|---------------------------|
| Framework   | Next.js 14 (App Router)   |
| Language    | TypeScript                |
| Styling     | Tailwind CSS              |
| Charts      | Recharts                  |
| Data        | Local JSON files          |
| Icons       | Lucide React              |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Files

All your data lives in `src/data/`. Edit these files to update your portfolio:

| File                  | Purpose                                      |
|-----------------------|----------------------------------------------|
| `config.json`         | Base currency, targets, forecast assumptions |
| `accounts.json`       | Accounts and platforms (Coinbase, ISA, etc.) |
| `assets.json`         | Master list of assets (crypto, equities, etc)|
| `holdings.json`       | Current positions (quantity + avg cost)      |
| `transactions.json`   | Full transaction ledger                      |
| `goals.json`          | Financial targets and milestones             |
| `fx-rates.json`       | FX rates (fallback when live data unavailable)|

## Prices

Crypto prices are fetched live from [CoinGecko](https://www.coingecko.com/api) (free, no key required).
Equity prices use realistic mock values — replace `MOCK_PRICES` in `src/lib/data/prices.ts` with a real API when needed.

Pages revalidate every 5 minutes.

## Architecture

```
src/
├── app/                    # Next.js pages (server components)
│   ├── page.tsx            # Dashboard
│   ├── holdings/page.tsx
│   ├── transactions/page.tsx
│   ├── performance/page.tsx
│   ├── income/page.tsx
│   ├── goals/page.tsx
│   └── api/                # API routes
├── components/
│   ├── layout/             # Sidebar
│   ├── dashboard/          # Dashboard widgets
│   ├── holdings/           # Holdings table
│   ├── transactions/       # Transactions table
│   ├── performance/        # Performance charts
│   ├── income/             # Income view
│   ├── goals/              # Goals + forecast view
│   └── ui/                 # Shared components
├── lib/
│   ├── calculations/       # Core financial math
│   │   ├── portfolio.ts    # Snapshot builder, P&L engine
│   │   ├── performance.ts  # History, drawdown, rolling returns
│   │   ├── income.ts       # Income extraction + summaries
│   │   └── goals.ts        # Goal progress + forecasting
│   ├── data/
│   │   ├── loader.ts       # JSON file reader
│   │   └── prices.ts       # Price fetching (live + mock)
│   └── utils/
│       ├── format.ts       # Currency/number/date formatting
│       └── fx.ts           # FX conversion engine
├── types/index.ts          # All TypeScript types
└── data/                   # Your editable data files
```

## Extending

- **Add a new asset**: Add to `assets.json` with `coingeckoId` (crypto) or `yahooSymbol` (equity)
- **Add an account**: Add to `accounts.json`
- **Record a transaction**: Add to `transactions.json` — portfolio P&L recalculates
- **Set a goal**: Add to `goals.json`
- **Property/other assets**: Use `assetClass: "property"` + add price to `MOCK_PRICES` in `prices.ts`
- **Live equity prices**: Implement `fetchEquityPrices()` in `src/lib/data/prices.ts`
- **CSV import**: Build a server action that parses a CSV and writes to the JSON data files

## Base Currency

Set `baseCurrency` in `config.json`. All values are converted via `src/data/fx-rates.json`.
Update `fx-rates.json` manually or wire it to a live FX API (e.g. Open Exchange Rates, ECB).
