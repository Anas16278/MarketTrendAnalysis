# XTX-Style Coding & Algorithms Practice (Go/Python)

Problems span arrays/strings, data structures, graphs, DP, math/probability, concurrency, and systems tasks. Each includes a brief step-by-step solution. Implement in Go or Python.

Legend: Difficulty [E/M/H]

## 1) Two-Sum Variants [E]
- Steps: Iterate, map value->index; for x check target-x in map; O(n).

## 2) Longest Substring Without Repeat [M]
- Steps: Sliding window, last-seen map; move left pointer; track max.

## 3) Group Anagrams [M]
- Steps: Canonical key by sorted string or counts; hashmap buckets.

## 4) Product of Array Except Self [M]
- Steps: Prefix pass then suffix pass; multiply; O(n), O(1) extra.

## 5) Merge Intervals [M]
- Steps: Sort by start; sweep merging overlaps.

## 6) Min Stack [E]
- Steps: Stack of (val, currentMin); push/pop update min.

## 7) LRU Cache [M]
- Steps: Hashmap + doubly linked list; O(1) get/put.

## 8) Kth Largest in Stream [E]
- Steps: Min-heap size k; push/pop to maintain top-k.

## 9) Top-K Frequent Elements [M]
- Steps: Freq map + heap or bucket sort.

## 10) Median of Data Stream [M]
- Steps: Two-heaps (max-left, min-right); rebalance.

## 11) Validate Binary Search Tree [M]
- Steps: DFS with bounds; inorder strictly increasing.

## 12) LCA in BST [E]
- Steps: Walk down comparing to root; left/right accordingly.

## 13) LCA in Binary Tree [M]
- Steps: Postorder; return node if found both sides; bubble up.

## 14) Serialize/Deserialize Binary Tree [M]
- Steps: BFS with null markers; inverse reconstruct.

## 15) Course Schedule (Topo Sort) [M]
- Steps: Kahn in-degree queue; detect cycle.

## 16) Number of Islands [M]
- Steps: DFS/BFS flood-fill; count.

## 17) Word Ladder [H]
- Steps: BFS on word graph; wildcard map.

## 18) Dijkstra [M]
- Steps: Min-heap; relax edges; O(E log V).

## 19) Bellman-Ford [M]
- Steps: Relax V-1 times; detect negative cycles.

## 20) Max Flow (Edmonds-Karp) [H]
- Steps: BFS augmenting paths; residual.

## 21) Edit Distance [M]
- Steps: DP table; min of insert/delete/replace.

## 22) LIS [H]
- Steps: Patience sorting tails + binary search; O(n log n).

## 23) Coin Change (Min Coins) [M]
- Steps: DP over amount.

## 24) Subset Sum / Partition Equal [M]
- Steps: Boolean DP or bitset DP.

## 25) 0/1 Knapsack [M]
- Steps: DP over weights backward.

## 26) Max Subarray (Kadane) [E]
- Steps: Keep current/max; reset on negative.

## 27) Max Sum Rectangle [H]
- Steps: Fix row pair; compress; 1D Kadane.

## 28) Trapping Rain Water [M]
- Steps: Two pointers with left/right max.

## 29) Sliding Window Maximum [M]
- Steps: Monotonic deque of indices.

## 30) Minimum Window Substring [H]
- Steps: Sliding window need/have counts; shrink.

## 31) Fibonacci via Matrix Power [M]
- Steps: Fast power on [[1,1],[1,0]].

## 32) Fast Power Mod [M]
- Steps: Binary exponentiation with modulo.

## 33) Sieve of Eratosthenes [E]
- Steps: Boolean array; mark multiples.

## 34) GCD/LCM + Extended Euclid [E]
- Steps: Iterative gcd; lcm=a/gcd*b; extended.

## 35) Weighted Random Pick [M]
- Steps: Prefix sums; binary search random.

## 36) Reservoir Sampling [M]
- Steps: Replace with prob k/i; streaming.

## 37) Fisher–Yates Shuffle [E]
- Steps: Swap i with random j<=i.

## 38) Monte Carlo Pi [E]
- Steps: Random points in square; circle ratio.

## 39) Median of Two Sorted Arrays [H]
- Steps: Partition binary search; O(log(min(n,m))).

## 40) Concurrent Producer/Consumer (Go) [M]
- Steps: Buffered channels; goroutines; context cancel.

## 41) Rate Limiter (Token Bucket) [M]
- Steps: Refill tokens at rate; thread-safe.

## 42) Thread-Safe LRU (Go) [H]
- Steps: RWMutex + list+map; sharding.

## 43) Parallel Map-Reduce [M]
- Steps: Worker pool; partition; reduce.

## 44) Bounded Work Queue [M]
- Steps: Semaphore or channel cap.

## 45) Lock-Free Stack (Treiber) [H]
- Steps: CAS head; ABA mitigation.

## 46) Bloom Filter [M]
- Steps: Bitset + k hashes; tune m,k.

## 47) Consistent Hashing Ring [M]
- Steps: Virtual nodes; bisect lookups.

## 48) LRU vs LFU Benchmark [M]
- Steps: Implement both; measure hit rate/latency.

## 49) K-way Merge [M]
- Steps: Min-heap of heads; pop/push.

## 50) External Sort [H]
- Steps: Chunk sort; k-way merge; streaming IO.

## 51) Order Book Simulation [M]
- Steps: Two heaps/maps; price levels; partial fills.

## 52) VWAP over Sliding Window [E]
- Steps: Maintain sum(price*qty) and sum(qty).

## 53) Real-time PnL [M]
- Steps: Track position, cash, fees; mark-to-market.

## 54) Online Z-score Anomaly [M]
- Steps: Welford mean/std; |z|>k.

## 55) Kalman Filter 1D [H]
- Steps: Predict/update; tune R,Q.

## 56) Moving Median (HFT) [M]
- Steps: Two heaps + lazy delete.

## 57) Fast RSI/EMA O(1) [M]
- Steps: Recursive EMA; smoothed RSI.

## 58) Backtest Event Engine [M]
- Steps: Priority events; handlers.

## 59) Walk-Forward Optimization [H]
- Steps: Rolling train/test; robust params.

## 60) Parallel Backtester (Go) [H]
- Steps: Goroutine per param set; aggregate.

---

## Selected Step-by-Step Solutions

### 7) LRU Cache (Python)
```python
from collections import OrderedDict
class LRU:
    def __init__(self, cap: int):
        self.cap = cap
        self.od = OrderedDict()
    def get(self, k):
        if k not in self.od: return -1
        v = self.od.pop(k)
        self.od[k] = v
        return v
    def put(self, k, v):
        if k in self.od:
            self.od.pop(k)
        elif len(self.od) == self.cap:
            self.od.popitem(last=False)
        self.od[k] = v
```

### 29) Sliding Window Maximum (Python)
```python
from collections import deque

def max_sliding_window(nums, k):
    q, out = deque(), []
    for i, x in enumerate(nums):
        while q and nums[q[-1]] <= x: q.pop()
        q.append(i)
        if q[0] == i - k: q.popleft()
        if i >= k - 1: out.append(nums[q[0]])
    return out
```

### 31) Matrix Power Fibonacci (Go)
```go
package main
import "fmt"

type Mat [2][2]int64
func mul(a, b Mat) Mat {return Mat{{a[0][0]*b[0][0]+a[0][1]*b[1][0], a[0][0]*b[0][1]+a[0][1]*b[1][1]}, {a[1][0]*b[0][0]+a[1][1]*b[1][0], a[1][0]*b[0][1]+a[1][1]*b[1][1]}}}
func pow(m Mat, n int64) Mat {res:=Mat{{1,0},{0,1}}; for n>0{ if n&1==1{res=mul(res,m)}; m=mul(m,m); n>>=1}; return res}
func fib(n int64) int64 { if n==0{return 0}; base:=Mat{{1,1},{1,0}}; p:=pow(base,n-1); return p[0][0] }
func main(){fmt.Println(fib(10))}
```

### 46) Bloom Filter (Python)
```python
import math, mmh3
class Bloom:
    def __init__(self, n, p=0.01):
        m = -int(n * math.log(p) / (math.log(2)**2))
        k = max(1, int((m / n) * math.log(2)))
        self.m, self.k, self.bits = m, k, [0]*m
    def _idx(self, x, i):
        return mmh3.hash(str(x), seed=i) % self.m
    def add(self, x):
        for i in range(self.k): self.bits[self._idx(x,i)] = 1
    def contains(self, x):
        return all(self.bits[self._idx(x,i)] for i in range(self.k))
```

### 52) VWAP over Sliding Window (Python)
```python
from collections import deque

def vwap_stream(trades, window):
    q, num, den = deque(), 0.0, 0.0
    for price, qty in trades:
        q.append((price, qty)); num += price*qty; den += qty
        if len(q) > window:
            p,qy = q.popleft(); num -= p*qy; den -= qy
        yield num/den if den else 0.0
```

### 60) Parallel Backtester (Go)
```go
package main
import ("sync"; "fmt")
func evalParam(a,b int) float64 { return float64(a*b) }
func main(){
  params := [][2]int{{10,20},{10,30},{20,50},{30,60}}
  var wg sync.WaitGroup
  results := make([]float64, len(params))
  for i,p := range params { wg.Add(1); go func(i int, p [2]int){ defer wg.Done(); results[i]=evalParam(p[0],p[1]) }(i,p) }
  wg.Wait(); fmt.Println(results)
}
```
