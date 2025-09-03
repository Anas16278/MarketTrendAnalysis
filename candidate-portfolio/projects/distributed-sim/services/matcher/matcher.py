from __future__ import annotations

import json
import os
from collections import deque
from typing import Deque, Dict

import redis


REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
IN_STREAM = os.getenv("IN_STREAM", "trades")
OUT_STREAM = os.getenv("OUT_STREAM", "matches")

r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)


def main() -> None:
    last_id = "$"
    buy_book: Deque[Dict] = deque()
    sell_book: Deque[Dict] = deque()

    while True:
        resp = r.xread({IN_STREAM: last_id}, count=100, block=500)
        if not resp:
            continue
        _, entries = resp[0]
        for msg_id, fields in entries:
            last_id = msg_id
            trade = json.loads(fields["trade"])  # {symbol, side, price, qty, ts, id}
            book = buy_book if trade["side"] == "BUY" else sell_book
            book.append(trade)

            # Naive matching: if we have both sides for the same symbol, match FIFO
            while buy_book and sell_book:
                b = buy_book[0]
                s = sell_book[0]
                if b["symbol"] != s["symbol"]:
                    # keep scanning until symbols align
                    if len(buy_book) > len(sell_book):
                        sell_book.rotate(-1)
                    else:
                        buy_book.rotate(-1)
                    break
                qty = min(b["qty"], s["qty"])
                price = (b["price"] + s["price"]) / 2
                match = {"symbol": b["symbol"], "qty": qty, "price": price, "buy_id": b["id"], "sell_id": s["id"], "ts": trade["ts"]}
                r.xadd(OUT_STREAM, {"match": json.dumps(match)})
                b["qty"] -= qty
                s["qty"] -= qty
                if b["qty"] == 0:
                    buy_book.popleft()
                if s["qty"] == 0:
                    sell_book.popleft()


if __name__ == "__main__":
    main()


