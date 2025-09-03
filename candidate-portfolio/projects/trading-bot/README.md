# Algorithmic Trading Bot (Python)

A clean, modular trading bot implementing classic signals (Moving Average Crossover, RSI Reversion) with a vectorized backtester. Fetches data via CSV or Yahoo Finance and outputs performance metrics and an equity curve CSV for portfolio-ready plots.

## Features
- Moving Average Crossover and RSI Reversion strategies
- Signal blending with weightable combination
- Vectorized single-asset backtester with fees, equity curve, and stats
- CSV or Yahoo Finance data source
- CLI for quick experiments

## Quickstart
```bash
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python -m src.main --symbol SPY --start 2018-01-01
```

Or with local CSV (columns: Date, Open, High, Low, Close, Adj Close, Volume):
```bash
python -m src.main --csv path\to\data.csv
```

Outputs:
- `outputs/equity_<SYMBOL>.csv` containing equity curve for plotting
- Terminal performance summary (CAGR, Sharpe, Max Drawdown, Win Rate)

## Results (Example)
- CAGR: 0.13–0.18
- Volatility: 0.16–0.22
- Sharpe: 0.8–1.2
- Max Drawdown: -0.12–-0.25
- Win Rate: 0.50–0.56

Note: Example stats are indicative; actual numbers depend on date range, symbol, and parameters.

## Tech Stack
- Python, Pandas, NumPy
- yfinance (optional), Matplotlib/Seaborn for downstream plotting

## Structure
```
src/
  backtester.py       # vectorized returns + stats
  data_loader.py      # CSV and yfinance loaders
  indicators.py       # SMA, EMA, RSI
  strategies.py       # MA crossover, RSI reversion, combiners
  main.py             # CLI entrypoint
```

## CV Bullet (ready to paste)

- Built modular algorithmic trading bot in Python with MA/RSI signals and a vectorized backtester; reported CAGR, Sharpe, and drawdowns on SPY since 2018 with reproducible CLI runs and exportable equity curves.

## License
MIT
