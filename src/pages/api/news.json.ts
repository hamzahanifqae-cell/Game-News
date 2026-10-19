import type { APIRoute } from 'astro';
import { getNews } from '../../lib/news';
export const prerender = false;
export const GET: APIRoute = async () => {
  const feed = await getNews();
  return new Response(JSON.stringify(feed), {headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': feed.stale || feed.partial ? 'public, max-age=60' : 'public, max-age=60, s-maxage=900',
    'X-Content-Type-Options': 'nosniff',
  }});
};
