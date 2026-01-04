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

For a long time, code reviews have been one of the most important quality mechanisms in software engineering.

They’ve caught bugs, prevented security issues, aligned teams on style and conventions, and *crucially* stopped bad changes from quietly entering production. This is not a post arguing that quality doesn’t matter, or that reviews were a mistake.

It _is_ a post arguing that in 2026, **reviewing code is no longer the same thing as reviewing change**, and treating them as the same abstraction is starting to hurt us.

---

## What Changed

In 2025, I, [like many others](https://www.youtube.com/watch?v=Ge8LoXfJJdA), essentially stopped writing code.

That doesn’t mean I stopped building software. It means the act of _typing_ code stopped being the bottleneck. AI coding agents can produce large, coherent diffs in minutes. Sometimes they’re elegant. Sometimes they’re messy. Often they’re both.

The important shift is this:

**Code is no longer scarce. Judgment still is.**

When code was expensive to produce, reviewing the implementation was a reasonable proxy for reviewing the decision. In an AI-assisted world, that proxy breaks down.

A clean diff can still be the wrong change.

---

## The Limits of Traditional Code Reviews

Traditional code reviews are very good at certain things:

- Catching obvious correctness issues
    
- Enforcing conventions and consistency
    
- Teaching less experienced engineers
    
- Improving local readability and structure
    

They are much worse at:

- Evaluating whether the change moves the system in the right direction
    
- Catching slow, cumulative architectural drift
    
- Reasoning about system-level impact
    
- Scaling when the volume of generated code explodes
    

This is where many teams feel the pain. Reviews become a bottleneck, not because they’re preventing disasters, but because they’re spending human attention on _implementation details_ instead of _decisions_.

---

## Code Review vs. Change Review

The core problem is that we’ve been using **code review** as a stand-in for something broader.

Here’s the distinction.

**Code Review asks:**

- Is this readable?
    
- Is this idiomatic?
    
- Could this be simpler?
    
- Is this the “clean” way to write it?
    

**Change Review asks:**

- What behaviour changed?
    
- Who or what is affected?
    
- What data is touched?
    
- What are the failure modes?
    
- How will we observe it?
    
- Can we roll it back?
    

Code reviews focus on _how_.  
Change reviews focus on _whether_.

In 2026, the second question matters more.

---

## When You _Don’t_ Need a Human Review

When humans are reviewing AI generated code, the most common question is:  **when is it actually okay to ship without a second human review?**

A useful way to think about this is ownership, not triviality.

A second human review isn’t required when the author can fully own the change: the intent is narrow and explicit, the outcome is directly observable, the blast radius is well understood, and the change is easy to undo. This isn’t about domain or importance, it’s about responsibility and reversibility. When any of those conditions aren’t met, a human review is still one of the best tools we have.

A simple litmus test helps:

> **If I ship this and it’s wrong:**
> – Will I notice quickly?
> – Can I undo it myself?
> – Can I explain exactly what changed and why?
> – Can I keep this change local, or does it require shared awareness/coordination (contracts, consumers, other teams)?

If the answer to all four is “yes,” a second human review is usually unnecessary. Reviews are often less about finding bugs and more about aligning understanding across people who share responsibility for a system. The moment a change requires shared understanding to be safe, it deserves a human review.

Reviews shouldn’t be a tax on progress; they should be insurance against decisions you can’t easily undo.

---

## Where Code Reviews Still Matter

This isn’t an argument for removing scrutiny. It’s an argument for **aiming it properly**.

There are still categories where implementation details _are_ the risk:

- Security boundaries (auth, permissions, secrets)
    
- Billing and financial logic
    
- Concurrency and distributed systems behavior
    
- Public APIs and long-lived interfaces
    
- Database migrations and irreversible data changes
    
- Performance-critical hot paths
    

In these cases, deep code review is absolutely justified. The mistake is applying the same level of scrutiny to every change, regardless of risk.

---

## What We Should Stop Debating

Many review comments today are about aesthetics rather than impact:

- Ternary vs `if/else`
    
- Early returns vs nested logic
    
- Streams vs loops
    
- “Cleaner” refactors that don’t change behavior
    

These debates made sense when code was handcrafted and scarce. In an AI-driven workflow, they’re mostly noise—unless they affect correctness, clarity of meaning, or operational risk.

**Taste is not strategy.**

If style matters, enforce it with tools. Save human judgment for decisions that actually matter.

---

## What a Change Review Looks Like

A change review doesn’t need to be heavy or bureaucratic. It needs to be explicit.

A minimal structure is often enough:

- **Intent:** What problem are we solving? Why now?
    
- **Impact:** What behavior changed? Who is affected?
    
- **Risk:** What could go wrong?
    
- **Safety:** How do we roll this back?
    
- **Observability:** How will we know it’s working?
    

If you can’t explain the change, you’re not done—even if the code compiles.

---

## Where AI Agents Fit

AI agents can write the code.  They cannot own the change.

The accountable author is the human who requested the change, verified its behavior, and decided it should ship. That person is responsible for the intent, the validation, and the outcome.

In that model:

- AI-generated code doesn’t automatically require a second reviewer
- High-risk changes still do
- The review focuses on _what the system is becoming_, not how pretty the diff looks

---

## A Better Review Model

Instead of treating all changes equally, review intensity should track risk:

- **Low risk:** Automated checks + author responsibility
- **Normal changes:** Asynchronous change review
- **High risk:** Explicit second reviewer and deeper scrutiny
- **Architectural shifts:** Design discussion before code

An **asynchronous change review** is a review of intent and impact that is **not a gate for progress**.

In practice, this means the review can begin **when the work starts**, not when the code is finished. The author opens the change with a clear description of intent, expected impact, and rollback plan, then proceeds with implementation. The change is merged when it’s ready, not when someone else is available.

Reviewers may look at the change **before or after it merges**. Their role is to surface missed implications, coordination issues, or longer-term concerns—not to grant permission. If a real issue is found, the change is adjusted or rolled back. The existence of review after the fact is not a failure of the process; it is a feature of it.

For changes that are quick to implement or easy to undo, it is acceptable—and often preferable—to merge before anyone else has reviewed them, provided the author can fully own the outcome. The expectation is not that nothing will ever need correction, but that the system supports fast detection, fast rollback, and shared learning.

This isn’t about moving faster at all costs. It’s about slowing down _where it matters_ and getting out of the way everywhere else.

---

## Closing

Code reviews were a great abstraction when code was scarce.

In 2026, code is abundant. The real bottleneck is judgment: deciding what to build, how systems evolve, and which risks we’re willing to take.

That’s why we need fewer arguments about syntax and better conversations about intent, impact, and direction.

Less code review.  
More change review.