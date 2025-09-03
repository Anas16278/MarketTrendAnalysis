from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from .data_loader import PriceDataRequest, fetch_prices, load_prices_from_csv
from .strategies import StrategyContext, moving_average_crossover, rsi_reversion, combine_signals
from .backtester import backtest


def run(symbol: str, start: str | None, end: str | None, csv: str | None) -> None:
    if csv:
        prices_df = load_prices_from_csv(csv)
    else:
        req = PriceDataRequest(ticker=symbol, start=start, end=end)
        prices_df = fetch_prices(req)

    close = prices_df["Close"].astype(float)
    ctx = StrategyContext(prices=close)

    sig_ma = moving_average_crossover(ctx, fast=10, slow=25)
    sig_rsi = rsi_reversion(ctx, window=14, low=30, high=70)
    signal = combine_signals({"ma": sig_ma, "rsi": sig_rsi})

    result = backtest(close, signal, fee_bps=1.0)
    stats = result.stats

    print("Performance Stats:")
    for k, v in stats.items():
        if k == "max_drawdown":
            print(f"  {k:>12}: {v:.2%}")
        else:
            print(f"  {k:>12}: {v:.3f}")

    out_dir = Path("outputs")
    out_dir.mkdir(parents=True, exist_ok=True)
    equity_path = out_dir / f"equity_{symbol.replace(':','_')}.csv"
    result.equity_curve.to_frame("equity").to_csv(equity_path, index=True)
    print(f"Saved equity curve to {equity_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run backtests for simple strategies")
    parser.add_argument("--symbol", default="SPY", help="Ticker symbol (default: SPY)")
    parser.add_argument("--start", default="2018-01-01", help="Start date YYYY-MM-DD")
    parser.add_argument("--end", default=None, help="End date YYYY-MM-DD")
    parser.add_argument("--csv", default=None, help="Optional CSV file path to use instead of fetching")
    args = parser.parse_args()
    run(args.symbol, args.start, args.end, args.csv)


if __name__ == "__main__":
    main()


