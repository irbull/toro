---
pubDatetime: 2024-10-01
title: Rust Lifetime Elision
postSlug: rust-lifetime-elision
tags:
  - TIL
  - Rust
description: "Today I learned that Rust's lifetime elision rules can cause compilation issues when it incorrectly ties the output lifetime to an input, and this can be resolved by explicitly specifying unrelated lifetimes in the function signature."
---

Rust will _elide_ lifetimes under certain circumstances when it assumes they are not needed. For the most part this is correct, but it's important to know the Lifetime Elision rules for the cases when they are not being elided correctly.

In the following example, a reference count is passed by reference, and a new reference to a _DBConnection_ is returned. This won't compile, as Rust will assume that the lifetime of the _DBConnection_ is tied to the reference count, which is actually not what we want.

```rust
use std::alloc::{alloc, Layout};

#[derive(Debug)]
struct DBConnection {
    port: u16,
}

fn main() {
    let mut initial_ref_count = 0;
    let ref_count = &mut initial_ref_count;
    let connection = increase_ref_count_and_create_db(ref_count);
    println!("count: {}", ref_count);
    println!("connection: {:?}", connection);
}

fn increase_ref_count_and_create_db(input: &mut u16) -> &DBConnection {
    *input += 1;
    create_db_connection()
}

fn create_db_connection<'a>() -> &'a DBConnection {
    unsafe {
        let layout = Layout::new::<DBConnection>();
        let ptr = alloc(layout) as *mut DBConnection;

        (*ptr).port = 42;
        ptr.as_ref().unwrap()
    }
}

```

The Lifetime Elision rules are as follows:

1. Multiple arguments with no output: All arguments have independent lifetimes.
2. One input with outputs: All outputs have the same lifetime as the input.
3. A function with `&self` or `&mut self` and outputs: All outputs have the same lifetime as `self`.

In this case, it's number 2. The output is tied to the lifetime of the single input. This means that the borrow checker assumes that the &DBConnection that is returned from `increase_ref_count_and_create_db` is owned by the reference to `input`.

This can be "fixed" by telling the borrow checker these are not related by updating the signature of the `increase_ref_count_and_create_db` function:

```rust
fn increase_ref_count_and_create_db<'a, 'b>(input: &'a mut u16) -> &'b DBConnection {
```
