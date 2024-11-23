---
pubDatetime: 2024-11-22
title: Binary Search in Rust Vectors
slug: rust-vec-binary-search
tags:
  - Rust
  - TIL
description: "Today I learned that Rust provides a binary search API on Vectors."
---

Rust provides a Binary Search API on Vectors. This makes it easy to do the performant thing, although it does require the vector to be sorted. Here is a short example of how to use this API and how it compares against a linear search (spoiler alert, binary search is _A LOT_ faster). Using this API means you won't end up like [Richard Hendricks](https://www.youtube.com/watch?v=9FzT2I21F3k&ab_channel=RandomClips).

```rust
use rand::Rng;
use std::time::Instant;

const SIZE: u32 = 1_000_000_000;
const NUM_SEARCHES: u32 = 20;

fn main() {
    let generate_numbers_start_time = Instant::now();
    let mut v: Vec<u32> = vec![0, SIZE];
    let mut rng = rand::thread_rng();

    // Populate the vector with random values
    for _ in 0..SIZE {
        let x = rng.gen_range(1..=SIZE);
        v.push(x);
    }
    // Sort the vector for binary search
    v.sort();
    let generate_numbers_elapsed_time = generate_numbers_start_time.elapsed();

    // Generate NUM_SEARCHES random numbers to search for
    let search_numbers: Vec<u32> = (0..NUM_SEARCHES).map(|_| rng.gen_range(0..SIZE)).collect();

    // Measure the time taken for NUM_SEARCHES binary searches
    let binary_start_time = Instant::now();
    for num in &search_numbers {
        let _ = v.binary_search_by(|x| x.cmp(num));
    }
    let binary_elapsed_time = binary_start_time.elapsed();
    let binary_avg_time_per_search = binary_elapsed_time.as_secs_f64() / NUM_SEARCHES as f64;

    // Measure the time taken for NUM_SEARCHES linear searches
    let linear_start_time = Instant::now();
    for num in &search_numbers {
        let _ = v.iter().position(|&x| x == *num);
    }
    let linear_elapsed_time = linear_start_time.elapsed();
    let linear_avg_time_per_search = linear_elapsed_time.as_secs_f64() / NUM_SEARCHES as f64;

    // Print the search times
    println!(
        "Total time taken to generate {} random numbers: {:.9} seconds",
        SIZE,
        generate_numbers_elapsed_time.as_secs_f64()
    );
    println!(
        "Total time taken for binary searches: {:.9} seconds",
        binary_elapsed_time.as_secs_f64()
    );
    println!(
        "Total time taken for linear searches: {:.9} seconds",
        linear_elapsed_time.as_secs_f64()
    );
    println!(
        "Average time per search (binary search): {:.9} seconds",
        binary_avg_time_per_search
    );
    println!(
        "Average time per search (linear search): {:.9} seconds",
        linear_avg_time_per_search
    );
}
```

`cargo run --release`

```
Total time taken to generate 1000000000 random numbers: 39.183353833 seconds
Total time taken for binary searches: 0.000178542 seconds
Total time taken for linear searches: 5.702346791 seconds
Average time per search (binary search): 0.000008927 seconds
Average time per search (linear search): 0.285117340 seconds
```
