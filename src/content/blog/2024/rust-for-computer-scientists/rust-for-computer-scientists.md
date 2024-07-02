---
author: Ian Bull
pubDatetime: 2024-07-02
title: Rust For Computer Scientists
postSlug: rust-for-computer-scientists
featured: false
tags:
  - rust
  - technology
description: "As a computer science enthusiast, I delve into the intricacies of Rust, exploring the underlying mechanisms of its memory management through hands-on tutorials and sharing my own solutions and bug fixes on GitHub."
---

For anybody who studied (and enjoyed) a traditional computer science degree, one focused on Math, Data Structures, Algorithms, and Computational Theory, you might find many of today's blogs and tutorials hard to follow. Many articles today will show you the _what_ as opposed to the _how_ and _why._

When I first started learning Git, my _aha_ moment came when I stumbled upon [Git For Computer Scientists](https://eagain.net/articles/git-for-computer-scientists/). This article demonstrated that Git is nothing more than a Directed Acyclic Graph of blobs with a variety of HEAD pointers. Once I knew this, things like `rebase`, `cherry-pick`, `commit`, `log`, and `show` just became pointer operations, and that was something I understood. (ﾉ◕ヮ◕)ﾉ\*:･ﾟ✧

15 years later, while learning Rust, I was looking for something similar. I understand _what_ a borrow/move/copy is and _what_ a lifetime does, but I wanted to understand _why_ it makes sense and _how_ it works.

I recently stumbled upon [Learn Rust With Entirely Too Many Linked Lists](https://rust-unofficial.github.io/too-many-lists/index.html), which helped fill that void. This excellent tutorial shows how to use Rust to design and implement various linked data structures. On its own, that's useful, but the tutorial really dives into explaining _why_ the challenges exist and _how_ tools like the Mid-level Intermediate Representation help address these challenges.

The tutorial is very well-written and takes the reader from simple linked structures using `Box` and `Option` to atomic lists using `Arc` and `Rc`. The tutorial ends with a doubly-linked list written with `unsafe` pointers abstracted behind a production-quality API.

There are six exercises in the tutorial, and I worked through one each day for about a week. [I've pushed my solutions to GitHub](https://github.com/irbull/too-many-lists-soln). They are slightly different from those offered in the tutorial because I often tried a few extra extensions and sometimes implemented the "wrong" or "harder" solution to see how it compares.

I also found a small bug in the official tutorial too. The bug was in the final production-quality doubly-linked list. The bug occurs when you try to take a slice of everything before the first node. The resulting slice had the correct length of zero but some of pointers were not updated correctly.[ I've submitted a Pull Request with a fix](https://github.com/rust-unofficial/too-many-lists/pull/301).
