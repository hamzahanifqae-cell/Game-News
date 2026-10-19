#!/usr/bin/env node
// Reports what's missing before this site is ready to launch.
//
// Default mode is informational only — useful during development, never
// fails. Pass --strict (or run `npm run launch-check:strict`) to exit 1 when
// any blocker exists; that's what `npm run release` runs before building.
//
// This script checks PROJECT release requirements: things this codebase
// itself depends on (real content, contact details, a reviewed privacy
// policy, a production URL, internally-consistent ad/consent config). It
// does NOT check, and cannot check, Google's own AdSense eligibility and
// policy requirements — those depend on content quality and actual
// deployed behavior, which only Google's review evaluates. This script
// does not invent a minimum article count, word count, traffic level, or
// domain age as if Google required one, because Google doesn't publish one.
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

const strict = process.argv.includes('--strict');

const root = fileURLToPath(new URL('..', import.meta.url));
// CONTENT_DIR lets this script be pointed at an isolated fixture directory
// for testing the checks themselves, without ever touching real content.
// Defaults to this project's actual content.
const contentDir = process.env.CONTENT_DIR ? resolve(process.cwd(), process.env.CONTENT_DIR) : join(root, 'src/content');

function readFrontmatter(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return loadYaml(match[1]) ?? {};
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function listFiles(dir, ext) {
  try {
    return readdirSync(join(contentDir, dir)).filter((f) => extname(f) === ext);
  } catch {
    return [];
  }
}

// Mirrors src/lib/ads.ts — duplicated here because this script runs under
// plain Node, outside Astro/Vite, so it can't import that TypeScript module
// directly. Keep these two in sync if the validation rules change.
function isValidAdUnitId(value) {
  return /^\d{6,16}$/.test(String(value ?? '').trim());
}
function isValidPublisherId(value) {
  return /^ca-pub-\d{10,20}$/.test(String(value ?? '').trim());
}
function isCmpConfigValid(settings) {
  switch (settings.cmpProvider) {
    case 'cookiebot':
    case 'cookieyes':
      return Boolean(settings.cmpSiteId?.trim());
    case 'custom':
      return Boolean(settings.cmpCustomScript?.trim());
    default:
      return false;
  }
}

const blockers = [];
const warnings = [];
const info = [];

// --- Production URL ---
const siteUrl = process.env.PUBLIC_SITE_URL;
if (!siteUrl || /example\.com|your-domain/.test(siteUrl)) {
  blockers.push(
    'PUBLIC_SITE_URL is not set to a real domain (checked via the environment, not a file this script reads — ' +
      'set it before running a release build; astro.config.mjs enforces this again at build time regardless).'
  );
} else {
  info.push(`PUBLIC_SITE_URL: ${siteUrl}`);
}

// --- Articles ---
const articleFiles = listFiles('articles', '.mdoc');
const articles = articleFiles.map((f) => readFrontmatter(join(contentDir, 'articles', f)));
const realArticles = articles.filter((a) => !a.draft && !a.sample);
const byType = { review: 0, tutorial: 0, troubleshooting: 0, news: 0 };
for (const a of realArticles) {
  if (a.type in byType) byType[a.type] += 1;
}
info.push(`Articles: ${articles.length} total, ${realArticles.length} published (non-draft, non-sample).`);
info.push(`  Upcoming/news: ${byType.news} · Reviews: ${byType.review} · Tutorials: ${byType.tutorial} · Troubleshooting: ${byType.troubleshooting}`);
if (realArticles.length === 0) {
  blockers.push('No published (non-draft, non-sample) articles exist. The site will launch with empty listing pages.');
}

// --- Apps ---
const appFiles = listFiles('apps', '.mdoc');
const apps = appFiles.map((f) => readFrontmatter(join(contentDir, 'apps', f)));
const realApps = apps.filter((a) => !a.draft && !a.sample);
info.push(`Apps: ${apps.length} total, ${realApps.length} published.`);
if (realApps.length === 0) {
  warnings.push('No published app information pages exist yet.');
}

// --- Authors referenced by real articles must themselves be real ---
// Note: an unpublished author does NOT break the page — ArticleDetail.astro
// resolves authors through getPublicEntry(), which silently omits the
// byline rather than rendering sample data or crashing. This is still
// worth blocking on, because publishing an article with no visible byline
// at all is a content-completeness problem, not a broken-link one.
const authorFiles = listFiles('authors', '.json');
const authors = new Map(
  authorFiles.map((f) => {
    const data = readJson(join(contentDir, 'authors', f));
    return [f.replace('.json', ''), data];
  })
);
for (const a of realArticles) {
  const author = authors.get(a.author);
  if (!author) {
    blockers.push(`Article "${a.title}" references an author ("${a.author}") that doesn't exist — it will publish with no byline shown.`);
  } else if (author.sample) {
    blockers.push(`Article "${a.title}" is published but its author ("${a.author}") is a sample author — it will publish with no byline shown, since sample authors are suppressed in production.`);
  }
}

// --- Published articles referencing non-public apps ---
// Note: this does NOT produce a public broken link. ArticleDetail.astro and
// apps/[slug].astro both resolve relatedApp through getPublicEntry(), which
// omits the "View app info" card entirely for a draft/sample/missing app —
// readers never see a link to a page that doesn't exist. This is flagged
// anyway because it's still an editorial gap: the article was written
// assuming context (specs, an official link) that readers won't actually see.
for (const a of realArticles) {
  if (!a.relatedApp) continue;
  const appFile = `${a.relatedApp}.mdoc`;
  const app = appFiles.includes(appFile) ? readFrontmatter(join(contentDir, 'apps', appFile)) : null;
  if (!app) {
    info.push(`Article "${a.title}" references an app ("${a.relatedApp}") that doesn't exist — the "View app info" card is simply omitted, not a broken link.`);
  } else if (app.draft || app.sample) {
    info.push(`Article "${a.title}" references an app page ("${a.relatedApp}") that is draft/sample — the "View app info" card is omitted in production, not a broken link, but readers lose that context.`);
  }
}

// --- Site Settings ---
const settings = readJson(join(contentDir, 'site-settings.json'));
if (!settings.businessLegalName) {
  blockers.push('Site Settings: businessLegalName is empty. Required for Privacy Policy and footer.');
}
if (!settings.contactEmail) {
  blockers.push('Site Settings: contactEmail is empty. Required for Privacy Policy and Contact page.');
}

// --- Ads & CMP: internal consistency ---
// A contradictory state (verified=true with provider=none, or a provider
// selected with no required ID) is caught here AND at render time by
// src/lib/ads.ts's adsMasterEnabled()/isCmpConfigValid() — ads stay off
// either way, but this surfaces the misconfiguration explicitly.
if (settings.cmpConfiguredAndVerified && settings.cmpProvider === 'none') {
  blockers.push('Contradictory config: cmpConfiguredAndVerified is true but cmpProvider is "none". Ads will stay disabled (code enforces this), but fix the configuration.');
}
if (settings.cmpProvider !== 'none' && !isCmpConfigValid(settings)) {
  blockers.push(`Contradictory config: cmpProvider is "${settings.cmpProvider}" but its required ID/script field is empty. Ads will stay disabled (code enforces this), but fix the configuration.`);
}
if (settings.adsEnabled) {
  if (!isValidPublisherId(settings.adsensePublisherId)) {
    blockers.push(`adsEnabled is true but adsensePublisherId ("${settings.adsensePublisherId}") is not a valid ca-pub-XXXXXXXXXXXXXXXX ID.`);
  }
  const adUnitFields = ['adUnitHomeMid', 'adUnitArticleBottom', 'adUnitAppBottom'];
  const validAdUnits = adUnitFields.filter((f) => isValidAdUnitId(settings[f]));
  if (validAdUnits.length === 0) {
    warnings.push('adsEnabled is true but no ad-unit ID is in a valid format — no ad slot will actually render.');
  }
  if (!settings.cmpConfiguredAndVerified || !isCmpConfigValid(settings)) {
    warnings.push(
      'adsEnabled is true but the consent setup is not both attested AND structurally valid — ads will not render ' +
        '(src/lib/ads.ts enforces this). This is expected if you have not finished CMP setup yet.'
    );
  }
}
if (!settings.adsTxtLines) {
  info.push('ads.txt is currently empty (no lines configured in Site Settings).');
}

// --- Legal pages ---
const privacy = readFrontmatter(join(contentDir, 'legal/privacy.mdoc'));
if (!privacy.policyReviewDate) {
  blockers.push('Privacy Policy has no policyReviewDate set — it displays as "not yet reviewed," is marked noindex, and is excluded from the sitemap and on-site search until this is set.');
}

for (const page of ['about', 'terms']) {
  const raw = readFileSync(join(contentDir, `legal/${page}.mdoc`), 'utf-8');
  const body = raw.replace(/^---\n[\s\S]*?\n---/, '').trim();
  if (!body) warnings.push(`legal/${page}.mdoc has no body content.`);
}
warnings.push('Terms of Use and Privacy Policy are starter text, not legal advice — have a qualified professional review both before launch.');

// --- Report ---
const line = '─'.repeat(60);
console.log(line);
console.log(`GameNews launch-readiness check${strict ? ' (strict)' : ''}`);
console.log(line);

console.log('\nInfo:');
info.forEach((m) => console.log(`  • ${m}`));

console.log(`\nWarnings (${warnings.length}):`);
if (warnings.length === 0) console.log('  none');
warnings.forEach((m) => console.log(`  ⚠ ${m}`));

console.log(`\nBlockers (${blockers.length}) — project release requirements, not Google's requirements:`);
if (blockers.length === 0) console.log('  none');
blockers.forEach((m) => console.log(`  ✗ ${m}`));

console.log(`\n${line}`);
if (blockers.length > 0) {
  console.log('Not ready to launch — resolve the blockers above.');
} else {
  console.log(
    'No project-level blockers found. This is NOT the same as Google AdSense eligibility or policy compliance — ' +
      'Google makes that decision based on actual content and behavior, which this script cannot evaluate.'
  );
}

if (strict && blockers.length > 0) {
  process.exitCode = 1;
}
