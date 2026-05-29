---
id: python-40-concurrency-gil
title: Concurrency models & the GIL
track: python
topic: advanced-python
order: 40
estMinutes: 20
prerequisites: [python-35-cpython-internals-gc]
---

# Concurrency models & the GIL

Python concurrency is a common topic in advanced technical interviews. To tackle concurrency design questions, you must understand the **Global Interpreter Lock (GIL)** and how to select the right concurrency paradigm.

---

## 1. What is the GIL?

The **Global Interpreter Lock (GIL)** is a mutual exclusion lock used by the CPython interpreter to ensure that **only one OS thread executes Python bytecode at a time**.

### Why does the GIL exist?
CPython's internal memory management system is not thread-safe. Without the GIL, two threads running concurrently could attempt to increment/decrement the reference count (`ob_refcnt`) of the same object at the same time, leading to race conditions, memory corruption, or memory leaks.

To prevent this, the GIL locks the entire interpreter.

---

## 2. The Impact of the GIL: CPU vs. I/O Bound

The GIL splits Python operations into two categories:

### A. CPU-Bound Tasks (Terrible with Threads)
Tasks that require heavy mathematical calculations, image processing, or data parsing (e.g. calculating prime numbers, searching matrices).
* If you use Python's `threading` module for CPU-bound tasks, the threads will fight over the GIL. 
* CPython has to context-switch between threads, adding lock overhead. The execution time of a multithreaded CPU task will often be **slower** than running it sequentially on a single thread.

### B. I/O-Bound Tasks (Excellent with Threads)
Tasks that spend most of their time waiting for external events (e.g., API requests, database queries, disk reads/writes).
* When a Python thread makes a system call (like reading from a socket), it **releases the GIL** while waiting for the operation to complete.
* This allows another thread to run Python code. Thus, multithreading works well for network operations and database calls.

---

## 3. The 3 Concurrency Models in Python

Python provides three distinct ways to handle concurrent execution:

| Model | Module | Execution Model | Best Suited For | GIL Bypass? |
| :--- | :--- | :--- | :--- | :--- |
| **Multithreading** | `threading` | Pre-emptive multitasking (threads managed by OS) | I/O-Bound tasks | No (threads share memory/GIL) |
| **Multiprocessing**| `multiprocessing` | True parallel execution (separate OS processes) | CPU-Bound tasks | Yes (each process has its own GIL/Memory) |
| **Asyncio** | `asyncio` | Cooperative multitasking (single-threaded event loop) | Highly-concurrent network servers | No (runs on one thread) |

---

## 4. Multiprocessing: True Parallelism

To run computations on multiple CPU cores, you must bypass the GIL. You do this by spawning separate OS processes.

```python
from multiprocessing import Process

def calculate_primes(n):
    # Heavy mathematical operations here
    pass

if __name__ == "__main__":
    p1 = Process(target=calculate_primes, args=(1000000,))
    p2 = Process(target=calculate_primes, args=(1000000,))
    
    p1.start()
    p2.start()
    
    p1.join()
    p2.join()
```
* **Pros**: Bypasses the GIL. True multi-core speedup.
* **Cons**: Processes are heavy to spawn. Since they do not share memory, sending data between processes requires serialization (pickling), which has an I/O overhead.

---

## 5. Asyncio: Cooperative Event Loop

`asyncio` is single-threaded. It uses an **event loop** to run multiple **coroutines** cooperatively. 

```python
import asyncio

async def fetch_api(endpoint):
    print(f"Starting fetch: {endpoint}")
    await asyncio.sleep(2) # Simulates network delay (yields control back to event loop)
    print(f"Finished fetch: {endpoint}")
    return {"data": endpoint}

async def main():
    # Runs both fetches concurrently on a single thread
    results = await asyncio.gather(
        fetch_api("/users"),
        fetch_api("/orders")
    )
    print("Done")

asyncio.run(main())
```

### How does it work?
1. The coroutine starts running on the event loop.
2. When it encounters an `await` statement on a non-blocking socket operation (like `asyncio.sleep` or network I/O), it **yields control** back to the event loop.
3. The event loop switches to execute another coroutine that is ready to run.
4. Once the original I/O operation is complete, the event loop resumes the first coroutine.

* **Pros**: Low memory overhead. Easily manages thousands of concurrent connections. No thread context-switch overhead.
* **Cons**: A single CPU-bound statement (like a long `for` loop) will block the event loop and freeze the entire application.

---

## 6. Interview Checklist
* If the interviewer asks: *"How do you process 10,000 files?"* -> Answer: `asyncio` (if I/O bound) or a process pool (`ProcessPoolExecutor` from `concurrent.futures`) if parsing lines requires heavy regex processing.
* If the interviewer asks: *"How do you calculate matrix dot products in parallel?"* -> Answer: `multiprocessing` to bypass the GIL, or utilize a library written in C/C++ (like `numpy`) that releases the GIL internally during array arithmetic.
