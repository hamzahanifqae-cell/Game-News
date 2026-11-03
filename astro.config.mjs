// @ts-check
import { defineConfig } from 'astro/config';

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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

function publishedArticleTypes() {
  const types = new Set();
  try {
    const dir = fileURLToPath(new URL('./src/content/articles', import.meta.url));
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.mdoc')) continue;
      const raw = readFileSync(join(dir, file), 'utf8');
      const type = raw.match(/^type:\s*"?(review|tutorial|troubleshooting|news)"?/m)?.[1];
      const draft = /^draft:\s*true/m.test(raw);
      const sample = /^sample:\s*true/m.test(raw);
      if (type && !draft && !sample) types.add(type);
    }
  } catch {
    return types;
  }
  return types;
}
const publishedTypes = publishedArticleTypes();
const emptyListingPaths = [
  ['review', '/reviews'],
  ['tutorial', '/tutorials'],
  ['troubleshooting', '/troubleshooting'],
].filter(([type]) => !publishedTypes.has(type)).map(([, path]) => path);

// lastmod only where a content file records a real date. Build time is not used.
function contentLastmods() {
  const dates = new Map();
  const articleDirs = fileURLToPath(new URL('./src/content/articles', import.meta.url));
  const sections = { review: 'reviews', tutorial: 'tutorials', troubleshooting: 'troubleshooting', news: 'news' };
  let newestArticle = '';
  try {
    for (const file of readdirSync(articleDirs)) {
      if (!file.endsWith('.mdoc')) continue;
      const raw = readFileSync(join(articleDirs, file), 'utf8');
      if (/^draft:\s*true/m.test(raw) || /^sample:\s*true/m.test(raw)) continue;
      const type = raw.match(/^type:\s*"?(review|tutorial|troubleshooting|news)"?/m)?.[1];
      const updated = raw.match(/^updatedDate:\s*"?(\d{4}-\d{2}-\d{2})/m)?.[1];
      const published = raw.match(/^publishDate:\s*"?(\d{4}-\d{2}-\d{2})/m)?.[1];
      const date = updated || published;
      if (!type || !date || !sections[type]) continue;
      dates.set(`/${sections[type]}/${file.replace(/\.mdoc$/, '')}`, date);
      if (date > newestArticle) newestArticle = date;
    }
  } catch {
    return dates;
  }
  if (newestArticle) dates.set('/blog', newestArticle);
  try {
    const snapshotPath = fileURLToPath(new URL('./src/data/news-snapshot.json', import.meta.url));
    const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
    const checked = typeof snapshot.checkedAt === 'string' ? snapshot.checkedAt.slice(0, 10) : '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(checked)) dates.set('/updates', checked);
  } catch {
    return dates;
  }
  return dates;
}
const lastmodByPath = contentLastmods();

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
  // Canonicals are written without a trailing slash. Keep the sitemap on the same form.
  trailingSlash: 'never',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      // A news sitemap is intentionally not enabled. Google only wants articles
      // from the last two days, and these editorial dates are older than that.
      // Automatic update briefs are noindex, so they do not belong there either.
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '') || '/';
        if (path.startsWith('/keystatic') || path === '/search' || path === '/in-progress') return false;
        if (path === '/404') return false;
        if (path.startsWith('/categories')) return false;
        if (path === '/news') return false;
        if (!privacyPolicyReady && path === '/privacy') return false;
        if (emptyListingPaths.includes(path)) return false;
        return true;
      },
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';
        const lastmod = lastmodByPath.get(path);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    react(),
    markdoc(),
    keystatic(),
  ],

  adapter: node({ mode: 'standalone' }),
});
