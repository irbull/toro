import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import getSortedPosts from "../utils/getSortedPosts.ts";
import slugify from "../utils/slugify.ts";
import { SITE } from "../config.ts";

export async function get() {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: sortedPosts
      .filter(({ data }) => data.pubDatetime)
      .map(({ data }) => ({
        link: `posts/${slugify(data)}`,
        title: data.title,
        description: data.description,
        pubDate: new Date(data.pubDatetime!),
      })),
  });
}
