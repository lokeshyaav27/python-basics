"""Async fundamentals - why async exists and what await actually does.

Run:  python async_fundamentals.py

The key idea: async does NOT make your code use more CPU cores. It lets a
single thread do something else while it WAITS - for a network call, a disk
read, a database query. That is most of what an AI/API application does.
"""

import asyncio
import time


# --- A coroutine function: `async def`. Calling it does not run it. ---
async def fetch(name, seconds):
    """Pretend to call an API that takes `seconds` to respond."""
    print(f"  -> {name} started")
    await asyncio.sleep(seconds)      # yields control back to the event loop
    print(f"  <- {name} done after {seconds}s")
    return f"{name} result"


# Calling an async function returns a coroutine object, not a result.
coro = fetch("demo", 0)
print("calling an async def returns:", type(coro).__name__)
coro.close()          # we never awaited it, so close it to avoid a warning
print("nothing ran yet - a coroutine must be awaited or scheduled\n")


# --- Sequential awaits: each one finishes before the next starts ---
async def sequential():
    print("SEQUENTIAL (await one at a time)")
    start = time.perf_counter()
    a = await fetch("task-a", 1)
    b = await fetch("task-b", 1)
    c = await fetch("task-c", 1)
    print(f"  total: {time.perf_counter() - start:.2f}s -> {[a, b, c]}\n")


# --- Concurrent: start all three, then wait for all of them ---
async def concurrent():
    print("CONCURRENT (asyncio.gather)")
    start = time.perf_counter()
    results = await asyncio.gather(
        fetch("task-a", 1),
        fetch("task-b", 1),
        fetch("task-c", 1),
    )
    print(f"  total: {time.perf_counter() - start:.2f}s -> {results}\n")


# --- Blocking code inside async ruins it ---
async def blocking_mistake():
    print("THE CLASSIC MISTAKE (time.sleep inside async)")
    start = time.perf_counter()

    async def bad(name):
        time.sleep(0.5)     # BLOCKS the whole event loop - nothing else can run
        return name

    await asyncio.gather(bad("x"), bad("y"), bad("z"))
    print(f"  time.sleep  : {time.perf_counter() - start:.2f}s (serialised!)")

    start = time.perf_counter()

    async def good(name):
        await asyncio.sleep(0.5)    # yields, so the others progress meanwhile
        return name

    await asyncio.gather(good("x"), good("y"), good("z"))
    print(f"  asyncio.sleep: {time.perf_counter() - start:.2f}s (overlapped)\n")


# --- Offload genuinely blocking work to a thread ---
async def offload():
    print("OFFLOADING BLOCKING WORK")

    def slow_library_call(n):
        time.sleep(0.5)             # imagine a sync DB driver or requests.get
        return n * 2

    start = time.perf_counter()
    results = await asyncio.gather(
        asyncio.to_thread(slow_library_call, 1),
        asyncio.to_thread(slow_library_call, 2),
        asyncio.to_thread(slow_library_call, 3),
    )
    print(f"  asyncio.to_thread: {time.perf_counter() - start:.2f}s -> {results}\n")


# --- Awaiting things that are not coroutines ---
async def awaitables():
    print("WHAT YOU CAN AWAIT")

    # A Task: a coroutine scheduled to run in the background right away
    task = asyncio.create_task(fetch("background", 0.5))
    print("  created a task; it is already running while we do other work")
    await asyncio.sleep(0.1)
    print("  task done?", task.done())
    print("  awaited   :", await task)

    # A Future: a placeholder for a result that arrives later
    loop = asyncio.get_running_loop()
    future = loop.create_future()
    loop.call_later(0.2, future.set_result, "filled by call_later")
    print("  future    :", await future, "\n")


async def main():
    await sequential()
    await concurrent()
    await blocking_mistake()
    await offload()
    await awaitables()

    print("SUMMARY")
    print("  async def          defines a coroutine")
    print("  await              pause here, let the loop run something else")
    print("  asyncio.run(main)  starts the event loop")
    print("  gather             run awaitables concurrently")
    print("  to_thread          push blocking code off the loop")
    print("\n  Use async for I/O-bound work (APIs, files, DBs).")
    print("  Use processes for CPU-bound work - see Concurrent Execution.")


if __name__ == "__main__":
    # asyncio.run creates the event loop, runs main(), then closes the loop.
    asyncio.run(main())
