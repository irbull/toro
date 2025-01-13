---
author: "Ian Bull"
pubDatetime: 2025-01-13
title: "A Gentle Introduction to Axum, Tracing, and Logging"
postSlug: axum-rust-tracing
featured: false
tags:
 - rust
 - axum
description: "In this article, I demonstrate how to build a simple Axum-based REST API in Rust and leverage the `tracing` crate for enhanced logging and diagnostics."
---

In any real-world application, logging is crucial for diagnosing problems and understanding application behavior. Rust offers several powerful crates for logging ([`log`](https://crates.io/crates/log)) and structured tracing ([`tracing`](https://crates.io/crates/tracing)). In this post, we’ll build a simple Axum-based REST API and show how to use `tracing` to automatically include context—like HTTP method and path—in our logs.

We’ll also delve into the variety of log levels, how to set different log levels per crate, and why structured logs are so beneficial for observability.

## Table of Contents

## What Are Logging and Tracing?

- **Logging** is the traditional practice of printing messages (like _“User 123 not found”_ or _“Connection error”_) at various places in your code. In Rust, `log` is the standard facade for logging, and you typically emit messages via macros like `log::info!` or `log::error!`.
- **Tracing** goes one step further by allowing you to create “spans” of time that carry contextual data. For instance, if you have an HTTP request, you can capture details such as the method (`POST`), path (`/messages`), and a unique request ID in a span. Any logging done within that span automatically attaches these details, making it easy to see _which request_ triggered _which log messages_.

When you add asynchronous concurrency into the mix, `tracing` becomes even more valuable because it can track these spans across async await boundaries, ensuring logs stay tied to the correct request or operation.

---
## Log Levels

Rust’s `log` crate (and by extension `tracing`) supports the following log levels, from most **verbose** to most **urgent**:

1. **Trace** – For extremely detailed logs, often describing almost every step in your code.
2. **Debug** – For information that’s more relevant for debugging but might be too verbose for production.
3. **Info** – For general operational messages, e.g., _“Server started”_, _“User logged in”_.
4. **Warn** – For non-fatal issues that might need attention, e.g., _“Couldn’t parse config, using defaults”_.
5. **Error** – For serious issues that might lead to failures, e.g., _“Database connection lost”_.

When you configure your logger, you decide the _minimum_ level you want to see. Anything _above_ that level also appears. For example, if you set `RUST_LOG=warn`, you’ll see _only_ `warn` and `error` logs.

---

## Why Combine Axum, `tower-http`, and `tracing`?

- **Axum**: A lightweight, ergonomic framework for building async web servers using the Tokio runtime.
- **tower-http**: Provides middleware (including `TraceLayer`) that can automatically create a `tracing` span for each HTTP request, capturing metadata like the request path or method.
- **tracing** + `log`: By bridging `log` macros with `tracing`, you can keep using the familiar `log::info!` or `log::warn!` macros. `tracing` will attach the active span’s data (such as path, method, request ID) to every log statement—no manual passing required!

---

## Project Setup

Start by creating a new Rust project:

```bash
cargo new axum-tracing-example
cd axum-tracing-example
```

In your `Cargo.toml`, include:

```toml
[package]
name = "axum-tracing-example"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.8.1"
log = "0.4.24"
serde = { version = "1.0.216", features = ["derive"] }
tokio = { version = "1.43.0", features = ["full"] }
tower = "0.5.2"
tower-http = {version = "0.6.2", features = ["trace"] }
tracing = "0.1.41"
tracing-subscriber = { version = "0.3.19", features=["env-filter"] }
```

---

## Walkthrough of `main.rs`

Below is our entire `src/main.rs`. We’ll examine it piece by piece:

```rust
use axum::response::IntoResponse;
use axum::{routing::get, Json, Router};
use log::info;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tokio;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

// A simple data type we'll send and receive as JSON.
#[derive(Debug, Serialize, Deserialize)]
struct Message {
    content: String,
}

// Handler for GET /messages
async fn list_messages() -> impl IntoResponse {
    info!("Handling list_messages request");
    Json(vec!["Hello from the server!".to_string()])
}

// Handler for POST /messages
async fn create_message(Json(message): Json<Message>) -> impl IntoResponse {
    info!("Handling create_message request");
    Json(format!("New message: {}", message.content))
}

#[tokio::main]
async fn main() {
    // 1. Initialize tracing + log bridging
    tracing_subscriber::fmt()
        // This allows you to use, e.g., `RUST_LOG=info` or `RUST_LOG=debug`
        // when running the app to set log levels.
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .or_else(|_| EnvFilter::try_new("axum_tracing_example=error,tower_http=warn"))
                .unwrap(),
        )
        .init();

    // 2. Build our router
    let app = Router::new()
        // Define routes: GET /messages and POST /messages
        .route("/messages", get(list_messages).post(create_message))
        // 3. Add a TraceLayer to automatically create and enter spans
        .layer(TraceLayer::new_for_http());

    // 4. Run our Axum server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

### Key Points

- We use **`tracing_subscriber::fmt()`** to create a subscriber that formats log output.
- **`.with_env_filter("axum_tracing_example=trace,tower_http=trace")`** sets the default filtering rules for log levels (more on that below).
- **`TraceLayer::new_for_http()`** automatically creates a tracing span for every HTTP request, capturing metadata like the path, method, and request headers.
- We write logs via **`info!()`**. These logs now inherit the active `Span` context.

---

## How `with_env_filter` Works

`with_env_filter` lets you specify which crates log at which levels. By default, we use `axum_tracing_example=trace,tower_http=trace`. This means:

- **`axum_tracing_example=trace`**: All logs in our **local crate** (named “axum_tracing_example” in `Cargo.toml`) will show up at level **trace** or higher (which includes debug, info, warn, and error).
- **`tower_http=trace`**: The `tower_http` crate logs at the **trace** level, which is the most verbose.

If you wanted to see fewer logs from `tower_http`, you could do:

```rust
.with_env_filter("axum_tracing_example=error,tower_http=warn")
```

That means anything from our code logs at `trace`, but `tower_http` logs only its `warn` and `error` messages (no debug or info or trace from it).

### Setting It via Environment Variable

You can also override the filter via the `RUST_LOG` environment variable without changing code. For example:

```bash
RUST_LOG=axum_tracing_example=debug,tower_http=warn cargo run
```

Now, at runtime:

- Our crate logs only at `debug` level or above.
- `tower_http` logs only at `warn` level or above.
- If we wanted to see _all_ logs from all crates, we’d do `RUST_LOG=trace cargo run`.

This flexible filtering is a major advantage because you can enable or disable logging in third-party crates without changing your code—just adjust the environment variable!

---

## Trying It Out

1. **Run the server**:
    
    ```bash
    # Start the server with the default filter in code:
    cargo run
    ```

    Or specify your own levels:

    ```bash
    RUST_LOG=axum_tracing_example=info,tower_http=debug cargo run
    ```
    
2. **Send requests**:

    In another terminal:

    ```bash
    curl -X GET http://127.0.0.1:3000/messages
    curl -X POST -H "Content-Type: application/json" \
         -d '{"content":"Hello Axum"}' \
         http://127.0.0.1:3000/messages
    ```
    
3. **Check the logs**:

    You’ll see lines like:

    ```bash
    INFO  request{method=GET uri=/messages ...}: axum_tracing_example: Handling list_messages request
    INFO  request{method=POST uri=/messages ...}: axum_tracing_example: Handling create_message request
    ```

Notice that each log includes `request{method=... uri=...}`, courtesy of `TraceLayer`. It wraps each request in a “span” that captures the request metadata. When you call `info!`, `trace` automatically appends that active span information to your log message.

---

## Conclusion

By combining **Axum** with **tower-http**’s `TraceLayer` and the **tracing** ecosystem, you get:

1. **Structured logs** that automatically include request context.
2. **Flexible log filters** to tweak verbosity at runtime.
3. **Minimal code overhead**, letting the `log` macros you know and love emit structured tracing events under the hood.

The code for this tutorial is available on GitHub: [https://github.com/irbull/axum_tracing_example](https://github.com/irbull/axum_tracing_example).
