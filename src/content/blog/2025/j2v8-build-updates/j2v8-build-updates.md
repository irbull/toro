---
author: "Ian Bull"
pubDatetime: 2025-11-12
title: Modernizing J2V8 - Technical Debt, Tooling Upgrades, and Cross-Platform Chaos
postSlug: j2v8-build-updates
featured: false
tags:
 - j2v8
 - android
 - v8
description: "I spent two weeks modernizing J2V8 by updating its V8 engine, migrating the entire build system to current tooling, fixing cross-platform and Android linking issues, and adding full multi-architecture support to ensure compatibility with newer Android devices that now require 16K page sizes."
---

Over the past two weeks I tackled a long-overdue project: bringing [J2V8](https://github.com/eclipsesource/j2v8), a Java/JNI bridge to Google’s V8 JavaScript engine, into 2025. What began as “let me update V8” very quickly turned into an archaeological dig through build tools, Docker images, NDK revisions, Python 2 fossils, cross-compilation hacks, missing symbols, Android bugs, and a decade of platform drift.

One of the main drivers for this work was a new platform reality: **modern Android devices now ship with 16KB memory pages**, and native libraries built for the legacy 4KB page size simply won’t load. J2V8’s existing binaries were fundamentally incompatible with new hardware. Supporting the newer V8, updated NDKs, and modern tooling was the only sustainable path forward.

This post is a summary of that work: what changed, why it was necessary, and what future maintainers might want to know before venturing into the J2V8 build system.

---

# **Why This Needed to Happen**

J2V8 is used in JVM-based environments where developers want a lightweight, embeddable JavaScript engine without spinning up Node.js or Graal. But the project’s build system was showing its age:

- Python 2 scripts (sunset in 2020)
- Gradle 3.5 (2016)
- Android NDK r18 (2018)
- A Debian Jessie build image (2015!)
- Old V8 APIs and brittle cross-compilation logic
- Missing support for Apple Silicon, macOS ARM, and Android arm64-v8a
- And most importantly: **Android’s transition to 16KB page sizes meant older native builds would no longer load**

If you tried running the previous J2V8 binaries on a 2025 Android device?
They simply failed with `dlopen` errors because the ELF sections were built assuming 4K pages.

After years of minor patches, it was time to modernize the stack.

---

# **Key Improvements and Updates**

Below is a breakdown of the major themes and changes, grouped for readability.

---

## **1. Bringing the Build System Into the Modern Era**

### **Python 3 Compatibility**

The entire J2V8 build system relied on Python 2. Over time, this caused failures on any modern system. The full migration required:

- Replacing `file()` → `open()`
- Converting `iteritems()` to `items()`
- Turning implicit relative imports into explicit ones
- Removing custom XML comment hacks (Python 3 handles these natively)
- Eliminating deprecated modules like `commands`

This was foundational to getting anything else to work.

### **Updating Core Tools**

A sweeping set of upgrades:

- Debian base image: **Jessie → Bullseye**
- Java: **Oracle JDK 8 → OpenJDK 17**
- Gradle: **3.5 → 8.x**
- Android SDK: deprecated “SDK tools” → modern “cmdline-tools”
- NDK: **r18 → r26d**

This eliminated dozens of hidden incompatibilities and gave J2V8 a future-proof toolchain.

---

## **2. Modernizing Architecture & Platform Support**

### **macOS aarch64 Support**

Apple Silicon required explicit architecture selection and matching:

- Updating `CMakeLists.txt` to support `arm64`, `x86_64`, and legacy i386 paths
- Fixing ABI mapping logic
- Updating Maven metadata and Java compiler targets (now 1.8)

This was essential to build J2V8 natively on Apple hardware.

### **Android: arm64-v8a and 16K Page Size Compatibility**

This is where the most impactful change happened.

Modern Android devices—especially those shipped with Android 14+—use **16KB memory pages** at the kernel level. Native libraries built for 4KB-page ELF alignment will not load on these devices.

To fix this:

- Upgraded to NDK r26d, which supports building 16KB-aligned ELF sections
- Updated all ABIs and Application.mk settings
- Modernized Gradle and build scripts so the correct ABI filters are applied
- Ensured V8 is built with the correct page-size assumptions

This is the single biggest end-user compatibility improvement in the entire effort.

---

## **3. Cross-Compilation Improvements**

Cross-building V8 is notoriously tricky, especially under Docker on Apple Silicon. Fixes included:

- Installing full Android sysroots (arm, arm64, x86) in the Docker image
- Bypassing `v8gen.py` issues by invoking `gn` directly
- Adding `--platform linux/amd64` for Android builds to avoid inconsistent emulation results
- Improving linker flags and NDK toolchain delegation

These changes made the build _much_ more deterministic across macOS, Linux, and CI.

---

## **4. Fixing Android’s Missing stdio Symbols**

Android’s Bionic libc defines `stdout`, `stderr`, and `stdin` as macros, not symbols, causing the V8 build to fail at link time. To solve this:

- Introduced stub definitions for the standard streams
- Added a passthrough `__fwrite_chk` for fortified builds

This unblocked a class of Android-only link failures and made the V8 build portable again.

---

## **5. Cleaning Up the Linker Hell**

Different platforms require different linker behavior. Fixes included:

- Adding explicit `-lc`, `-llog`, and `-ldl` on Android
- Using `-Wl,--allow-shlib-undefined` for JNI builds that link against V8
- Wrapping Windows-only directives in proper `#ifdef _WIN32` blocks

Linking V8 is always a bit of a dance, this made the choreography less error-prone.

---

## **6. Packaging Improvements & Multi-Architecture AARs**

To simplify distribution:

- Introduced a `j2v8package` step to package multi-ABI AAR files
- Adjusted library cleanup to only remove architecture-specific libs, not everything
- Made `--arch` optional for packaging workflows

This enables building final artifacts without re-compiling all ABIs.

---

## **7. Test Suite + Inspector Updates**

New V8 versions broke several tests and API assumptions. Fixes included:

- Updating SyntaxError assertions for richer V8 messages
- Replacing lambda weak ref callbacks with dedicated methods
- Disabling outdated Inspector tests
- Making the classloader logic more Java-11-friendly

All of this unblocked the test suite on modern JVMs.

---

## **8. New Examples & Documentation**

To make the project more accessible:

- Added a complete Android sample app
- Included README + instructions for setting up J2V8 in a project
- Added a Java example for desktop usage

This reduces the barrier to entry for new developers.

---

# **The Hard Parts**

Almost all the difficulty came from:

### **1. V8’s constantly shifting API + toolchain assumptions**

V8 evolves fast. Projects embedding it… usually don’t.

### **2. Android’s libc macros**

Bionic continues to surprise.

### **3. Cross-compiling under Docker**

Apple Silicon + Android NDK + V8 + Docker = fun.

### **4. Gradle’s API changes across a decade**

Going from Gradle 3 → 8 is like jumping across eras.

### **5. Fixing things without rewriting the entire build system**

Each fix exposed the next layer of tech debt.

But now everything builds on up-to-date stacks, with modern compilers, modern JVMs, and current Android tooling.

---

# **What’s Next?**

Some possible follow-ups:

- Re-enable the V8 Inspector with updated bindings
- Evaluate moving from GN/Ninja → CMake for build uniformity
- Publish new AARs and Maven artifacts
- Document cross-build assumptions more formally
- Add CI builds for macOS arm64 and Android ABIs

For now, though, J2V8 is alive again, with a clean, modern build toolchain.

---

# **Final Thoughts**

This work was deep, unglamorous infrastructure engineering: updating compilers, patching toolchains, fixing missing symbols, modernizing scripts, and making cross-platform builds actually work.

But the result is a **much healthier, future-proof J2V8** that now works cleanly on:

- Modern Android devices (16K pages)
- macOS ARM
- Linux
- Multi-ABI Android builds

If you're integrating Java and JavaScript in performance-sensitive environments, J2V8 remains a powerful tool and now it’s ready for 2025.