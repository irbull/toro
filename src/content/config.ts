import { defineCollection } from "astro:content";
import { blogSchema, tilSchema, recipeSchema } from "./_schemas";

const blog = defineCollection({
  schema: blogSchema,
});

const til = defineCollection({
  schema: tilSchema,
});

const recipe = defineCollection({
  schema: recipeSchema,
});

export const collections = { blog, til, recipe };
