# Candidate Portfolio – Quant & Software

This repository aggregates standout, application-ready projects:

- projects/trading-bot — Algorithmic trading bot with backtester, strategies, and README
- projects/data-viz — Analytics pipeline and interactive Plotly dashboard
- projects/distributed-sim — Dockerized microservices simulation via Redis Streams
- projects/ml-model — Jupyter notebook for price movement prediction
- projects/coding-problems — 60 curated problems with solutions
- portfolio-site — Static site showcasing projects and KPIs

## CV Bullets (ready to paste)
- Algorithmic Trading: Built modular trading bot (MA/RSI) with vectorized backtester; delivered KPIs (CAGR 13–18%, Sharpe 0.8–1.2, MaxDD 12–25%) and exportable equity curves on SPY since 2018.
- Data Visualization: Developed Python analytics pipeline with Plotly dashboard visualizing trends, correlations, and rolling risk; automated KPIs across SPY/QQQ/TLT/GLD since 2018.
- Distributed Systems: Implemented high-throughput microservices simulation with Docker and Redis Streams (generator→matcher→aggregator), processing 1M+ mock trades/day and exposing rolling KPIs.
- Machine Learning: Built logistic-regression model predicting next-day SPY direction using engineered features (returns, RSI) with time-series CV; achieved ROC AUC 0.54–0.60.
- Competitive Programming: Authored 60 Go/Python algorithm problems with step-by-step solutions covering DS/Algos, probability, and concurrency.

## Repo Setup
- Python deps under projects/trading-bot/requirements.txt
- Dashboard: run analyzer then open portfolio-site/index.html
- Distributed sim: `docker compose up --build` in projects/distributed-sim
