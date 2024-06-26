---
author: Ian Bull
pubDatetime: 2024-06-26
title: Rust FFI Builds With Rayon
postSlug: rust-rayon-builds
ogImage: /assets/og_images/rusty_r_cog.png
featured: false
tags:
  - rust
  - technology
description: In this post I describe how I reduced our Llama.rs build times from 1.5h to 16min using Rayon.
---

Those of you who have read my blog recently know that I've been working on [Rust and TypeScript bindings for Large Language Models (LLMs)](/blog/2024/llamas-and-dinosaurs/llamas-and-dinosaurs). For those following the LLM space, you'll also be aware that this domain is moving at breakneck speed. Keeping libraries up to date is a full-time job, and it seems that each week everyone changes their technology stack.

When I started working with [Llama.cpp](https://github.com/ggerganov/llama.cpp), there was a single `cuda` file. The build system was relatively easy, and my custom `build.rs` simply used the `nvcc` compiler to build this file and link it with the few other `.cpp` files in the project. In March 2024, the project was refactored into about 20 `cuda` files. Instead of building a single file, I needed to iterate over all 20 files, build them, and add those 20 object files to the linker.

In May, the project underwent another refactoring, and each quantized format was split into its own `cuda` file. There are now 120 `cuda` files in the repository, some taking close to 5 minutes to compile. The entire compile step now takes 1.5 hours. (╯°□°)╯︵ ┻━┻

I couldn't leave it like this, especially since our build timeout is set to an hour. Here is a short description of how I improved our build speeds by more than five times (16 minutes vs. 1.5 hours).

## The build.rs File

Most Rustaceans will not need to worry about a `build.rs` file. The `build.rs` (also known as the "Build Script") is an advanced feature used if you need to:

1. Build a C library as part of your crate.
2. Find and link to a C library as part of your build.
3. Dynamically generate a Rust module (possibly using Bindgen).
4. Perform platform-specific configurations during the build.

A very simple `build.rs` would rebuild `src/hello.c` if the file changed, using the default C compiler (MSVC for Windows, `gcc` for MinGW, `cc` for Unix, etc.):

```rust
fn main() {
    // Tell Cargo that if the given file changes, to rerun this build script.
    println!("cargo:rerun-if-changed=src/hello.c");
    // Use the `cc` crate to build a C file and statically link it.
    cc::Build::new()
        .file("src/hello.c")
        .compile("hello");
}
```

The Build Script allows you to customize the compiler, compiler flags, linker options, and more.

As the file extension implies, `build.rs` is a Rust program allowing you to customize your build using Rust and Rust dependencies.

## Rust FFI

The Rust Foreign Function Interface (FFI) is a way to call C libraries from Rust. We used the Rust FFI to interface with `Llama.cpp` and provide a method to use performant Large Language Models (LLMs) directly in Rust. `Llama.cpp` is optimized to work on a variety of different hardware platforms, including Mac Metal and CUDA devices.

To ship a Rust-based LLM API based on `Llama.cpp`, we:

1. Used Bindgen to generate a set of Rust bindings for `Llama.cpp`.
2. Used a `build.rs` script to compile the native libraries for `Llama.cpp`.
3. Built a library crate to ship an idiomatic Rust library for an LLM API.

## NVCC Compiler

The `build.rs` finds all the `cuda` files and then iterates over them, calling the `nvcc` compiler for each one.

```rust
let cuda_files = collect_cuda_files(&cuda_src_dir);
cuda_files
    .iter()
    .for_each(|cuda_file| compile_nvcc(&cuda_file));
```

```rust
fn fn compile_nvcc(cuda_file: &str) {
  let cuda_o_file = object_file(&cuda_file);
  let mut nvcc = cc::Build::new();
  ... set a few other platform specific flags
  nvcc.compiler("nvcc")
      .flag("-Illama.cpp/")
      .file(cuda_file)
      .flag("-Wno-pedantic")
      .compile(cuda_o_file);
}
```

This strategy worked well when there was a single file, and it wasn't too bad when there were less than 20, but with over 120 `cuda` files, we needed to do better.

## Parallel Builds

Utilizing more cores during the build and building multiple `cuda` files in parallel seemed like an easy win, and with Rust it's pretty straightforward. My first attempt was to wrap the `cuda_files` in a Mutex and access the queue on each thread:

```rust
let cuda_files = Arc::new(Mutex::new(cuda_files));
```

I then created `n` threads. Within each thread, I would simply take a file from the vector:

```rust
fn take<T>(cuda_files: &Mutex<Vec<T>>) -> Option<T> {
    let mut files = cuda_files.lock().unwrap();
    files.pop()
}
```

and compile it:

```rust
handles.push(thread::spawn(move || loop {
    let cuda_file = take(&cuda_files);
    if let Some(cuda_file) = cuda_file {
        compile_nvcc(&cuda_file);
    } else {
        break;
    }
}
```

I then joined all the threads and continued the linking step once all the `cuda` files had been built.

This was a bit of boilerplate. Although I was pretty confident that there were no data race issues, it left me with a burning question: _How many threads should I create?_ While discussing the problem with a co-worker, he suggested we use [Rayon](https://crates.io/crates/rayon), a data-parallelism library for Rust. Not only is this solution much easier, but it also _automagically_ optimizes the number of threads for us.

## Rayon

Rayon's goal is to make it easy to add parallelism to sequential code, and the Rayon API is guaranteed not to introduce _data races_. Unlike many other parallelization libraries, Rayon dynamically decides whether or not to use parallel threads based on the availability of idle cores (like everything in computers, there is no _magic_). Rayon refers to this as _potential parallelism_, which is implemented using _work-stealing_. Rayon maintains a queue of work, and each call to `join` takes two tasks. One task is pushed onto the queue of work, and the other task starts immediately. If other cores are available, they will take work from the queue (steal it), and if not, the call to `join` will perform the second task itself.

Rayon encapsulates this entire concept into a `parallel iterator`. The `parallel iterator` divides the work into "shared state" and "per-thread state," using _work-stealing_ technique to potentially process a list of items in parallel.

In the case of compiling `cuda` files, we already have a list of files and functions we want to execute on each one. To utilize Rayon in our `build.rs`, we simply need to change:

```rust
cuda_files
    .iter()
    .for_each(|cuda_file| compile_nvcc(&cuda_file));
```

to:

```rust
cuda_files
    .par_iter()
    .for_each(|cuda_file| compile_nvcc(&cuda_file));
```

If we use the Rayon trait `use rayon::prelude::*;` and add Rayon to our build-dependencies, we can introduce parallel builds with a 4 character change!

## Conclusion

With the simple yet powerful change to leverage Rayon for parallel builds, we have managed to slash our build times from an untenable 1.5 hours down to a mere 16 minutes. Not only does this allow us to stay within our build timeout limits, but it also significantly improves the developer experience and productivity. By embracing Rust's concurrency ecosystem, we've turned a potentially nightmarish build process into something that feels almost effortless. It's a testament to the robustness of Rust's libraries and the language's capacity for safe, concurrent solutions that can adapt dynamically to the resources at hand—proving once again that sometimes the most effective optimizations are those that work with the grain of powerful abstractions rather than against them.
