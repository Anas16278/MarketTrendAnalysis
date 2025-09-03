from __future__ import annotations

import json
import os
import random
import string
import time
from datetime import datetime, timezone

import numpy as np
import redis


REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
STREAM = os.getenv("STREAM", "trades")

r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)


def random_symbol() -> str:
    return random.choice(["AAPL", "MSFT", "GOOG", "AMZN", "META"])  # noqa: S311


def gen_price(prev: float) -> float:
    return float(prev * np.exp(np.random.normal(0, 0.002)))


def main() -> None:
    prices = {s: 100.0 for s in ["AAPL", "MSFT", "GOOG", "AMZN", "META"]}
    while True:
        sym = random_symbol()
        prices[sym] = gen_price(prices[sym])
        side = random.choice(["BUY", "SELL"])  # noqa: S311
        qty = random.randint(1, 500)  # noqa: S311
        trade = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "symbol": sym,
            "side": side,
            "price": round(prices[sym], 2),
            "qty": qty,
            "id": "T-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8)),  # noqa: S311
        }
        r.xadd(STREAM, {"trade": json.dumps(trade)})
        time.sleep(0.01)


if __name__ == "__main__":
    main()


