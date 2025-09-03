"""Financial data analysis and export for interactive dashboard.

Loads OHLCV, computes returns, summary metrics, rolling stats, and correlations,
and writes JSON/CSV artifacts for a static Plotly dashboard.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd

try:
    import yfinance as yf
except Exception:
    yf = None  # type: ignore


def fetch(symbols: List[str], start: str, end: str | None) -> pd.DataFrame:
    if yf is None:
        raise RuntimeError("yfinance is required for fetching. Install with `pip install yfinance`.")
    df = yf.download(symbols, start=start, end=end, progress=False)["Adj Close"]
    if isinstance(df, pd.Series):
        df = df.to_frame()
    df = df.dropna(how="all").ffill().dropna()
    return df


def compute_summary(prices: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    daily_ret = prices.pct_change().dropna()
    ann_factor = 252
    summary: Dict[str, Dict[str, float]] = {}
    for col in prices.columns:
        r = daily_ret[col].dropna()
        if r.empty:
            continue
        cum = (1 + r).cumprod()
        years = len(r) / ann_factor
        cagr = (cum.iloc[-1] ** (1 / years) - 1) if years > 0 else 0.0
        vol = float(r.std() * np.sqrt(ann_factor))
        sharpe = float((r.mean() / (r.std() + 1e-9)) * np.sqrt(ann_factor))
        mdd = float((cum / cum.cummax() - 1).min())
        wr = float((r > 0).mean())
        summary[col] = {"cagr": float(cagr), "vol": vol, "sharpe": sharpe, "max_drawdown": mdd, "win_rate": wr}
    return summary


def rolling_stats(prices: pd.DataFrame, window: int = 60) -> pd.DataFrame:
    ret = prices.pct_change()
    vol = ret.rolling(window).std() * np.sqrt(252)
    mom = prices.pct_change(window)
    return pd.concat({"vol": vol, "mom": mom}, axis=1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze financial time series and export dashboard data")
    parser.add_argument("--symbols", nargs="+", default=["SPY", "QQQ", "TLT", "GLD"])
    parser.add_argument("--start", default="2018-01-01")
    parser.add_argument("--end", default=None)
    parser.add_argument("--out", default="artifacts")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    prices = fetch(args.symbols, args.start, args.end)
    prices.to_csv(out_dir / "prices.csv")

    daily_ret = prices.pct_change().dropna()
    daily_ret.to_csv(out_dir / "returns.csv")

    corr = daily_ret.corr()
    corr.to_csv(out_dir / "correlation.csv")

    roll = rolling_stats(prices, window=60)
    roll.to_csv(out_dir / "rolling.csv")

    summary = compute_summary(prices)
    payload = {
        "symbols": list(prices.columns.astype(str)),
        "summary": summary,
        "corr": corr.round(4).to_dict(),
    }
    (out_dir / "dashboard.json").write_text(json.dumps(payload, indent=2))
    print(f"Wrote artifacts to {out_dir.resolve()}")


if __name__ == "__main__":
    main()


