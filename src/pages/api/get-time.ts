import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = () => {
  const currentTime = new Date().toISOString();
  return new Response(currentTime);
};
