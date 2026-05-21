import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { blogSchema, tilSchema, recipeSchema } from "./content/_schemas";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: blogSchema,
});

const til = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/til" }),
  schema: tilSchema,
});

const recipes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/recipes" }),
  schema: recipeSchema,
});

export const collections = { blog, til, recipes };
