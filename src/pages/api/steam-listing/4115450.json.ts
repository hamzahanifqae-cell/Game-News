import type { APIRoute } from 'astro';
import { getSteamWatch } from '../../../lib/steam-listing';

export const prerender = false;

export const GET: APIRoute = async () => {
  const watch = await getSteamWatch(4115450);
  if (!watch) return new Response(JSON.stringify({ error: 'Unknown listing' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' } });
  const stale = watch.listingStale || watch.postsStale;
  return new Response(JSON.stringify(watch), { headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': stale ? 'public, max-age=60' : 'public, max-age=60, s-maxage=900',
    'X-Content-Type-Options': 'nosniff',
  } });
};
