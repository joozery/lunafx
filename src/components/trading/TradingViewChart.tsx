"use client";

// Symbols chosen to sit close to our execution feeds: OANDA for FX/gold (FastForex), Binance for crypto
const TV_SYMBOLS: Record<string, string> = {
  XAUUSD: "OANDA:XAUUSD",
  EURUSD: "OANDA:EURUSD",
  GBPUSD: "OANDA:GBPUSD",
  USDJPY: "OANDA:USDJPY",
  USDCHF: "OANDA:USDCHF",
  AUDUSD: "OANDA:AUDUSD",
  USDCAD: "OANDA:USDCAD",
  NZDUSD: "OANDA:NZDUSD",
  EURJPY: "OANDA:EURJPY",
  GBPJPY: "OANDA:GBPJPY",
  AUDJPY: "OANDA:AUDJPY",
  NZDJPY: "OANDA:NZDJPY",
  CADJPY: "OANDA:CADJPY",
  CHFJPY: "OANDA:CHFJPY",
  EURGBP: "OANDA:EURGBP",
  EURAUD: "OANDA:EURAUD",
  EURCHF: "OANDA:EURCHF",
  GBPCHF: "OANDA:GBPCHF",
  XAGUSD: "OANDA:XAGUSD",
  BTCUSD: "BINANCE:BTCUSDT",
  ETHUSD: "BINANCE:ETHUSDT",
  USOIL:  "TVC:USOIL",
  US30:   "OANDA:US30USD",
};

/** Historical chart from TradingView. Order fills and P&L still use our own server feed. */
export function TradingViewChart({ symbol, timeframe, isth }: { symbol: string; timeframe: string; isth: boolean }) {
  const tvSymbol = TV_SYMBOLS[symbol] ?? symbol;
  const frameId = `tv_chart_${symbol}_${timeframe}`;

  const src =
    `https://s.tradingview.com/widgetembed/?frameElementId=${frameId}` +
    `&symbol=${encodeURIComponent(tvSymbol)}&interval=${encodeURIComponent(timeframe)}` +
    `&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=0f172a&studies=%5B%5D` +
    `&theme=dark&style=1&timezone=Asia%2FBangkok&withdateranges=1&hide_volume=1` +
    `&locale=${isth ? "th_TH" : "en"}`;

  return (
    <iframe
      key={frameId}
      id={frameId}
      src={src}
      title={`${symbol} chart`}
      className="w-full min-h-[320px] flex-1 border-0 bg-[#0b1120]"
      allowFullScreen
    />
  );
}
