---
pubDatetime: 2024-10-24
title: Using Cargo metadata query information about the project
slug: cargo-metadaata
tags:
  - TIL
  - Rust
description: "Today I learned how to extract a package's version from a Rust project using cargo metadata."
---

The `cargo metadata` command returns the metadata for the project in JSON form. Using `jq` you can easily extract the details. The following command extracts the version of a package in the project.

```sh
cargo metadata --format-version 1 | jq '.packages | map(select(.name == <"crate-name">)) | .[0].version'
```
