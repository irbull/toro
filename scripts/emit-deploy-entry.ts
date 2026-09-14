// Emit dist/entry.mjs — a thin shim that statically imports the jsr
// modules the @deno/astro-adapter `start()` later loads via
// `await import(VAR)`. Deno Deploy's isolate runtime only pre-fetches
// statically-analyzable imports, so without this shim the dynamic
// imports fail with "Module not found" at startup.
//
// Versions mirror the constants in @deno/astro-adapter/src/index.ts.
// Bump them when the adapter does.

const SHIM = `\
import "jsr:@std/http@^1.1.1/file-server";
import "jsr:@std/path@^1.1.5";
import "./server/entry.mjs";
`;

await Deno.writeTextFile("dist/entry.mjs", SHIM);
console.log("Wrote dist/entry.mjs (Deno Deploy jsr pre-fetch shim)");

// Patch the adapter's static-file path join. Astro >= 7.3 keeps the
// leading slash in `app.removeBase()` ("/about", not "about"), so the
// adapter's `"./" + pathname` join yields "client//about". Exact-file
// requests still resolve (the OS collapses "//"), but the prerendered
// fallback compares pathname strings, so every clean URL 404s. Strip
// the slash before joining. Drop this once @deno/astro-adapter > 0.6.0
// handles the leading slash itself.
const ENTRY = "dist/server/entry.mjs";
const BROKEN = `new URL("./" + app.removeBase(url.pathname), clientRoot)`;
const FIXED = `new URL("./" + app.removeBase(url.pathname).replace(/^\\/+/, ""), clientRoot)`;

const entry = await Deno.readTextFile(ENTRY);
if (entry.includes(FIXED)) {
  console.log(`${ENTRY} already patched for removeBase leading slash`);
} else if (entry.includes(BROKEN)) {
  await Deno.writeTextFile(ENTRY, entry.replace(BROKEN, FIXED));
  console.log(`Patched removeBase leading slash in ${ENTRY}`);
} else {
  throw new Error(
    `${ENTRY} does not contain the expected removeBase call — ` +
      "check whether @deno/astro-adapter fixed the leading-slash join " +
      "and drop this patch",
  );
}
