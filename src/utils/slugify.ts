import { slug as slugger } from "github-slugger";
import type { BlogFrontmatter, TilFrontmatter } from "../content/_schemas.ts";

export const slugifyStr = (str: string) => slugger(str);

const slugify = (post: BlogFrontmatter | TilFrontmatter) =>
  post.postSlug ? slugger(post.postSlug) : slugger(post.title);

export const slugifyAll = (arr: string[]) => arr.map((str) => slugifyStr(str));

export default slugify;
