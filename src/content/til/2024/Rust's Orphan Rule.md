---
pubDatetime: 2024-10-16
title: "Rust's Orphan Rule"
slug: rust-orphan-rule
tags:
  - TIL
  - Rust
description: "Today I learned about the orphan rule in Rust, which restricts implementing a trait for a type unless either the trait or the type is defined in your crate, ensuring consistency and preventing conflicting implementations across different crates."
---

The **orphan rule** in Rust is a restriction that prevents you from implementing a trait for a type if neither the trait nor the type is defined in the current crate (i.e., your current code module or library). This rule ensures that there are no conflicting implementations of traits for a type, which helps maintain consistency and prevents ambiguity.

To put it simply, **you can only implement a trait for a type if at least one of them (either the trait or the type) is defined locally in your crate**. For example:

1. **Allowed Implementations:**

   - You can implement your own trait (`MyTrait`) for any type, such as `String` or `i32`.
   - You can implement any trait (including standard library traits like `Display` or `Sum`) for your own types (e.g., `MyStruct`).

2. **Disallowed Implementation:**
   - You cannot implement a standard library trait (e.g., `Sum`) for a standard library type (e.g., `i32`), because neither the trait nor the type is defined in your crate.

The orphan rule prevents multiple crates from attempting to provide conflicting or overlapping trait implementations for the same types, which would create ambiguity and lead to unpredictable behavior when importing different crates.

For example, if you wanted to implement the `Sum` trait for `String` references, which sums up the lengths of all the strings in an iterator, you would need to create a new type (`StrLenSum`) and implement the trait for that type:

```rust
use std::iter::Sum;

struct StrLenSum(i32);

impl<'a> Sum<&'a String> for StrLenSum {
    fn sum<I: Iterator<Item = &'a String>>(iter: I) -> StrLenSum {
        StrLenSum(iter.map(|s| s.len() as i32).sum())
    }
}

fn main() {
    let v1 = vec!["hello".to_string(), "world".to_string()];
    let v1_iter = v1.iter();
    let total: StrLenSum = v1_iter.sum();
    println!("{}", total.0);
}
```

In this example, `StrLenSum` is a custom type we created so that we could provide a specialized implementation of the `Sum` trait for string references. This allows us to sum the lengths of strings in an iterator while adhering to the orphan rule.
