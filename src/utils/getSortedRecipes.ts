import type { CollectionEntry } from "astro:content";

const getSortedNotes = (posts: CollectionEntry<"recipes">[]) =>
  posts
    .filter(({ data }) => !data.draft)
    .sort(
      (a, b) =>
        Math.floor(new Date(b.data.pubDatetime ?? 0).getTime() / 1000) -
        Math.floor(new Date(a.data.pubDatetime ?? 0).getTime() / 1000),
    );

export default getSortedNotes;
