from __future__ import annotations

import json
import os
from collections import defaultdict
from datetime import datetime, timezone

import redis


REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
IN_STREAM = os.getenv("IN_STREAM", "matches")

r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)


def main() -> None:
    last_id = "$"
    volume = defaultdict(int)
    notional = defaultdict(float)
    start = datetime.now(timezone.utc)

    while True:
        resp = r.xread({IN_STREAM: last_id}, count=200, block=1000)
        if not resp:
            continue
        _, entries = resp[0]
        for msg_id, fields in entries:
            last_id = msg_id
            match = json.loads(fields["match"])  # {symbol, qty, price, ...}
            sym = match["symbol"]
            volume[sym] += int(match["qty"])
            notional[sym] += float(match["qty"]) * float(match["price"])

        # Periodically log KPIs
        if (datetime.now(timezone.utc) - start).total_seconds() > 5:
            total_vol = sum(volume.values())
            total_notional = sum(notional.values())
            print(f"5s KPI — trades matched qty={total_vol:,}, notional=${total_notional:,.0f}")
            start = datetime.now(timezone.utc)


if __name__ == "__main__":
    main()


