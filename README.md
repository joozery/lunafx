This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## WebTrader market data

Run `npm run dev` and open http://localhost:3002/th/webtrader. Restart this
command after changing `server.js` or environment variables.

The chart, Bid/Ask, and floating account values share the server's Socket.IO
price stream. One-minute OHLC candles capture actual incoming ticks before
broadcast coalescing; timeframe buttons aggregate these bars. History is held
in memory (up to 24 hours) and starts when this server starts. Missing intervals
are not filled with simulated prices.

- Binance supplies live BTC/ETH ticks.
- Forex and gold require working FastForex WebSocket access. Set
  `FASTFOREX_WS_API_KEY` for a dedicated streaming key, or `FASTFOREX_API_KEY`.
  A provider authentication `401` requires correcting the key/access in the
  provider account; reconnecting cannot resolve rejected credentials.
- REST quotes are labelled as polled, daily reference rates as indicative,
  and old ticks as stale. Indicative rates cannot open trades or overwrite the
  last executable tick. Oil/US30 remain subject to Yahoo rate limits.

Run `node --test tests/market-data.test.cjs` to check candle aggregation,
reconnect updates, quote freshness, fallback precedence and P&L consistency.
