---
author: "Ian Bull"
pubDatetime: 2025-04-16
title: "Tokio A Deep Dive into Concurrency Vs. Parallelism"
postSlug: tokio-parallel
featured: false
tags:
 - Rust
 - Tokio
description: "In this article, I explore the differences between concurrency and parallelism in Rust using Tokio, and provide insights into effectively managing async tasks and CPU-bound workloads."
---

# Tokio: A Deep Dive into Concurrency Vs. Parallelism

*by Ian Bull*

Every Rustacean eventually encounters the async maze: “If I write `async fn`, why doesn’t it automatically run on all my cores?” Today, we’ll unpack three Tokio patterns: pure async, `tokio::spawn`, and `spawn_blocking`.

## 1. The Pure‑Async Trap

```rust
    // Example 1: async + join_all with sleep
    #[tokio::main(flavor = "multi_thread", worker_threads = 8)]
    async fn main() {
        let tasks = (1..=100).map(|i| async move {
            println!("Starting Task-{i}");
            tokio::time::sleep(Duration::from_secs(1)).await;
        });

        futures::future::join_all(tasks).await;
    }
```

Here, each task does nothing but wait. Because `sleep().await` yields, **all 100 timers** can be registered and polled across your runtime threads without ever blocking. This is true **concurrency**, but zero CPU sweat—your app sleeps more than anything else.

> **Key takeaway**:  
> Great for I/O or timer-based work. No CPU parallelism, but excellent concurrency and super lightweight.

## 2. The CPU‑Bound Async Trap (Don’t Do This)

```rust
    // Example 2: async |s| CPU work, no .await
    #[tokio::main(flavor = "multi_thread", worker_threads = 8)]
    async fn main() {
        let collection: Vec<String> = (1..=100)
            .map(|i| format!("Task-{i}"))
            .collect();

        let tasks = collection.into_iter().map(async |s| {
            println!("Starting {}", s);
            // pure CPU work, never yields
            let _ = sum_one_to_billion();
        });

        futures::future::join_all(tasks).await;
    }
```

This one looks innocent with no explicit `tokio::spawn` or `spawn_blocking`, but it’s a trap. Because there's **no** `.await` inside those closures, each future’s entire work runs **inline** on the executor thread the moment it’s polled. They execute one after the other:

```bash
    Starting Task-1
    // sum_one_to_billion runs to completion, blocking the thread
    Starting Task-2
    // sum_one_to_billion again...
```

You get neither concurrency nor parallelism: just sequential, blocking CPU work on a single core. Don’t do this.

> **Key takeaway**:  
> Runs each CPU job to completion before starting the next. Zero concurrency, zero parallelism. Blocks your async runtime.

## 3. Spawning Your Way to “Parallel”

```rust
    // Example 2: spawn + async block with CPU work
    #[tokio::main(flavor = "multi_thread", worker_threads = 8)]
    async fn main() {
        let handles = (1..=100).map(|i| {
            tokio::spawn(async move {
                println!("Starting Task-{i}");
                let _ = sum_one_to_billion();
            })
        });

        futures::future::join_all(handles).await;
    }
```

By wrapping our CPU‑bound loop in `tokio::spawn`, we ask Tokio’s **core worker threads** (eight of them here) to each tackle tasks. Suddenly, our sums can run in parallel—up to eight at a time—across CPU cores. 🎉

But beware: these eight threads also handle **all** your async I/O. If you hog them with heavy loops, your timers, sockets, and other async tasks will queue up behind your cpu bound workloads.

> **Key takeaway**:  
> Enables parallel CPU use, but at the cost of starving the async machinery. Use sparingly for short bursts.

## 4. The Blocking Pool Savior

```rust
    // Example 3: spawn_blocking for true isolation
    #[tokio::main(flavor = "multi_thread", worker_threads = 8)]
    async fn main() {
        let handles = (1..=100).map(|i| {
            tokio::task::spawn_blocking(move || {
                println!("Starting Task-{i}");
                sum_one_to_billion()
            })
        });

        let results = futures::future::join_all(handles).await;
    }
```

Enter `spawn_blocking`—Tokio’s dedicated thread pool for heavyweight, non‑async work. By shunting our billion‑sum loop into that separate pool, we get:

- **True parallelism** across as many threads as you have CPU cores.  
- **Unblocked async threads**, so your timers and I/O sail through without delay.  

This will blocking tasks on the side, and leave room for the async tasks front and centre.

> **Key takeaway**:  
> The go‑to for CPU‑bound jobs—keeps your async runtime snappy and responsive.

## Concurrency Vs. Parallelism: The Short Version

- **Concurrency**: Structuring work so tasks can *overlap* (e.g. while one sleeps, another runs).  
- **Parallelism**: Doing work *literally at the same time* on multiple CPU cores.

| Pattern                                        | Concurrency        | Parallelism          | Runtime Impact                         |
|------------------------------------------------|--------------------|----------------------|----------------------------------------|
| Pure `async` + `join_all` (I/O)                | ✅ High            | ❌ None              | Super‑light; no CPU blocking           |
| CPU‑bound `async` (no `.await`)                | ❌ None            | ❌ None              | Blocks executor; sequential only       |
| `tokio::spawn` (async block with CPU work)     | ✅ Moderate        | ✅ Limited (threads) | Can starve I/O if over‑used            |
| `spawn_blocking`                               | ✅ Yes (separate)  | ✅ Full (cores)      | Safe CPU offload; async stays snappy   |

## When and Why

1. **I/O‑heavy workflows** (HTTP servers, DB calls):  
   Stick with pure async and `join_all`.  
2. **Meaty CPU computations** (sum loops, image processing):  
   Offload to `spawn_blocking`.  
3. **Quick CPU bursts** (minor data crunches):  
   `tokio::spawn` can work—but watch out for I/O starvation.  
4. **Never** write CPU loops inside an async block **without** an await or spawn:  
   You’ll block your runtime thread and kill your concurrency.

Always ask: *“Am I about to bog down my async executor?”* If the answer is yes, offload to the blocking pool.

---

Rust’s async model doesn’t magically parallelize CPU work. It gives you the tools to choose:

- Lean on **async** for latency‑bound tasks.  
- Reach for **`spawn_blocking`** when you need raw horsepower.  
- Use **`tokio::spawn`** sparingly for short bursts.  
- And **never** hide a big loop inside an async closure without yielding.

With these patterns in your toolkit, you’ll know exactly when you’re doing CPU work versus I/O, and you’ll keep both flows humming optimally. No more surprises, no more blocked threads: *just clean, explicit, idiomatic Rust*.

*Stay curious, keep it simple, and remember: not every task needs to burn CPU cycles.*  
