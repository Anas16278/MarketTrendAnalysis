"""Vectorized backtester for single-asset strategies."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

import numpy as np
import pandas as pd


@dataclass
class BacktestResult:
    equity_curve: pd.Series
    returns: pd.Series
    stats: Dict[str, float]


def compute_performance_stats(returns: pd.Series, trading_days_per_year: int = 252) -> Dict[str, float]:
    ret = returns.dropna()
    if ret.empty:
        return {"cagr": 0.0, "vol": 0.0, "sharpe": 0.0, "max_drawdown": 0.0, "win_rate": 0.0}

    cum = (1 + ret).cumprod()
    total_periods = len(ret)
    years = total_periods / trading_days_per_year
    cagr = cum.iloc[-1] ** (1 / years) - 1 if years > 0 else 0.0
    vol = ret.std() * np.sqrt(trading_days_per_year)
    sharpe = (ret.mean() / ret.std()) * np.sqrt(trading_days_per_year) if ret.std() > 0 else 0.0
    rolling_max = cum.cummax()
    drawdown = cum / rolling_max - 1
    max_drawdown = drawdown.min()
    win_rate = (ret > 0).mean()
    return {
        "cagr": float(cagr),
        "vol": float(vol),
        "sharpe": float(sharpe),
        "max_drawdown": float(max_drawdown),
        "win_rate": float(win_rate),
    }


def backtest(prices: pd.Series, positions: pd.Series, fee_bps: float = 1.0) -> BacktestResult:
    """Backtest a stream of target positions against close-to-close returns.

    - prices: close price series
    - positions: target position per bar in [-1,0,1] (already shifted to avoid look-ahead)
    - fee_bps: per trade cost in basis points (round-trip approximated per change in position)
    """
    prices = prices.dropna()
    positions = positions.reindex(prices.index).fillna(0).astype(int)

    rets = prices.pct_change().fillna(0.0)
    pos_prev = positions.shift(1).fillna(0)
    turnover = (positions - pos_prev).abs()  # 2 for flip, 1 for enter/exit
    fees = turnover * (fee_bps / 10000.0)

    strat_rets = pos_prev * rets - fees
    equity = (1 + strat_rets).cumprod()

    stats = compute_performance_stats(strat_rets)
    return BacktestResult(equity_curve=equity, returns=strat_rets, stats=stats)


