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

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  redirects,
  output: 'static',
  adapter: deno(),
  image: {
    service: { entrypoint: "astro/assets/services/noop" },
  },
  integrations: [sitemap(), preact()],
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
