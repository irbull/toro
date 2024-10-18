import type { CollectionEntry } from "astro:content";

const getDraftPosts = (posts: CollectionEntry<"blog">[]) =>
  posts
    .filter(({ data }) => data.draft)
    .sort(
      (a, b) =>
        Math.floor(new Date(b.data.pubDatetime ?? 0).getTime() / 1000) -
        Math.floor(new Date(a.data.pubDatetime ?? 0).getTime() / 1000),
    );

export default getDraftPosts;
