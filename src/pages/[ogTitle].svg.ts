import { getCollection } from "astro:content";
import generateOgImage from "../utils/generateOgImage.tsx";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  return new Response(await generateOgImage(params.ogTitle));
};

const postImportResult = await getCollection("blog", ({ data }) => !data.draft);
const notesImportResult = await getCollection("til");
const recipesImportResult = await getCollection("recipes");

const posts = Object.values(postImportResult);
const notes = Object.values(notesImportResult);
const recipes = Object.values(recipesImportResult);

const pages = [...posts, ...notes, ...recipes];

export function getStaticPaths() {
  return pages.map(({ data }) => ({
    params: { ogTitle: data.title || "ianbull . com" },
  }));
}
