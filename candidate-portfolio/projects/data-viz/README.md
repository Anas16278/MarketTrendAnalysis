# Financial Data Analysis & Visualization

Python analysis pipeline plus a static HTML Plotly dashboard. Fetches prices, computes returns, correlations, rolling stats, and summary metrics; exports artifacts for a shareable, interactive dashboard.

## Quickstart
```bash
pip install -r ../trading-bot/requirements.txt
python analyzer.py --symbols SPY QQQ TLT GLD --start 2018-01-01 --out artifacts
```

Then open `dashboard.html` in a browser (or serve locally) — it loads `artifacts/` JSON/CSVs.

## Artifacts
- artifacts/prices.csv — Adjusted close prices
- artifacts/returns.csv — Daily returns
- artifacts/correlation.csv — Correlation matrix
- artifacts/rolling.csv — Rolling volatility/momentum
- artifacts/dashboard.json — Summary metrics and correlation for quick load

## CV Bullet (ready to paste)
- Built a Python analytics pipeline with Plotly dashboard to visualize multi-asset trends, correlations, and risk; automated generation of KPIs (CAGR, Sharpe, MaxDD) since 2018 across SPY/QQQ/TLT/GLD.
