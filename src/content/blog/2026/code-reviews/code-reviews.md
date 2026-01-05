---
author: "Ian Bull"
pubDatetime: 2026-01-03
title: "In 2026, Code Reviews Are the Wrong Abstraction"
postSlug: change-reviews
featured: false
tags:
 - software engineering
description: "Code reviews made sense when code was scarce; in 2026, the real bottleneck is judgment, not syntax."
---
# In 2026, Code Reviews Are the Wrong Abstraction

For a long time, [code reviews have been one of the most important quality mechanisms in software engineering](https://eclipsesource.com/blogs/2015/11/09/run-your-project-like-its-an-opensource-project/).

They’ve caught bugs, prevented security issues, aligned teams on conventions, and stopped bad changes from quietly entering production. This is not a post arguing that quality doesn’t matter, or that reviews were a mistake.

It _is_ a post arguing that in 2026, **reviewing code is no longer the same thing as reviewing change**, and treating them as the same abstraction is starting to hurt us.

---

## What Changed

In 2025, [like many others](https://www.youtube.com/watch?v=Ge8LoXfJJdA), I essentially stopped writing code.

That doesn’t mean I stopped building software. It means the act of _typing_ code stopped being the bottleneck. AI coding agents can produce large, coherent diffs in minutes. Sometimes they’re elegant. Sometimes they’re messy. Often they’re both.

The important shift is simple:

**Code is no longer scarce. Judgment still is.**

When code was expensive to produce, reviewing the implementation was a reasonable proxy for reviewing the decision. In an AI-assisted world, that proxy breaks down. A clean diff can still be the wrong change.

---

## The Limits of Traditional Code Reviews

Traditional code reviews are very good at local concerns: catching obvious correctness issues, enforcing consistency, improving readability, and teaching less experienced engineers.

They are much worse at system-level questions: whether a change moves the system in the right direction, whether it introduces slow architectural drift, or how it behaves operationally over time. As the volume of generated code increases, this gap becomes impossible to ignore.

This is where many teams feel the pain. Reviews become a bottleneck, not because they’re preventing disasters, but because they’re spending human attention on _implementation details_ instead of _decisions_.

---

## Code Review vs. Change Review

The core problem is that we’ve been using **code review** as a stand-in for something broader.

Code reviews tend to ask questions like:

- Is this readable?
- Is it idiomatic?
- Is this the cleanest way to write it?

Change reviews ask different questions:

- What behaviour actually changed?
- Who or what is affected?
- What are the failure modes?
- How will we observe this in production?
- Can we undo it safely?

Code reviews focus on _how_.  
Change reviews focus on _whether_.

In 2026, the second question matters more.

---

## When You _Don’t_ Need a Human Review

When we are reviewing AI-generated code, the most common question becomes: **when is it actually okay to ship without another review?**

When people talk about skipping a code review, they usually reach for “this is small” as justification. A better way to think about it is ownership, not triviality.

A second (human) review isn’t required when the author can fully own the change: the intent is narrow and explicit, the outcome is directly observable, the blast radius is well understood, and the change is easy to undo. This isn’t about domain or importance, _it’s about responsibility and reversibility_.

A simple litmus test helps:

**If I ship this and it’s wrong:**  
- Will I notice quickly?  
- Can I undo it myself?  
- Can I explain exactly what changed and why?  
- Can I keep this change local, or does it require shared awareness and coordination?

If the answer to all four is “yes,” a second review is usually unnecessary.

Reviews are often less about finding bugs and more about aligning understanding across people who share responsibility for a system. The moment a change requires shared understanding to be safe, it deserves a thorough review.

Reviews shouldn’t be a tax on progress; they should be insurance against decisions you can’t easily undo.

---

## Where Code Reviews Still Matter

This isn’t an argument for removing scrutiny. It’s an argument for **aiming it properly**.

There are still categories where implementation details _are_ the risk: security boundaries, billing logic, concurrency, public APIs, database migrations, and performance-critical paths. In these cases, deep code review is absolutely justified.

The mistake is applying the same level of scrutiny to every change, regardless of risk.

---

## What We Should Stop Debating

Many review comments today focus on aesthetics rather than impact: ternaries versus `if/else`, early returns, streams versus loops, or “cleaner” refactors that don’t change behavior.

These debates made sense when code was handcrafted and scarce. In an AI-driven workflow, they’re mostly noise: unless they affect correctness, clarity of meaning, or operational risk.

**Taste is not strategy.**

If style matters, enforce it with tools. Save human judgment for decisions that actually matter.

---

## What a Change Review Looks Like

A change review doesn’t need to be heavy or bureaucratic. It needs to be explicit.

At a minimum, it should answer:

- What problem are we solving, and why now?
- What behavior changed, and who is affected?
- What could go wrong?
- How do we roll it back?
- How will we know it’s working?

If you can’t explain the change, you’re not done, even if the code compiles.

---

## Where AI Agents Fit

AI agents can write the code. They cannot own the change.

The accountable author is the human who requested the change, validated its behavior, and decided it should ship. That person owns the intent, the verification, and the outcome.

In this model, AI-generated code doesn’t automatically require a second reviewer. High-risk changes still do. The review focuses on _what the system is becoming_, not how pretty the diff looks.

---

## A Better Review Model

Instead of treating all changes equally, review intensity should track risk:

- Low risk: automated checks and author responsibility
- Normal changes: asynchronous change review
- High risk: explicit second reviewer and deeper scrutiny
- Architectural shifts: design discussion before code

An **asynchronous change review** is a review of intent and impact that is _not a gate for progress_. The review can begin when the work starts, not when the code is finished. The change is merged when it’s ready, not when someone else is available.

Reviewers may look before or after merge. Their role is to surface missed implications or coordination issues, _not to grant permission_. If a real problem is found, the change is adjusted or rolled back. That’s not a failure of the process; it’s how the process is meant to work.

This isn’t about moving faster at all costs. It’s about slowing down _where it matters_ and getting out of the way everywhere else.

---

## Closing

Code reviews were a great abstraction when code was scarce.

In 2026, code is abundant. The real bottleneck is judgment: deciding what to build, how systems evolve, and which risks we’re willing to take.

That’s why we need fewer arguments about syntax and better conversations about intent, impact, and direction.

Less code review.  
More change review.