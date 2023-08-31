---
author: Ian Bull
pubDatetime: 2023-08-30
title: Updating Astro
postSlug: updating-astro
ogImage:
featured: false
tags: [astro, npm]
description: Information on how to update NPM Packages and Astro in particular
---

This is a short post that documents how I update my Astro Blog. [Astro 3.0 was announced](https://astro.build/blog/astro-3/) today and I'm going to document the steps I used to update the site.

## Check That Everything is Committed

```bash
$ git status
On branch main
nothing to commit, working tree clean
```

## Double Check That the Site Builds & Loads

Before starting any migration, it's a good idea to check that things are in a working state.

```bash
$ npm run build
...

$ npm run dev
11:03:35 AM [check] Checking files in watch mode
  🚀  astro  v2.9.0 started in 61ms

  ┃ Local    http://localhost:3000/
  ┃ Network  use --host to expose

11:03:35 AM [content] Watching src/content/ for changes
11:03:35 AM [content] Types generated
11:03:35 AM [astro] update /.astro/types.d.ts
11:03:35 AM [astro] update /.astro/types.d.ts (x2)
✔  Getting diagnostics for Astro files in /Users/irbull/git/toro/…
11:03:37 AM [diagnostics] Result (26 files):
- 0 errors
- 0 warnings
- 0 hints
```

## Read the Upgrade Guid

Astro provides a detailed migration guide, and I suggest reading it over before you begin. In my case there were a few things that I needed to take care of.

1. I was using the experimental assets. These are no longer experimental and the flag needed to be removed from my `astro.config.mjs` file.
2. I was using the `@astrojs/image` dependency in my `package.json`. I had to remove this.

I was then able to upgrade to the latest Astro version. I also updated the React & Tailwind versions:

```bash
$ npm install astro@latest
$ npm install @astrojs/react@latest @astrojs/tailwind@latest
```

```bash
 npm install @astrojs/check typescript
```

## Use `npm-check-updates` to Update the Other Dependencies

I decided to update all the other dependencies in the site at this time. I used `npm-check-update` to do this. This tool should not be used on a big project, but my site is pretty small.

```bash
$ npm install -g npm-check-updates
```

Use `ncu` to update all packages and then install them.

```bash
$ ncu --upgrade
$ npm install
```

## Test the Site

Use `npm run build` and `npm run dev` to start the development site and smoke test that things are working as expected. There were a few problems with the layout. This was mostly due to problems in my Tailwind styles. With the upgrade to `@astrojs/tailwind@5.0` some existing styles were broken. Looking at the docs, it seems I was accidentally exploiting a few bugs, which have since been fixed.

## Install the Astro Typescript Checker

[Astro Check]() requires an extra dependency if you are using Typescript. Since I am, I installed `@astrojs/check typescript`:

```bash
 $ npm install @astrojs/check typescript
```

Turns out I had a few typescript errors on my site which the tool detected.
