import type { APIRoute } from 'astro';
import { getSiteSettings } from '../lib/content';

// Populated from Site Settings → "ads.txt lines" in the CMS. Empty until the
// real publisher details are configured there.
export const GET: APIRoute = async () => {
  const settings = await getSiteSettings();
  const body = settings.adsTxtLines ? `${settings.adsTxtLines.trim()}\n` : '';

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
