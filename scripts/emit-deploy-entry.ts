// Emit dist/entry.mjs — a thin shim that statically imports the jsr
// modules the @deno/astro-adapter `start()` later loads via
// `await import(VAR)`. Deno Deploy's isolate runtime only pre-fetches
// statically-analyzable imports, so without this shim the dynamic
// imports fail with "Module not found" at startup.
//
// Versions mirror the constants in @deno/astro-adapter/src/index.ts.
// Bump them when the adapter does.

const SHIM = `\
import "jsr:@std/http@^1.1.0/file-server";
import "jsr:@std/path@^1.1.4";
import "./server/entry.mjs";
`;

await Deno.writeTextFile("dist/entry.mjs", SHIM);
console.log("Wrote dist/entry.mjs (Deno Deploy jsr pre-fetch shim)");
