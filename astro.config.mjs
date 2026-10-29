// @ts-check
import { defineConfig } from 'astro/config';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

// The Privacy Policy is treated as a draft until a human sets an explicit
// policyReviewDate (see src/pages/privacy.astro) — kept out of the sitemap
// while in that state, matching the page's own noindex/pagefindIndex flags.
// @astrojs/sitemap's filter only receives a URL string, so this reads the
// frontmatter directly rather than going through the content layer.
function isPrivacyPolicyReady() {
  try {
    const path = fileURLToPath(new URL('./src/content/legal/privacy.mdoc', import.meta.url));
    const raw = readFileSync(path, 'utf-8');
    return /^policyReviewDate:\s*\S/m.test(raw);
  } catch {
    return false;
  }
}
const privacyPolicyReady = isPrivacyPolicyReady();

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const fileEnv = loadEnv(process.env.NODE_ENV ?? '', projectRoot, '');
const siteUrl = process.env.PUBLIC_SITE_URL || fileEnv.PUBLIC_SITE_URL;
const isPlaceholderUrl = !siteUrl || /example\.com|your-domain/.test(siteUrl);
const isBuildCommand = process.argv.includes('build');

// A real production domain is required to build — canonical URLs, the
// sitemap, robots.txt, and social tags all depend on it, and shipping
// `example.com` to production is a confirmed launch bug. Development
// doesn't need this: `astro dev` never hits this branch.
if (isBuildCommand && isPlaceholderUrl) {
  throw new Error(
    'PUBLIC_SITE_URL is not set to a real domain. Set it in your environment (or .env.production) before ' +
      'building for production — see .env.example. `npm run dev` does not require this.'
  );
}

// https://astro.build/config
export default defineConfig({
  site: isPlaceholderUrl ? 'http://localhost:4321' : siteUrl,

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/keystatic') &&
        !page.includes('/search') &&
        !page.includes('/in-progress') &&
        (privacyPolicyReady || !page.includes('/privacy')),
    }),
    react(),
    markdoc(),
    keystatic(),
  ],

  adapter: node({ mode: 'standalone' }),
});
