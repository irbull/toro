---
pubDatetime: 2024-10-15
title: Rust Infers Closure Types on First Call
slug: infers-closure-type
tags:
  - TIL
  - Rust
description: "Today I learned that in Rust, if you define a closure without specifying concrete types, Rust will infer the types upon the first use, and any subsequent use with different types will result in a compilation error."
---

If you attempt to define a closure without concrete types, Rust will infer the types the first time the closure is called. In the following example, Rust will infer that the type of `x` in `|x| x + 1` is an `i32`, and, if you attempt to use this closure with any other type, it will fail to compile.

```rust
fn main() {
    let add_one = |x| x + 1;
    let x = 5;
    println!("{} + 1 = {}", x, add_one(x));
    let y = 10.0;
    println!("{} + 1 = {}", y, add_one(y));
}
```
