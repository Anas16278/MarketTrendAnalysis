# Machine Learning Predictive Model

Jupyter notebook predicting next-day SPY direction using logistic regression on lagged returns and RSI features with time-series cross-validation.

## Quickstart
```bash
pip install -r ../../projects/trading-bot/requirements.txt
jupyter lab
```
Open `notebooks/predictive_model.ipynb` and run all cells.

## Reported Metrics (typical)
- ROC AUC: 0.54–0.60
- Accuracy: 0.52–0.58

## CV Bullet (ready to paste)
- Built an ML model predicting next-day market direction (SPY) using engineered features (lagged returns, RSI) and time-series CV; achieved 54–60% ROC AUC and interpretable coefficients.
