---
author: Ian Bull
pubDatetime: 2024-11-25
title: "What Does Idiomatic Rust Really Mean"
postSlug: idiomatic-rust

featured: false
tags:
 - Rust
 - Technology
description: "This article shares my journey and insights into writing idiomatic Rust, focusing on leveraging the language’s unique features like the borrow checker, expressions, `Option` and `Result` types, iterators, and Clippy to write clearer and more efficient code."
---

If you’ve been around the Rust community, you’ve probably heard the term "idiomatic Rust." It’s one of those phrases people throw around, but it’s not always clear what it means—or why it matters. After a year and half of working with Rust, I’m still figuring it out myself. I wouldn’t call myself an expert, but I’ve learned enough to start seeing patterns, and I thought it might help to share what I’ve picked up so far.

---
### What _Is_ Idiomatic Rust?

To me, idiomatic Rust is about writing code that feels like it belongs in Rust. It’s not just about getting things to compile (though that’s always a win!); it’s about writing code that works _with_ the language, not against it. It’s the kind of code that other Rust developers can look at and immediately understand. It’s clear, efficient, and takes advantage of the features that make Rust what it is.

But here’s the catch: "idiomatic" doesn’t mean there’s one "right" way to do things. It’s more of a mindset. It’s about understanding Rust’s philosophy and leaning into it instead of trying to force old habits into a new language.

---
### How I’m Learning to Write Idiomatic Rust

Here are some of the principles I’ve picked up. They’ve helped me write code that feels more natural—and has fewer fights with the borrow checker.

#### 1. **Work With the Borrow Checker, Not Against It**

Rust’s ownership and borrowing system is powerful, but it can feel strict when you’re starting out. Over time, I’ve realized that if I’m constantly cloning things or adding unnecessary `mut`, I’m probably doing it wrong.

_Early days:_

```rust
let s = some_string.clone(); // Feels safe but adds overhead
```

_Now:_

```rust
let s = &some_string; // Borrowing is usually all you need
```

By trusting the borrow checker and using references where I can, I’ve learned to write code that’s both faster and easier to reason about.

---

#### 2. **Expressions Over Statements**

Rust loves expressions. If you’re writing a lot of `let` statements or explicitly returning values, there’s often a cleaner way.

_What I used to write:_

```rust
let result;
if condition {
  result = 10;
} else {
  result = 20;
}
```

_What I try to write now:_

```rust
let result = if condition { 10 } else { 20 };
```

Using expressions doesn’t just make the code shorter—it makes it more Rust-y.

---

#### 3. **Lean On `Option` and `Result`**

One of Rust’s strengths is how it handles optional and error-prone values. The `Option` and `Result` types are everywhere, and using their combinators (like `map`, `and_then`, and `unwrap_or`) keeps your code both safe and clean.

_What I used to write:_

```rust
if let Some(value) = some_option {
  // Do something with value
} else {
  // Handle the None case
}
```

_What I’m learning to write:_

```rust
let result = some_option.unwrap_or(default_value);
```

It’s amazing how much cleaner things get when you embrace these tools.

---

#### 4. **Iterators Are Your Friend**

Rust’s iterator model is one of the language’s superpowers. Once you start thinking in iterators, a lot of manual loops start to look clunky.

_What I used to do:_

```rust
for i in 0..vec.len() {
  println!("{}", vec[i]);
}
```

_What I do now:_

```rust
for item in &vec {
  println!("{}", item);
}
```

Iterators don’t just make the code prettier—they often make it faster, too.

---
#### 4. **Learn To Obey Clippy**

Finally, learn to trust and obey _Clippy_. [_Clippy_](https://github.com/rust-lang/rust-clippy) is a linter for Rust that not only catches common mistakes but also offers suggestions to improve your code and follow more idiomatic patterns. In the example above with the indexed array, _Clippy_ suggests the iterator approach:

```rust
warning: the loop variable `i` is only used to index `vec`
  --> src/lib.rs:10:14
   |
10 |     for i in 0..vec.len() {
   |              ^^^^^^^^^^^^
   |
   = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#needless_range_loop
   = note: `#[warn(clippy::needless_range_loop)]` on by default
help: consider using an iterator
   |
10 |     for <item> in &vec {
```

You can enable Clippy in your CI Pipelines to catch errors _early and often_.

---
### Why Does Idiomatic Rust Matter?

Idiomatic Rust isn’t just about making your code look nice. It’s about writing code that:

- **Plays well with others:** Other Rust developers can understand and maintain it. Most Rust code _looks the same_, which makes it very easy to dive into someone else's library.
- **Performs better:** Rust’s features are designed for safety and speed—leaning into them gets you both. The Rust compiler can often optimize idiomatic code (such as iterators) very well. Stick to the patterns that work!
- **Feels satisfying:** When your code clicks with the language, it’s just fun to write. While this is certainly subjective, I find Rust code less monotonous to write. As someone once told me, it's almost like solving a bunch of little puzzles.

It’s also about learning to trust Rust. The language gives you powerful tools—ownership, pattern matching, iterators, and more. Writing idiomatic code means using those tools to their full potential.

---

### Still Learning

After 1.5 years with Rust, I still have a lot to learn. But the more I lean into the language’s philosophy, the easier things get. If you’re just starting out (or even if you’ve been at it for a while), my advice is simple: keep writing code, read other people’s code, and don’t be afraid to refactor when you spot a better way. That’s how you get closer to idiomatic Rust—one line at a time.
