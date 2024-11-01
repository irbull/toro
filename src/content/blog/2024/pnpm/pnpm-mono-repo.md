---
author: Ian Bull
pubDatetime: 2024-10-31
title: Mono Repos with pnpm
postSlug: pnpm-mono-repo 
featured: false
tags:
 - npm
 - pnpm
 - technology
description: "Today I learned that pnpm is generally a better choice than npm for managing dependencies in a monorepo due to its efficient local linking, automatic version management, and enhanced support for monorepo setups."
---

If you're working in a **monorepo** and need one project to reference another project, **pnpm** is generally the better choice than **npm** for several reasons:

### 1. **Efficient Local Linking**

- **pnpm** provides a more efficient and robust way of handling dependencies within a monorepo. When one project in your monorepo needs to reference another project, pnpm uses **symbolic links** to ensure that changes to the referenced project are reflected immediately.
- This means that if you make a change to a shared library or package within the monorepo, those changes will be instantly available to other projects that reference it. You don’t have to re-install or re-link the packages manually.

### 2. **Automatic Version Management**

- **pnpm** can handle local packages seamlessly using its workspaces feature. If you set up your projects as part of a `pnpm-workspace.yaml` file, pnpm will automatically link the projects for you, making it easy to share code and dependencies.
- Additionally, pnpm's linking system is designed to minimize issues with dependency resolution, which can be a challenge in monorepo setups.

### 3. **Better Monorepo Support**

- **pnpm** was designed with monorepos in mind and provides features that make it easier to manage dependencies between projects. For example:
    - You can run scripts across all projects in your monorepo or target specific projects using filters.
    - The single `node_modules` folder and content-addressable storage system make dependency management more efficient and reduce duplication.
    - Strict dependency resolution helps prevent unexpected issues when referencing other projects.
