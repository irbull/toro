---
pubDatetime: 2024-11-22
title: BlueSky API With Rust
slug: "bsky-api-rust"
tags:
  - TIL
  - Rust
description: "Today I wrote an example of how to create a post using the Atrium bksy-sdk in Rust and contributed it as a pull request on GitHub."
---

I wrote a small example of how to create a post using the [Atrium bksy-sdk](https://github.com/sugyan/atrium/tree/main/bsky-sdk). I contributed it as a [PR](https://github.com/sugyan/atrium/pull/255#event-15342233207).

```rust
use atrium_api::types::string::Datetime;
use bsky_sdk::BskyAgent;
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let agent = BskyAgent::builder().build().await?;
    agent.login("...", "...").await?;
    agent
        .create_record(atrium_api::app::bsky::feed::post::RecordData {
            created_at: Datetime::now(),
            embed: None,
            entities: None,
            facets: None,
            labels: None,
            langs: None,
            reply: None,
            tags: None,
            text: "Hello world, from Rust!".to_string(),
        })
        .await?;
    Ok(())
}
```
