---
author: "Ian Bull"
pubDatetime: 2026-02-26
title: "Sinks, Not Pipes: Software Architecture in the Age of AI"
postSlug: software-architecture
featured: false
tags:
 - ai
 - software engineering
 - software architecture
description: "Software architecture principles like low coupling, high cohesion, and minimal side effects matter more than ever when AI agents are the ones navigating your codebase."
---

Over twenty years ago, I wrote a master's thesis about navigating software architectures. The central problem was simple: large codebases are hard to understand. New developers joining a project face a daunting ramp-up period. The relationships between modules, the hidden dependencies, the unwritten conventions... all of it lives in the heads of the people who built the system. I built tools using [relational algebra](https://en.wikipedia.org/wiki/Relational_algebra) to query codebases, extract their structure, and help people reason about the architecture without holding the entire thing in their heads.

Two decades later, we're facing the exact same problem, except now the "new developer" joining your codebase every morning is an AI agent. And it has no memory. Every session starts from zero.

This changes everything about how we should think about software architecture.

## The New Starter Who Never Learns

[Matt Pocock](https://www.mattpocock.com/) recently made an argument that resonated deeply with me: AI imposes strange constraints on your codebase, and most codebases aren't ready. The codebase itself, far more than any prompt or configuration file, is the biggest influence on AI's output. If it's designed poorly, the AI can't get feedback fast enough, can't find what it needs, and can't figure out how to test its changes.

His metaphor is apt. When an AI agent enters your codebase, it's like the protagonist of _Memento_. No prior context, no institutional memory, just a fresh pair of eyes and a mandate to do something useful. Unlike a human new starter, who gradually builds a mental model over weeks and months, the AI will never accumulate that understanding. Tomorrow it starts over. Next hour it starts over.

In my thesis work, I studied how software architectures could be queried and navigated using formal methods. I used a tool called [Grok](https://www.swag.uwaterloo.ca/grok/index.html) (no, not _that_ Grok), built on a relational calculus, to extract and reason about the concrete architecture of real systems like PostgreSQL. One of the key insights was the gap between what [Ric Holt](https://plg.uwaterloo.ca/~holt/) called the "shared mental model" of a system (the conceptual architecture that lives in developers' heads) and the actual dependency structure buried in the code. That gap is where confusion lives. It's where new developers get lost.

AI agents live permanently in that gap.

## What My Thesis Got Right (Accidentally)

When I was working on architectural recovery and navigation twenty-five years ago, the motivation was human comprehension. How do you help a developer understand a million-line codebase? How do you answer questions like "which subsystems does this component actually depend on?" or "are there architectural violations where module A reaches into the internals of module B?"

The approach I took was to model codebases as sets of relations (function calls, containment hierarchies, file structures, type references) and then query those relations to recover architectural structure. We could ask: show me every function in subsystem X that calls a function in subsystem Y. Show me the actual dependency graph between high-level components. Show me where the concrete architecture diverges from the conceptual one.

This was useful for humans. But it turns out it's even more useful as a design philosophy for AI. The core principle is the same: **the structure of your system should be discoverable from the outside without requiring you to read every line of code inside**.

If you have to trace through implementation details to understand what a component does, your architecture has failed, whether the reader is a junior developer in 2002 or a language model in 2026.

## Deep Modules and the Return of Old Ideas

Pocock advocates for what [John Ousterhout](https://web.stanford.edu/~ouster/cgi-bin/home.php) calls "deep modules" in [_A Philosophy of Software Design_](https://web.stanford.edu/~ouster/cgi-bin/aposd.php). These are components with simple interfaces hiding substantial implementation complexity. Rather than a web of tiny, shallow modules that all import from each other freely, you organize your codebase into substantial chunks with clear boundaries. The interface sits at the top. The implementation is behind the wall. If the tests pass, you don't need to look inside.

This is not a new idea. This is encapsulation. This is information hiding. This is [Parnas, 1972](https://www.win.tue.nl/~wstomv/edu/2ip30/references/criteria_for_modularization.pdf). This is what every software engineering textbook has been saying for half a century.

But here's why it matters more now: when a human developer works in a messy codebase, they can compensate. They build up context over time. They learn the tribal knowledge. They know that _this_ module secretly depends on _that_ database table being in a particular state, even though nothing in the interface says so.

AI can't compensate. It takes your architecture at face value. And if your architecture is lying, if the interfaces don't tell the truth about what the modules do, if there are hidden couplings and undocumented side effects, then the AI will produce code that looks correct locally but breaks things in ways nobody anticipated.

## Sinks, Not Pipes

This brings me to what I think is the most important architectural principle for the AI era: **build components that are sinks, not pipes**.

A "pipe" is a component that does its work and then triggers something else. It writes to a database, which fires a trigger, which sends a notification, which enqueues a job, which updates another system. To understand what a pipe does, you have to follow the entire chain. You have to crack open every component downstream and trace the cascade of side effects.

A "sink" is a component that receives input, does its work, and stops. Its effects are contained. You can describe what it does without reference to anything else in the system. You can treat it as a black box.

When AI is writing or modifying code, this distinction becomes critical. If your system is built from pipes, where every action triggers a cascade of side effects rippling through the system, then the AI must understand the entire chain to make a safe change. It has to know that modifying the return value of this function will affect the database trigger that will affect the notification service that will affect the job queue. That's an enormous amount of context for any agent to hold, and it's exactly the kind of implicit coupling that makes codebases fragile.

If your components are sinks, the AI can reason about them in isolation. It can read the interface, understand the contract, write or modify the implementation, run the tests, and move on. The blast radius of any change is contained within the module boundary.

## Low Coupling, High Cohesion (But This Time We Mean It)

We've been teaching [low coupling and high cohesion](https://en.wikipedia.org/wiki/Coupling_\(computer_programming\)) since the 1970s. In practice, most codebases have drifted far from this ideal. It's easy to justify a quick cross-module import. It's easy to let a utility function accumulate dependencies. It's easy to let the boundaries blur when you're shipping fast.

But when AI is your primary code author, and increasingly it is, the cost of that drift compounds rapidly. Every hidden dependency is a potential source of hallucinated behavior. Every side effect is a gap in the AI's understanding. Every tightly coupled module is a place where a change in one corner of the system breaks something in another corner, and the AI had no way to predict it.

In my thesis, I used relational queries to identify exactly these kinds of architectural violations in PostgreSQL. We could find places where the actual dependency structure diverged from the intended architecture, where modules that were supposed to be independent had grown hidden connections. Back then, this was useful for maintenance and comprehension. Now, it's essential for AI reliability.

The principle is straightforward: if a module's behavior depends on state or side effects that aren't visible in its interface, your codebase is not AI-ready. If understanding what a function does requires tracing through three other systems, your codebase is not AI-ready. If your tests only verify isolated units but never exercise the actual integration paths, your codebase is not AI-ready.

## Progressive Disclosure of Complexity

One concept from Pocock's talk that maps beautifully onto my earlier research is progressive disclosure of complexity. In a well-designed codebase, the AI (or a human) should be able to understand the system at increasing levels of detail. At the top level, you see a handful of well-named services with clear interfaces. If you need more detail, you look at the types and contracts those services expose. Only if you need to modify the implementation do you look inside.

This is essentially what my thesis tooling did, but through queries rather than file-system conventions. We would start with the high-level subsystem view of PostgreSQL (parser, optimizer, executor, storage) and then drill down into the relational structure of each component. The architecture was navigable because we could move between levels of abstraction without losing context.

For AI agents, this has to be baked into the file system and the code itself. The directory structure should reflect the conceptual architecture. The public interfaces should be obvious and well-typed. The implementation details should be behind clear boundaries. When an AI agent explores your codebase, it should be able to build a working mental model from the outside in, just as my thesis tools allowed human analysts to do two decades ago.

## The Twenty-Five Year Echo

It's a strange feeling to look back at work from twenty-five years ago and realize it's more relevant today than it was then. The problems I was studying (architectural comprehension, dependency management, the gap between intended and actual structure) were real problems in 2002, but they were human-scale problems. Developers could work around them with time, experience, and good communication.

Now those same problems are machine-scale problems. AI agents are hitting the same walls that new developers hit, but they're hitting them hundreds of times a day, with no ability to accumulate wisdom between sessions. The architectural sins that a human team could tolerate (the hidden coupling, the undocumented side effects, the modules that only make sense if you know the history) are fatal to AI-assisted development.

The answer isn't new. It's the same answer it's always been: well-defined module boundaries, clear interfaces, minimal side effects, high cohesion within modules, low coupling between them. The only thing that's changed is the cost of getting it wrong.

If your codebase is a tangled web of shallow modules with implicit dependencies and cascading side effects, then no prompt engineering, no agent framework, and no AI model, however capable, will save you. The architecture is the prompt. The structure of your code is the most important instruction you give to the AI.

And if you get the architecture right (deep modules with honest interfaces, components that are sinks rather than pipes, a file system that reflects your conceptual model) then AI becomes genuinely powerful. Not because the AI is smarter, but because your codebase is finally telling the truth about itself.

That's what good software architecture has always been about. We just have a much better reason to care about it now.
