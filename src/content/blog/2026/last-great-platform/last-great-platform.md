---
author: "Ian Bull"
pubDatetime: 2026-11-09
title: "Have we Built the Last Great Application Platform?"
postSlug: last-great-platform
featured: false
tags:
 - platforms
 - llm
 - ai
 - history
 - cs452
description: "Have we built the last great application platform?"
---

Tuesday September 11, 2001 [8:30 - 10:00am], I was giving the first lecture for [CS 452 Real-Time Programming](https://student.cs.uwaterloo.ca/~cs452) at the [University of Waterloo](https://uwaterloo.ca/). In this class, students build a functional microkernel and real-time operating system for the x86 (486 actually) and then build a set of applications to run on their OS to control a model train. I was the Teaching Assistant for this course that year. It was the year we moved from the old IR trains to the [Märklin trains](https://www.marklin.com/). I was asked to give the first lecture of the year as the professor was travelling for a conference. I ended up teaching the first several lectures, as all the flights were grounded and [Gord Cormack](https://cs.uwaterloo.ca/contacts/gordon-cormack) had to rent a car and drive back from New Orleans. I learned more about Software Engineering teaching that course than at any other point in my career.

![[106-0626_IMG.jpg]]

CS 452 was also my first introduction to "Application Platforms", an area I would spend the next 25 years working on. Platform engineering requires engineers to separate concerns. You learn how one small mistake in the platform can have cascading effects across the applications and how platform optimizations can rapidly improve upon themselves (the flywheel effect). It requires strong API designs, a solid understanding of "breaking changes" and a software development discipline rarely seen in other applications.

From Apache Tomcat, ASP.NET, Ruby on Rails to Node.js, the 2000s were the founding era for application platforms. Convention vs. Configuration was our Tabs vs. Spaces (vi vs. Emacs). DHH called it Convention _over_ Configuration, which tells you which side he was on, but both had their merit. Configuration spelled things out. Convention saved us from typing it (or looking at it).

After my time at Waterloo, I moved to Victoria and joined the [Computer Human Interaction & Software Engineering Lab (CHISEL)](https://thechiselgroup.org/). It was here that I began working on the next great application platform, the [Eclipse Platform](https://eclipse.org/). Most people know Eclipse as the popular Java IDE from the 2000s, but Eclipse was also an application runtime platform. I was a PMC member of the Eclipse RT Project and co-lead of the Eclipse Provisioning Platform (p2). Applications were centred around OSGi bundles and we provided a provisioning platform, service discovery framework, dependency injection, developer tools and a web server (Jetty).

![[rt-book.png]]

The 2010s saw the rise of application platforms for mobile development. React Native became the dominant cross-platform option. I had the privilege of being part of the [Tabris.js](https://tabris.com/) team and I built a JavaScript runtime for Android based on V8 called [J2V8](https://github.com/eclipsesource/j2v8). I won't claim this was one of the greatest application platforms, but we had a loyal user base and delivered high quality software.

![[tabris-js.png]]

Application platforms have always fascinated me as they all attempt to raise the abstraction. Every platform was an attack on what [Fred Brooks, in "No Silver Bullet", called accidental complexity](https://dl.acm.org/doi/10.1109/MC.1987.1663532). Each platform proposed to make development easier for their users, allowing the user to focus on the business problem and not the platform itself. Great platforms had well structured APIs that were easy to discover. They had a level of consistency that gave the developers confidence and most importantly, they told a story. Every conference talk showed us how we could model our problem as a set of entities and relationships, fill in a few behavioural functions and within the 3-hour tutorial we were all running our own online pet store.

By the late 2010s every major platform had landed on the same ideas (conventions, embedded servers, scaffolding, developer tools and package managers), and the difference turned into ecosystem and taste. This is why [Deno](https://deno.com/) was so refreshing when it first emerged. The Deno team dropped the inherited opinions about how to build an application platform and replaced them with their own. They redefined how dependencies were declared, provided highly opinionated tooling, built security into the box and even provided a hosting environment that matched your local development setup. Over the years, Deno needed to support existing ecosystems, and slowly adopted the conventions others used. This was a necessity, but it brought Deno to the same place as other application platforms.

![[deno.png]]

It was in 2024 that I started to wonder if Deno would be the Last Great Application Platform. I got involved, helped improve error messages in the runtime and standard library, and even maintained the Deno / Astro connector for a while. When Deno 2.0 launched in October 2024, it centred around [simplicity and developer experience](https://www.youtube.com/watch?v=swXWUfufu2w): better tooling, better defaults, security out of the box. Two short years later, the [Deno team is joining Cloudflare, Deno Deploy is shutting down, and Deno-led runtime development is ending](https://deno.com/blog/cloudflare). I don't think Deno got worse, I think simplicity and developer experience stopped being a reason to pick a platform. When an agent writes the code, the friction a great platform removes is friction nobody feels anymore. What's left is infrastructure, and infrastructure is a commodity where the existing players win. It doesn't matter if you're better.

LLMs do like consistency, but not the kind we built our platforms around. Convention vs. Configuration was a human debate. Convention over Configuration is really just recognition over recall, a problem agents don't have. Give it a configuration file that maps routes to business logic and it's just as happy, arguably happier, because nothing is implicit. Neither side of the debate won; the question just stopped mattering. LLMs don't care about the consistency in your Model-View-Controller and they certainly don't care about your story. Great platforms encode elegant solutions to your business problems; but if nobody is reading the code anymore, does anybody care?

Don't get me wrong, we absolutely need places to host our solutions along with runtime isolation, security, data persistence guarantees and governance. The operating system still matters. But when it comes to platforms that are a joy to work with, that allow us to represent business logic as beautifully crafted solutions, have these platforms simply become a commodity and _have we already built the Last Great Application Platform_?
