"""Data loading utilities for the trading bot.

Provides helpers to fetch historical price data either from local CSV files
or directly from online sources. Keeps a simple, explicit API so that the
rest of the system can remain decoupled from data acquisition concerns.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import pandas as pd

try:
    import yfinance as yf
except Exception:  # pragma: no cover - optional dependency at runtime
    yf = None  # type: ignore


@dataclass
class PriceDataRequest:
    ticker: str
    start: Optional[str] = None  # e.g. "2018-01-01"
    end: Optional[str] = None    # e.g. "2024-12-31"
    interval: str = "1d"


def load_prices_from_csv(csv_path: str | Path) -> pd.DataFrame:
    """Load price data from a CSV with columns: Date, Open, High, Low, Close, Adj Close, Volume.

    - Returns dataframe indexed by DatetimeIndex (UTC-naive), sorted ascending.
    - Ensures standard columns exist and are float/int typed as appropriate.
    """
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV not found: {path}")

    df = pd.read_csv(path)
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"], utc=False)
        df = df.set_index("Date")
    df = df.sort_index()

    expected = ["Open", "High", "Low", "Close", "Adj Close", "Volume"]
    missing = [c for c in expected if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")

    # Coerce numeric types
    for col in ["Open", "High", "Low", "Close", "Adj Close"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["Volume"] = pd.to_numeric(df["Volume"], errors="coerce").astype("Int64")

    return df


def fetch_prices(request: PriceDataRequest) -> pd.DataFrame:
    """Fetch historical OHLCV using yfinance. Falls back to raising if unavailable.

    Returns a dataframe indexed by DatetimeIndex with OHLCV columns.
    """
    if yf is None:
        raise RuntimeError("yfinance is not installed. Install with `pip install yfinance`. ")

    data = yf.download(
        request.ticker,
        start=request.start,
        end=request.end,
        interval=request.interval,
        auto_adjust=False,
        progress=False,
    )

    if data.empty:
        raise ValueError(f"No data returned for {request.ticker}")

    # Standardize column names if needed
    data = data.rename(columns={
        "Adj Close": "Adj Close",
    })
    return data


