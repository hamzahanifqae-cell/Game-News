import { loadEnv } from 'vite';

/** Escape JSON-LD so a `</script>` sequence in content cannot break out of the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const fileEnv = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '');

/**
 * Search Console HTML-tag token.
 * A real environment variable wins, then `.env`, then the CMS field.
 * Public pages are prerendered, so the value is read at build time — set it, then rebuild.
 */
export function searchConsoleVerification(cmsValue = ''): string {
  return (process.env.GOOGLE_SITE_VERIFICATION || fileEnv.GOOGLE_SITE_VERIFICATION || cmsValue || '').trim();
}

export function pageUrl(site: URL | undefined, path: string): string | undefined {
  if (!site) return undefined;
  return new URL(path, site).toString();
}
