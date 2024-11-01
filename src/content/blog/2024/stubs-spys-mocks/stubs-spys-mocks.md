---
author: Ian Bull
pubDatetime: 2024-11-01
title: Stubs, Spies, Mocks, Oh My!
postSlug: stubs-spies-mocks
featured: false
tags:
 - Technology
description: "In this article, I explore the differences between stubs, mocks, and spies in testing frameworks, highlighting their unique roles in ensuring effective code verification."
---

Earlier today there was a short conversation in one of my Discord channels about how _stubs_ are used in testing frameworks. You’ll often hear about _stubs_, _mocks_, and _spies_—each serving a unique role in your tests. Here's a quick breakdown:

### Stubs

Stubs are simple. They provide fixed, predetermined responses to method calls, ensuring your code has a controlled, predictable environment to run in. They don’t care about how they’re used, just that they respond correctly. Great for isolating a unit under test!

### Mocks

Mocks are more demanding. They let you set _expectations_ on how your code interacts with them, and they’ll fail the test if those expectations aren’t met. If you want to verify that methods are called with specific arguments or in a specific order, mocks have your back. Think behavior verification!

### Spies

Spies are like the secret agents of test doubles. They _observe_ and record how your methods are used, without requiring strict expectations upfront. Want to let a method run but still verify interactions afterward? Spies let you do just that. They're perfect for keeping an eye on things while staying flexible in your test code.

### TL;DR

- **Stubs**: Provide canned responses; don’t track how they’re used.
- **Mocks**: Set expectations and verify interactions; strict and behavior-focused.
- **Spies**: Record interactions for later verification; flexible and observant.

Use the right one based on whether you’re testing state, behavior, or just want to keep an eye on things. Happy testing!
