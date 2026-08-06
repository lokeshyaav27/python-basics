"""asyncio in practice - tasks, timeouts, groups, queues, semaphores.

Run:  python asyncio_example.py
"""

import asyncio
import random
import time


async def call_api(name, seconds, fail=False):
    """Stand-in for a real API call."""
    await asyncio.sleep(seconds)
    if fail:
        raise RuntimeError(f"{name} failed")
    return {"source": name, "took": seconds}


# --- gather: run many, get results in the order you passed them ---
async def demo_gather():
    print("--- gather ---")
    start = time.perf_counter()
    results = await asyncio.gather(
        call_api("users", 0.3),
        call_api("orders", 0.5),
        call_api("products", 0.2),
    )
    print(f"  {len(results)} results in {time.perf_counter() - start:.2f}s")
    print("  order preserved:", [r["source"] for r in results])


# --- gather with return_exceptions: one failure does not kill the rest ---
async def demo_gather_errors():
    print("\n--- gather with errors ---")

    # Default: the first exception propagates immediately
    try:
        await asyncio.gather(call_api("ok", 0.1), call_api("bad", 0.1, fail=True))
    except RuntimeError as err:
        print("  default behaviour - raises:", err)

    # return_exceptions=True: failures come back as values
    results = await asyncio.gather(
        call_api("ok", 0.1),
        call_api("bad", 0.1, fail=True),
        call_api("also-ok", 0.1),
        return_exceptions=True,
    )
    for result in results:
        if isinstance(result, Exception):
            print(f"  FAILED: {type(result).__name__}: {result}")
        else:
            print(f"  OK    : {result['source']}")


# --- Tasks: start work now, await it later; cancel if you change your mind ---
async def demo_tasks():
    print("\n--- tasks ---")
    slow = asyncio.create_task(call_api("slow", 2.0), name="slow")
    quick = asyncio.create_task(call_api("quick", 0.2), name="quick")

    print("  quick finished:", await quick)
    print("  slow done yet?:", slow.done())

    slow.cancel()
    try:
        await slow
    except asyncio.CancelledError:
        print("  slow was cancelled:", slow.cancelled())


# --- Timeouts ---
async def demo_timeout():
    print("\n--- timeouts ---")
    try:
        async with asyncio.timeout(0.3):          # Python 3.11+
            await call_api("very-slow", 2.0)
    except TimeoutError:
        print("  asyncio.timeout(0.3) fired")

    try:
        await asyncio.wait_for(call_api("very-slow", 2.0), timeout=0.3)
    except TimeoutError:
        print("  asyncio.wait_for(timeout=0.3) fired")

    # Inside the budget, nothing happens
    async with asyncio.timeout(1.0):
        result = await call_api("fast", 0.1)
    print("  within budget:", result["source"])


# --- TaskGroup: the modern replacement for gather (Python 3.11+) ---
async def demo_task_group():
    print("\n--- TaskGroup ---")
    async with asyncio.TaskGroup() as group:
        a = group.create_task(call_api("alpha", 0.2))
        b = group.create_task(call_api("beta", 0.3))
    # On exit, every task is complete. If one raises, the others are
    # cancelled and the errors arrive together as an ExceptionGroup.
    print("  both finished:", a.result()["source"], b.result()["source"])

    try:
        async with asyncio.TaskGroup() as group:
            group.create_task(call_api("good", 0.1))
            group.create_task(call_api("bad", 0.1, fail=True))
    except* RuntimeError as errors:
        print("  ExceptionGroup caught:", [str(e) for e in errors.exceptions])


# --- as_completed: react to results as they arrive ---
async def demo_as_completed():
    print("\n--- as_completed ---")
    jobs = [call_api(f"job-{n}", delay)
            for n, delay in enumerate([0.4, 0.1, 0.3, 0.2], start=1)]
    for coro in asyncio.as_completed(jobs):
        result = await coro
        print(f"  arrived: {result['source']} ({result['took']}s)")


# --- Semaphore: cap how many run at once (respect API rate limits) ---
async def demo_semaphore():
    print("\n--- semaphore (max 3 concurrent) ---")
    limit = asyncio.Semaphore(3)
    in_flight = 0
    peak = 0

    async def guarded(n):
        nonlocal in_flight, peak
        async with limit:
            in_flight += 1
            peak = max(peak, in_flight)
            await asyncio.sleep(0.1)
            in_flight -= 1
            return n

    start = time.perf_counter()
    await asyncio.gather(*(guarded(n) for n in range(9)))
    print(f"  9 jobs, peak concurrency {peak}, took {time.perf_counter() - start:.2f}s")


# --- Queue: producer/consumer pipeline ---
async def demo_queue():
    print("\n--- queue (2 producers, 3 workers) ---")
    queue = asyncio.Queue(maxsize=5)
    processed = []

    async def producer(pid):
        for n in range(4):
            await queue.put(f"p{pid}-item{n}")
        print(f"  producer {pid} finished")

    async def worker(wid):
        while True:
            item = await queue.get()
            try:
                await asyncio.sleep(random.uniform(0.02, 0.08))
                processed.append((wid, item))
            finally:
                queue.task_done()      # always mark done, even on failure

    random.seed(7)
    workers = [asyncio.create_task(worker(w)) for w in range(3)]
    await asyncio.gather(producer(1), producer(2))
    await queue.join()                 # wait until every item is handled

    for task in workers:               # workers loop forever; stop them
        task.cancel()
    await asyncio.gather(*workers, return_exceptions=True)

    print(f"  processed {len(processed)} items across 3 workers")


# --- A realistic pattern: fetch many URLs with a concurrency cap and retries ---
async def fetch_all(names, max_concurrent=4, retries=2):
    limit = asyncio.Semaphore(max_concurrent)

    async def one(name):
        async with limit:
            for attempt in range(1, retries + 1):
                try:
                    async with asyncio.timeout(0.5):
                        # every third name fails on its first attempt
                        should_fail = attempt == 1 and hash(name) % 3 == 0
                        return await call_api(name, 0.1, fail=should_fail)
                except (RuntimeError, TimeoutError):
                    if attempt == retries:
                        return {"source": name, "error": "gave up"}
                    await asyncio.sleep(0.05 * attempt)   # backoff

    return await asyncio.gather(*(one(n) for n in names))


async def demo_realistic():
    print("\n--- realistic fetch_all ---")
    names = [f"endpoint-{n}" for n in range(8)]
    start = time.perf_counter()
    results = await fetch_all(names)
    ok = sum(1 for r in results if "error" not in r)
    print(f"  {ok}/{len(results)} succeeded in {time.perf_counter() - start:.2f}s")
    for r in results:
        if "error" in r:
            print("  failed:", r["source"])


async def main():
    await demo_gather()
    await demo_gather_errors()
    await demo_tasks()
    await demo_timeout()
    await demo_task_group()
    await demo_as_completed()
    await demo_semaphore()
    await demo_queue()
    await demo_realistic()

    loop = asyncio.get_running_loop()
    print("\nevent loop:", type(loop).__name__)
    print("pending tasks at the end:", len(asyncio.all_tasks()) - 1)


if __name__ == "__main__":
    asyncio.run(main())
