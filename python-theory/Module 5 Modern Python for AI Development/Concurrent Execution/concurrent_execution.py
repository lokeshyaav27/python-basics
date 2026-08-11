"""Concurrent execution - threads vs processes vs async.

Run:  python concurrent_execution.py

The decision rule:
  I/O-bound (network, disk, DB)  -> async, or threads
  CPU-bound (maths, parsing)     -> processes
The reason is the GIL: only one thread runs Python bytecode at a time, so
threads cannot speed up CPU work - but they are fine while waiting on I/O.
"""

import asyncio
import math
import os
import threading
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed


# ---------------------------------------------------------------- I/O-bound --
def io_task(name):
    """Simulates waiting on a network call."""
    time.sleep(0.4)
    return f"{name} on {threading.current_thread().name}"


def io_sequential(names):
    return [io_task(n) for n in names]


def io_threaded(names):
    # ThreadPoolExecutor: best fit for blocking I/O in sync code.
    with ThreadPoolExecutor(max_workers=len(names)) as pool:
        return list(pool.map(io_task, names))


async def io_async(names):
    async def one(name):
        await asyncio.sleep(0.4)
        return name

    return await asyncio.gather(*(one(n) for n in names))


# ---------------------------------------------------------------- CPU-bound --
def cpu_task(n):
    """Genuinely CPU-heavy: count primes below n."""
    count = 0
    for candidate in range(2, n):
        limit = int(math.isqrt(candidate))
        if all(candidate % d for d in range(2, limit + 1)):
            count += 1
    return count


def cpu_sequential(sizes):
    return [cpu_task(n) for n in sizes]


def cpu_threaded(sizes):
    # Threads do NOT help here - the GIL serialises the bytecode.
    with ThreadPoolExecutor(max_workers=len(sizes)) as pool:
        return list(pool.map(cpu_task, sizes))


def cpu_processes(sizes):
    # Each process has its own interpreter and its own GIL -> real parallelism.
    with ProcessPoolExecutor(max_workers=min(len(sizes), os.cpu_count() or 2)) as pool:
        return list(pool.map(cpu_task, sizes))


# ------------------------------------------------------------------ helpers --
def timed(label, func, *args):
    start = time.perf_counter()
    result = func(*args)
    elapsed = time.perf_counter() - start
    print(f"  {label:<28} {elapsed:5.2f}s")
    return elapsed, result


def main():
    print("CPU cores available:", os.cpu_count())

    # --- I/O-bound comparison ---
    names = [f"api-{n}" for n in range(6)]
    print("\n--- I/O-bound: 6 calls x 0.4s ---")
    seq, _ = timed("sequential", io_sequential, names)
    thr, _ = timed("ThreadPoolExecutor", io_threaded, names)
    asy, _ = timed("asyncio.gather", lambda: asyncio.run(io_async(names)))
    print(f"  threads were {seq / thr:.1f}x faster, async {seq / asy:.1f}x faster")

    # --- CPU-bound comparison ---
    sizes = [60_000] * 4
    print("\n--- CPU-bound: 4 x count primes below 60,000 ---")
    seq, expected = timed("sequential", cpu_sequential, sizes)
    thr, _ = timed("ThreadPoolExecutor (GIL!)", cpu_threaded, sizes)
    proc, from_procs = timed("ProcessPoolExecutor", cpu_processes, sizes)
    print(f"  threads: {seq / thr:.2f}x (no real gain - this is the GIL)")
    print(f"  processes: {seq / proc:.2f}x (actual parallelism)")
    print("  same answers from processes:", from_procs == expected)

    # --- submit() + as_completed: handle results as they finish ---
    print("\n--- submit / as_completed ---")
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(io_task, f"job-{n}"): n for n in range(5)}
        for future in as_completed(futures):
            print(f"  job-{futures[future]} finished ->", future.result().split(" on ")[1])

    # --- Exceptions surface when you call .result() ---
    print("\n--- exceptions in workers ---")

    def risky(n):
        if n == 2:
            raise ValueError(f"cannot handle {n}")
        return n * 10

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(risky, n) for n in range(4)]
        for n, future in enumerate(futures):
            try:
                print(f"  risky({n}) = {future.result()}")
            except ValueError as err:
                print(f"  risky({n}) raised {err}")

    # --- Shared mutable state needs a lock ---
    print("\n--- race condition and the fix ---")
    unsafe = 0
    safe = 0
    lock = threading.Lock()

    def bump_unsafe():
        nonlocal unsafe
        for _ in range(100_000):
            unsafe += 1          # read-modify-write: not atomic

    def bump_safe():
        nonlocal safe
        for _ in range(100_000):
            with lock:           # only one thread inside at a time
                safe += 1

    for target in (bump_unsafe, bump_safe):
        threads = [threading.Thread(target=target) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()             # wait for completion

    print(f"  expected     : 400000")
    print(f"  without lock : {unsafe}  {'(got lucky)' if unsafe == 400_000 else '(lost updates)'}")
    print(f"  with lock    : {safe}")

    # --- Timeouts on a future ---
    print("\n--- future timeout ---")
    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(time.sleep, 2)
        try:
            future.result(timeout=0.3)
        except TimeoutError:
            print("  result(timeout=0.3) raised TimeoutError")
            print("  note: the worker keeps running; you cannot un-start it")

    print("""
--- choosing ---
  asyncio             thousands of concurrent I/O waits, one thread, no locks
  ThreadPoolExecutor  blocking I/O in sync code, or libraries with no async API
  ProcessPoolExecutor CPU-heavy work; costs process startup + pickling overhead
  nothing at all      the default - do not add concurrency you cannot measure""")


if __name__ == "__main__":
    # This guard is MANDATORY on Windows for ProcessPoolExecutor: child
    # processes re-import this file, and without it they would recurse forever.
    main()
