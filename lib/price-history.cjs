// Retain actual observed one-minute OHLC bars; never fabricate missing intervals.
function recordCandle(history, symbol, price, timestamp) {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(timestamp)) return;
  const time = Math.floor(timestamp / 60_000) * 60_000;
  const candles = history[symbol] ??= [];
  const last = candles.at(-1);
  if (last && time < last.time) return;
  if (last?.time === time) {
    last.high = Math.max(last.high, price);
    last.low = Math.min(last.low, price);
    last.close = price;
  } else candles.push({ time, open: price, high: price, low: price, close: price });
  while (candles.length > 1440 || (candles[0] && candles[0].time < time - 86_400_000)) candles.shift();
}
module.exports = { recordCandle };
