---
author: Ian Bull
pubDatetime: 2024-07-20
title: "Early Return in Rust Nightly"
postSlug: rust-early-return
ogImage: /assets/og_images/early-return-rust.png
featured: false
tags:
  - rust
  - technology
description: "In this article, I explore the Rust programming language's question mark (`?`) operator, explaining how it works for error handling and early returns, and demonstrate its usage with a BlackJack dealer game."
---

Most people working with Rust know that the question mark operator (`?`) unwraps valid values or returns erroneous values, propagating them to the calling function. While this might be the technical definition, a more interesting question is _how_ does it work and _what_ does it mean?

Let's back up.

# Error Handling

Different languages support _error conditions_ or _exceptions_ in different ways. C has historically used an error code with out-parameters, while languages like Java and JavaScript make use of exceptions. While most languages have error handling constructs, they can often be circumvented. For example, in Java if function fetches an item, you could throw and exception if that item doesn't exist or you could return `null`. Returning `null` is easy but it has been referred to as [The Billion Dollar Mistake](https://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare/).

Rust takes a different approach; it uses a `Result` enumeration with `Ok` and `Error` enumerators. This means that when functions are called, the caller is responsible for checking the `Result`, proceeding when things are _ok_ and handling the _error_.

This has two advantages:

1. You cannot accidentally forget to deal with the error as you could if `null` was returned
2. When reading the code, the error handling is visible immediately

If the error cannot be handled in this scope, it is propagated.

In this case, we will attempt to divide a number by 2. If it's divisible, we will return the result; otherwise, an error will be returned.

```rust
fn perform_task(x: i32) -> Result<i32, Box<dyn Error>> {
    let result = div_two(x);

    // use of match expression to match Result type
    let half = match result {
        Ok(value) => value,
        Err(error) => return Err(error),
    };
    // do something with `half`
}
```

This is such a common pattern that early versions of Rust included the `try` macro to do just this.

```rust
macro_rules! r#try {
    ($expr:expr) => (match $expr {
        $crate::result::Result::Ok(val) => val,
        $crate::result::Result::Err(err) => {
            return $crate::result::Result::Err($crate::convert::From::from(err))
        }
    });
    ($expr:expr,) => ($crate::r#try!($expr));
}
```

The question mark operator (`?`) in Rust is just syntactic sugar around that macro.

# The Question Mark (`?`) Operator

The Question Mark (`?`) Operator is short hand syntax that unpacks the Result if it's `Ok` or returns the `Error` if not.

```rust
fn perform_task(x: i32) -> Result<i32, Box<dyn Error>> {
    let half = div_two(x)?;

    // do something with `half`
}
```

In this example, if `some_function` returns an error it will be immediately propagated, otherwise the result will be `unwrapped` and assigned to `half`.

# Really Just Early Return

While the question mark (`?`) operator is used mostly for error handling (and also for option handling), it's really just an early return operator. That is, it continues to execute the function in the normal case but immediately returns in the abnormal case. The only reason it's grouped with error handling is because the default implementation of the syntactic sugar only works for `Result` (and `Option`). In Rust Nightly, you can implement your own _early return_ behaviour by implementing the `Try` and `FromResidual` traits. Let's look at an example.

# Card Game

Let's create a simple BlackJack dealer game, where the dealer will draw on 16 or less and stand on 17 or more.

```rust
fn play() -> Hand {
    let mut hand = Hand();
    loop {
        hand = hand.hit(Card::draw())?;
    }
}
```

Once the cards in the hand total 17 or more, the dealer will stop taking cards. This isn't an `Error`, it's just an early return. After the `play` function returns, the game will simply print the dealers hand.

```rust
fn main() {
    let score = play();
    println!("Game over. Dealer {}", score);
}
```

This can be achieved by implementing the `Try` and `FromResidual` traits available in Rust Nightly. It's important that the feature flag `#![feature(try_trait_v2)]` is specified and that the application with built wit the nightly toolchain.

```rust
impl Try for Hand {
    type Output = Self;
    type Residual = Self;

    fn from_output(output: Self::Output) -> Self {
        output
    }

    fn branch(self) -> ControlFlow<Self, Self::Output> {
        if self.0 >= 17 {
            ControlFlow::Break(self)
        } else {
            ControlFlow::Continue(self)
        }
    }
}

impl FromResidual for Hand {
    fn from_residual(residual: <Self as Try>::Residual) -> Self {
        residual
    }
}
```

# Code

Here is a summary of the code, with the entire code available on [GitHub](https://github.com/irbull/rust-early-return). It can be run with:

```shell
cargo +nightly run --example cards
```

```rust
#![feature(try_trait_v2)]

use core::fmt;
use std::{
    fmt::{Display, Formatter},
    ops::{ControlFlow, FromResidual, Try},
};

#[derive(Debug)]
pub struct Hand(i32);

#[derive(Debug)]
pub enum Card {
    Ace,
...
    King,
}

impl Card {
    fn draw() -> Self {
        match rand::random::<u8>() % 13 {
            0 => Card::Ace,
...
            12 => Card::King,
            _ => unreachable!(),
        }
    }
}

impl Hand {
    fn hit(mut self, x: Card) -> Self {
        let value = match x {
            Card::Ace => 1,
...
            Card::Nine => 9,
            Card::Ten | Card::Jack | Card::Queen | Card::King => 10,
        };
        self.0 += value;
        self
    }
}

impl Display for Hand {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        match self.0 {
            21 => write!(f, "Blackjack!"),
            x if x > 21 => write!(f, "Bust!"),
            x => write!(f, "{}", x),
        }
    }
}

impl Try for Hand {
    type Output = Self;
    type Residual = Self;

    fn from_output(output: Self::Output) -> Self {
        output
    }

    fn branch(self) -> ControlFlow<Self, Self::Output> {
        if self.0 >= 17 {
            ControlFlow::Break(self)
        } else {
            ControlFlow::Continue(self)
        }
    }
}

impl FromResidual for Hand {
    fn from_residual(residual: <Self as Try>::Residual) -> Self {
        residual
    }
}

fn play() -> Hand {
    let mut hand = Hand(0);
    loop {
        let card = Card::draw();
        println!("{:?}", card);
        hand = hand.hit(card)?;
    }
}

fn main() {
    let score = play();
    println!("Game over. Dealer {}", score);
}
```

# Summary

Rust's question mark (`?`) operator is a powerful tool that streamlines error handling by allowing for concise and clear propagation of errors. But as we've seen, it's not limited to just error scenarios—it encapsulates the concept of early return, providing a way to exit functions early when certain conditions are met. By leveraging this operator, Rust encourages robust and intentional error management practices that are transparent at the call site. Moreover, with the nightly Rust features like `Try` and `FromResidual` traits, developers have the flexibility to extend this functionality beyond `Result` and `Option` types, opening a world of possibilities for control flow management in their applications. Whether you're dealing with potential failures or simply need to break out of a loop when a condition is reached, the question mark operator offers an elegant solution that aligns with Rust's emphasis on safety and expressiveness.

For more information about this feature, checkout the [`try_trait_v2` RFC](https://rust-lang.github.io/rfcs/3058-try-trait-v2.html).
