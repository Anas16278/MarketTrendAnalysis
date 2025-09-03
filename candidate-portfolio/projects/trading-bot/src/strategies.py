"""Trading strategies producing position signals.

Each strategy returns a pd.Series of target positions in [-1, 0, 1] indexed by
time, where 1 = long, -1 = short, 0 = flat.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

import pandas as pd

from .indicators import simple_moving_average, relative_strength_index


@dataclass
class StrategyContext:
    prices: pd.Series  # close prices


def moving_average_crossover(ctx: StrategyContext, fast: int = 10, slow: int = 20) -> pd.Series:
    close = ctx.prices
    fast_ma = simple_moving_average(close, fast)
    slow_ma = simple_moving_average(close, slow)
    signal = (fast_ma > slow_ma).astype(int) - (fast_ma < slow_ma).astype(int)
    # Avoid look-ahead bias: trade on next bar
    return signal.shift(1).fillna(0).astype(int)


def rsi_reversion(ctx: StrategyContext, window: int = 14, low: int = 30, high: int = 70) -> pd.Series:
    close = ctx.prices
    rsi = relative_strength_index(close, window)
    long_sig = (rsi < low).astype(int)
    short_sig = (rsi > high).astype(int)
    signal = long_sig - short_sig
    return signal.shift(1).fillna(0).astype(int)


def combine_signals(signals: Dict[str, pd.Series], weights: Dict[str, float] | None = None) -> pd.Series:
    df = pd.DataFrame(signals).fillna(0)
    if not len(df):
        return pd.Series(dtype=int)
    if weights is None:
        weights = {name: 1.0 for name in df.columns}
    w = pd.Series(weights)
    aligned = df.mul(w, axis=1)
    combined = aligned.sum(axis=1)
    # Map to -1/0/1 by sign
    return combined.apply(lambda x: 1 if x > 0 else (-1 if x < 0 else 0)).astype(int)


