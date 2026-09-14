import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";
import { promises as fs } from "fs";
import matter from "gray-matter";
import path from "path";
import deno from "@deno/astro-adapter";

import preact from "@astrojs/preact";

// Deno Deploy needs all npm deps bundled inline (no bare specifiers). That
// bundling must NOT happen in dev, where it forces CommonJS deps like `cookie`
// through Vite's ESM module runner and crashes with "exports is not defined".
const isBuild = process.argv.includes("build");

function trimMdExtension(str) {
  if (typeof str !== "string") {
    return "Error: Input must be a string";
  } else if (str.endsWith(".md")) {
    return str.substring(0, str.length - 3);
  } else {
    return str;
  }
}

function parseMarkdownFrontMatter(markdownString) {
  try {
    // Parse the markdown string
    const result = matter(markdownString);

    // Return the frontmatter data as a JavaScript object
    return result.data;
  } catch (error) {
    // Handle/throw error
    console.error("Error parsing markdown string: ", error);
    throw new Error("Error parsing markdown string");
  }
}

async function readMarkdownFiles(dir) {
  let files = await fs.readdir(dir);
  let redirects = {};

  for (let file of files) {
    let filePath = path.join(dir, file);
    let stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      redirects = { ...redirects, ...(await readMarkdownFiles(filePath)) };
    } else if (stats.isFile() && path.extname(filePath) === ".md") {
      let frontMatter = parseMarkdownFrontMatter(
        await fs.readFile(filePath, "utf-8")
      );
      if (frontMatter.postSlug) {
        redirects[
          trimMdExtension(filePath.replace("src/content", ""))
        ] = `/posts/${frontMatter.postSlug}`;
      }
    }
  }
  return redirects;
}

const redirects = await readMarkdownFiles("./src/content/blog/");

// Deno Deploy fixes, applied from a build hook so they run wherever
// `astro build` runs — the Deploy builder invokes astro directly and does
// not run scripts/emit-deploy-entry.ts.
//
// 1. Emit dist/entry.mjs, a shim that statically imports the jsr modules
//    the @deno/astro-adapter `start()` loads via `await import(VAR)`, so
//    Deploy's isolate pre-fetches them. Versions mirror the constants in
//    @deno/astro-adapter/src/index.ts; bump them when the adapter does.
// 2. Patch the adapter's static-file path join. Astro >= 7.3 keeps the
//    leading slash in `app.removeBase()` ("/about", not "about"), so the
//    adapter's `"./" + pathname` join yields "client//about". Exact-file
//    requests still resolve (the OS collapses "//"), but the prerendered
//    fallback compares pathname strings, so every clean URL 404s. Drop
//    this once @deno/astro-adapter > 0.6.0 handles the slash itself.
function denoDeployFixes() {
  const SHIM = `\
import "jsr:@std/http@^1.1.1/file-server";
import "jsr:@std/path@^1.1.5";
import "./server/entry.mjs";
`;
  const ENTRY = new URL("./dist/server/entry.mjs", import.meta.url);
  const BROKEN = `new URL("./" + app.removeBase(url.pathname), clientRoot)`;
  const FIXED = `new URL("./" + app.removeBase(url.pathname).replace(/^\\/+/, ""), clientRoot)`;

  return {
    name: "deno-deploy-fixes",
    hooks: {
      "astro:build:done": async ({ logger }) => {
        await fs.writeFile(new URL("./dist/entry.mjs", import.meta.url), SHIM);
        logger.info("Wrote dist/entry.mjs (Deno Deploy jsr pre-fetch shim)");

        const entry = await fs.readFile(ENTRY, "utf-8");
        if (entry.includes(FIXED)) {
          logger.info("dist/server/entry.mjs already patched for removeBase leading slash");
        } else if (entry.includes(BROKEN)) {
          await fs.writeFile(ENTRY, entry.replace(BROKEN, FIXED));
          logger.info("Patched removeBase leading slash in dist/server/entry.mjs");
        } else {
          throw new Error(
            "dist/server/entry.mjs does not contain the expected removeBase call — " +
              "check whether @deno/astro-adapter fixed the leading-slash join " +
              "and drop this patch"
          );
        }
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  redirects,
  output: 'static',
  adapter: deno(),
  image: {
    service: { entrypoint: "astro/assets/services/noop" },
  },
  integrations: [sitemap(), preact(), denoDeployFixes()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [
          remarkCollapse,
          {
            test: "Table of contents",
          },
        ],
      ],
    }),
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
  vite: {
    ssr: {
      external: ["@resvg/resvg-js", "sharp"],
    },
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
});
