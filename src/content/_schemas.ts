import { z } from "astro:content";

export const blogSchema = z
  .object({
    author: z.string().optional(),
    pubDatetime: z.date().optional(),
    title: z.string(),
    postSlug: z.string().optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default(["others"]),
    ogImage: z.string().nullable().optional(),
    description: z.string(),
    icon: z.string().optional(),
    project: z.boolean().optional(),
  })
  .strict();

export const tilSchema = z
  .object({
    pubDatetime: z.date().optional(),
    title: z.string(),
    postSlug: z.string().optional(),
    tags: z.array(z.string()).default(["others"]),
    description: z.string(),
    draft: z.boolean().optional(),
  })
  .strict();

export const recipeSchema = z
  .object({
    author: z.string().optional(),
    pubDatetime: z.date().optional(),
    title: z.string(),
    postSlug: z.string().optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default(["others"]),
    ogImage: z.string().nullable().optional(),
    description: z.string(),
    icon: z.string().optional(),
    project: z.boolean().optional(),
  })
  .strict();

export type BlogFrontmatter = z.infer<typeof blogSchema>;
export type TilFrontmatter = z.infer<typeof tilSchema>;
export type RecipeFrontmatter = z.infer<typeof recipeSchema>;
