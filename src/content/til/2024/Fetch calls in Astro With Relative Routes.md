---
pubDatetime: 2024-10-21
title: Fetch Calls in Astro With Relative Routes
slug: fetch-calls-astro-effects
tags:
  - TIL
  - Astro
  - Preact
description: "Today I learned that when writing a fetch call without `useEffect` hooks, it executes during the initial server-side render requiring a fully qualified route, whereas wrapping it in a hook confines the fetch to the client-side, allowing the use of a relative route."
---

In Astro, fetch calls with relative routes may produce an error message. If you write the fetch call without any `useEffect` hooks, then it will also execute for the initial server side render. Fetch on the server needs the fully qualified route, because fetch on the server doesn't know its own base route (e.g. www.mydomain.com). If you wrap fetch in a hook, you are forcing the fetch call only to happen on the client side and you can use a relative route.
