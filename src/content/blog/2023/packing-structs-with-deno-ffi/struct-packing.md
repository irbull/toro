---
author: Ian Bull
pubDatetime: 2023-12-19
title: Packing Structs with Deno FFI
postSlug: deno-ffi-struct-packing
ogImage: /assets/og_images/matrix_code.png
featured: false
tags:
  - deno
  - ffi
  - technology
description: "In the post, I discuss the technical journey and challenges of integrating large language model inference into Typescript using Deno's FFI, particularly when interfacing complex data structures between Rust and Deno, and share some code snippets and resources that helped navigate these complexities."
---

Recently, I've been working on a project that integrates large language model (LLM) inference with Deno. This project extensively utilizes Deno's Foreign Function Interface (FFI) since the inference is conducted in C++ and Rust. The project is intended to bring the power of LLMs to Typescript.

One of the challenges I encountered was managing the interface for complex data structures between Rust and Deno. The project features an API that returns a structure like this:

```rust
#[repr(C)]
pub struct Prediction {
    pub token: *const std::os::raw::c_char,
    pub eos: bool,
}
```

This structure is result of the function `predict_token`, which is utilized to yield the subsequent token in a prediction sequence. The structure comprises the next token and a boolean that signifies whether it marks the **End of Sample**.

```typescript
predict_token: {
  parameters: ["pointer"],
  result: { "struct": ["pointer", "bool"] },
}
```

Deno FFI packs structures like these into a `Uint8Array` and aligns the fields according to their natural alignment. In the case of the structure above, the C String Pointer will use 8 bytes on a 64-bit system, and the boolean will use a single byte.

If you print the result, here is an example of what you might see:

```typescript
Uint8Array(16)[(224, 232, 119, 71, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0)];
```

The first 8 bytes represent a pointer to the string. The 9th bit represents the boolean, and an additional 7 bytes were added to word align the data structure.

To access these fields, you need to create a `DataView` of the array and access bytes from their offset. To access the pointer at position `0` and the boolean at position `8`, you can use the following code:

```typescript
const dv = new DataView(result.buffer);
const c_ptr = Deno.UnsafePointer.create(dv.getBigUint64(0, endianess));
const eos = dv.getInt8(8) === 1;
```

This code will construct a Deno Pointer from the first 8 bytes of the structure. For 32-bit systems, you would need to use `getUint32`. The `endianness` is used to specify whether the system uses [big vs little endian](https://en.wikipedia.org/wiki/Endianness). The [ByteType library uses a really cool trick to determine this](https://github.com/denosaurs/byte_type/blob/main/utils.ts). This code will also fetch the byte at position `8` and compare it with `1`, the value representing `true` in C.

Once you have a pointer to the string, you can create a JavaScript string quite easily:

```typescript
export function ptr2cstr(ptr: Deno.PointerValue): string {
  if (ptr === null) return "";
  if (Deno.UnsafePointer.equals(ptr, null)) return "";
  return new Deno.UnsafePointerView(ptr).getCString();
}
```

If you are doing a lot of struct packing with Deno FFI, check out the [ByteType Project](https://github.com/denosaurs/byte_type), and be sure to read [denonomicon](https://denonomicon.deno.dev/types/structs) as there is a lot of great information about Deno FFI.
