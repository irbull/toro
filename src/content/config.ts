import { defineCollection } from "astro:content";
import { blogSchema, tilSchema } from "./_schemas";

const blog = defineCollection({
  schema: blogSchema,
});

const til = defineCollection({
  schema: tilSchema,
});

export const collections = { blog, til };
