# GameNews

A content site for original app reviews, tutorials, troubleshooting guides, and app information pages, built with Astro, TypeScript, and Tailwind CSS, with content managed through [Keystatic](https://keystatic.com).

Public content pages are statically generated. Nothing here hosts app downloads — app info pages link to official sources only.

## Stack

- **Astro** (static output) + **TypeScript** + **Tailwind CSS v4**
- **Keystatic** CMS — git-backed, no database. Content is Markdown/Markdoc + JSON files in `src/content/`, edited through a dashboard at `/keystatic`.
- **Pagefind** for static, client-side search (no backend).
- **@astrojs/node** adapter (standalone mode), used only so the Keystatic admin routes and the live news API can run on demand; every public page is still prerendered at build time.

## Design

One light theme (navy ink on warm off-white, indigo brand, teal accent) — no dark mode, by choice: a half-verified dark theme is worse than a well-verified light one. Tokens live in `src/styles/global.css` (`@theme` block); contrast ratios are checked there in a comment. Typography is Source Sans 3 (UI and body) + Manrope (headings and wordmark).

### Fonts

Both typefaces are **self-hosted** as Latin WOFF2 files in `src/assets/fonts`, with their licenses (declared in `global.css`), not loaded from Google Fonts. An earlier version of this project loaded them from `fonts.googleapis.com`/`fonts.gstatic.com`, which sends every visitor's IP address to Google before they've made any choice about that — self-hosting removes that data flow entirely, so the Privacy Policy's "Fonts" section can truthfully say there isn't one.

## Local development

```sh
npm install
npm run dev
```

Visit `http://localhost:4321` for the site and `http://localhost:4321/keystatic` for the CMS dashboard. In dev, Keystatic writes directly to the filesystem ("local" mode) — no GitHub setup needed yet.

Draft and sample content (anything with `draft: true` or `sample: true`) is visible in dev — this is the intended way to preview populated layouts (cards, listings, article templates) before real content exists — but is automatically excluded from `npm run build`.

### Checking what's ready to launch

```sh
npm run launch-check            # informational — never fails, safe to run constantly in dev
npm run launch-check:strict      # same checks, but exits 1 if any blocker exists
npm run release                  # launch-check:strict, then build — refuses to build on a blocker
```

Scans `src/content/` and the `PUBLIC_SITE_URL` environment variable, reporting blockers (missing business details, zero published content, an unreviewed Privacy Policy, no real production URL, internally-contradictory ad/consent config) vs. warnings, without inventing a minimum article or word count — Google doesn't publish one, so neither do we. These are **this project's own release requirements**, not Google's AdSense eligibility or policy requirements — Google's decision depends on actual content and behavior that this script can't evaluate; a clean report here is not a claim of AdSense approval. Plain `npm run build` still works regardless of blockers, so a local review build is never blocked from existing — only `npm run release` enforces strict mode before building.

You can point the script at an isolated fixture directory (e.g. to test the checks themselves) with `CONTENT_DIR=/path/to/fixture/content npm run launch-check:strict` — it never needs to touch `src/content/`.

## Publishing content through the CMS

1. Go to `/keystatic` (locally, or on your deployed site once GitHub mode is set up — see below).
2. **Site Settings** (singleton) holds business details, analytics, ads, and CMP configuration.
3. **Categories** and **Authors** are simple reference collections — create these first.
4. **Apps** are "app information" pages: specs, platforms, and an official link only (no file uploads/downloads).
5. **Articles** covers reviews, tutorials, and troubleshooting guides, picked via the "Article type" field. Set `draft` to `false` to publish; leave `sample` off for anything real.
6. Save — in GitHub mode, this commits to your repo; redeploy on your host to pick up the change (see Deployment below). In local mode, restart `npm run dev` to see changes picked up (file watching handles most edits live).

### Switching the CMS to GitHub mode (for production editing)

Local mode only works when you can write to the project's filesystem (i.e., local dev). For editing the live site, configure GitHub mode:

1. Push this project to a GitHub repository.
2. Set `KEYSTATIC_GITHUB_OWNER` and `KEYSTATIC_GITHUB_REPO` in your environment (see `.env.example`).
3. Visit `/keystatic` on your deployed site and sign in with GitHub — this walks you through creating a GitHub App for Keystatic and fills in `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, and `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
4. Add all of those as environment variables wherever you deploy (e.g. your cPanel Node.js App's environment variable settings) and redeploy.
5. Grant the GitHub App access to your repo. Only accounts with write access to the repo can log in and edit content.

Full reference: [Keystatic GitHub mode docs](https://keystatic.com/docs/github-mode).

## Deployment (cPanel, via Node.js App)

```sh
PUBLIC_SITE_URL=https://your-real-domain.com npm run build   # builds the site and runs Pagefind indexing
```

`PUBLIC_SITE_URL` is **required to build for production** — the config throws immediately if it's unset or still looks like `example.com`/`your-domain`, because canonical URLs, the sitemap, `robots.txt`, and social tags all depend on it, and a previous version of this project shipped `example.com` to every one of those. `npm run dev` is unaffected; it never requires a real domain.

The build produces a standalone Node server at `dist/server/entry.mjs` plus static assets in `dist/client`. To preview the production build locally: `npm run preview` (runs `astro preview`, which works with this adapter) — or run the built server directly with `npm start`.

To deploy on cPanel:

1. In cPanel, open **Setup Node.js App** and create an application pointing at this project's directory. Pick a Node version matching `engines.node` in `package.json` (>=22.12.0).
2. Set the **Application startup file** to `dist/server/entry.mjs`.
3. Add `PUBLIC_SITE_URL` (your real domain) and the Keystatic GitHub-mode variables listed above as environment variables in the Node app's settings.
4. Upload the project (or pull it via Git) to the app's directory, then run `npm install` and `npm run build` from the app's "Run NPM Install"/terminal option (or SSH, if available).
5. Point the app's domain/subdomain at this Node app, and start/restart it from the cPanel Node.js App interface.
6. For HTTPS, use cPanel's **AutoSSL** (or install your own certificate) for the domain.

Redeploying after content or code changes means repeating step 4 (pull latest, `npm install`, `npm run build`) and restarting the app.

## Configuring ads, consent, and verification

All of this is controlled from **Site Settings** in the CMS (`src/content/site-settings.json`), not in code.

### Page-level ad eligibility

One flag — `adPageEligible`, passed to `BaseLayout` by every page — governs **both** whether the AdSense ad-library script can ever load on that page and whether any `AdSlot` on it renders markup. There used to be two independent checks here (a global script load in the layout, a per-slot check in `AdSlot`) that could disagree; an empty or error page could still load the ad-library script even with no manual slot showing, which matters a lot if Google's **Auto ads** is enabled on the account, since Auto ads can place ads anywhere the ad-library script runs, independent of this project's own `<ins>` tags. Not loading the script at all is the only way this codebase can reliably keep ads off a page — `AdSlot` alone can't.

Each page computes its own eligibility and passes it down:

| Page | `adPageEligible` |
| --- | --- |
| 404, `/search` | `false`, always |
| Homepage, `/reviews`, `/tutorials`, `/troubleshooting`, `/apps`, `/categories/[slug]` | `true` only if that page actually has published content to show |
| Article detail, app detail | `true` (static-generated only for published entries, so always substantive) |

**What this does and doesn't guarantee:** not loading the ad-library script on an ineligible page means no AdSense request — including Auto ads — can originate from that page in this codebase. It does **not** by itself configure anything in your AdSense *account*. If Auto ads is enabled there, also use AdSense's own **Site control → Ad review center** (or the per-URL ad settings) to mirror these exclusions on Google's side — this project's code has not been checked against a live AdSense account's actual Auto ads behavior, since doing that would mean enabling live ads, which this task explicitly avoids. Treat the account-side configuration as still required, not optional.

### The ad master gate

Even on an eligible page, `src/lib/ads.ts: adsMasterEnabled()` requires **all** of:

| Field | What it does |
| --- | --- |
| `adsEnabled` | Master switch. **Keep off** until AdSense has approved this account. |
| `adsensePublisherId` | Your `ca-pub-...` ID, validated against that exact format. Also drives the `google-adsense-account` verification meta tag, independently of `adsEnabled` and of ad serving. |
| `cmpConfiguredAndVerified` | An **operator attestation** — a human checking a box, not an automated check, and labeled as such in the CMS. See "CMP configuration safeguards" below for what makes this valid at all. |

Even then, each placement needs its own real ad-unit ID — `adUnitHomeMid`, `adUnitArticleBottom`, `adUnitAppBottom` — validated as a plausible numeric AdSense slot ID. A placement with no (or an invalid) ad-unit ID renders nothing, not a placeholder.

Analytics: `analyticsProvider` / `analyticsId` — `none`, `plausible` (cookieless), or `ga4`.
Consent: `cmpProvider` / `cmpSiteId` / `cmpCustomScript` — `none`, `cookiebot`, `cookieyes`, or `custom` (paste your own script tag).
Search Console ownership verification: `searchConsoleVerification` — kept as a separate meta tag (`google-site-verification`) from AdSense's `google-adsense-account`.

### CMP configuration safeguards

`cmpConfiguredAndVerified` alone does nothing. `src/lib/ads.ts: isCmpConfigValid()` rejects contradictory states regardless of that checkbox:

- `cmpProvider` is `none` → always invalid, even if `cmpConfiguredAndVerified` is checked.
- `cmpProvider` is `cookiebot` or `cookieyes` with an empty `cmpSiteId` → invalid.
- `cmpProvider` is `custom` with an empty `cmpCustomScript` → invalid.

`npm run launch-check` flags these same contradictions explicitly (as blockers) so they surface before a release attempt, not just silently at render time. Both the CMS field description and this README say outright: **checking this box is a manual confirmation that you did the provider-dashboard setup and a real-browser check yourself — nothing in this codebase can verify your CMP account configuration or test your banner for you.** What you still have to do yourself, outside this repo, before checking it:

1. In your CMP's own dashboard, enable Google Consent Mode / "Support GCM" (Cookiebot and CookieYes both call it this).
2. Run that CMP's own built-in Consent Mode verification/status check.
3. Open the live site in a real browser and confirm: the banner actually appears, rejecting analytics/ads actually keeps them from loading, and accepting them actually loads them. This project does not and cannot do this for you.
4. Reconfirm this periodically — a CMP's own update can silently change its default behavior.

### Consent & analytics: Basic Consent Mode

This project uses Google's **Basic Consent Mode**, not Advanced: [the GA4 tag and the AdSense ad-library script are not loaded in the browser at all until the visitor's CMP reports consent for that category](https://support.google.com/analytics/answer/9976101) — no request to Google happens pre-consent, and no cookieless pings are sent. This is a deliberate choice over Advanced mode (which loads tags immediately and sends anonymized pings pre-consent) because it's simpler to reason about and matches what the Privacy Policy can state plainly.

**This project does not implement its own consent logic or read raw IAB TCF purpose flags** — an earlier version did exactly that (a hand-rolled `__tcfapi` listener mapping a few purposes onto Consent Mode fields) and it's been removed as an unvalidated bridge. What's there now, in `src/lib/consent-client.ts`:

1. A vendor-agnostic default-denied [Consent Mode v2](https://support.google.com/analytics/answer/9976101) call, placed before any CMP or Google script.
2. The chosen CMP's own script tag (loaded by `ConsentScripts.astro`, unchanged).
3. A listener on **that CMP's own documented JavaScript event/object** — nothing invented:
   - Cookiebot: `CookiebotOnConsentReady` / `CookiebotOnAccept` / `CookiebotOnDecline`, reading `Cookiebot.consent.statistics` and `.marketing`. ([Cookiebot SDK docs](https://usercentrics.com/docs/web/cookiebot/cookiebot-sdk))
   - CookieYes: the `cookieyes_consent_update` event, reading `event.detail.accepted`. ([CookieYes event docs](https://www.cookieyes.com/documentation/events-on-cookie-banner-interactions/)) CookieYes's docs don't fully specify which banner actions fire this event (save vs. accept-all vs. a later preference change) — verify that in a real browser before relying on it.
   - `custom` and `none` providers: **no automatic wiring.** This codebase doesn't know a custom CMP's event shape, and guessing one would be exactly the kind of unvalidated mapping this section exists to avoid. Analytics and ads simply won't load for a custom provider until someone extends `consent-client.ts` with that CMP's real documented event.
4. Only once that event reports consent does `consent-client.ts` inject the GA4 or AdSense script and call `gtag('consent', 'update', ...)` — covering initial consent, rejection, and later changes, because it re-reads the CMP's own state on every one of its change events rather than caching a single decision. Withdrawal is handled the same way, through whatever event the CMP fires when a visitor reopens its preferences and changes a choice — this project does not re-verify that against a real banner interaction (see "What remains unverified").

**Selecting a provider in Site Settings only loads its script tag and wires the listener above. It does not, by itself, complete consent compliance.** A plain cookie banner is not a substitute for any of this, and this project does not claim to be TCF/consent-compliant merely because a provider is configured — that claim depends on the account-side setup in "CMP configuration safeguards" above, which only you can complete and verify.

### Ad placement rules this project follows

- Ads only render when the master gate is on (see above) **and** the page is ad-eligible **and** the specific placement has a valid ad-unit ID.
- Every ad slot reserves space up front (`src/components/AdSlot.astro`) sized to its format, to avoid layout shift.
- Ads are visually separated from navigation and from official-source links (e.g. the AdSense slot on an app page is never adjacent to the "Visit official page" button's click target).
- Ads are never placed on the 404 page or the search page, and are labeled "Advertisement."

## SEO, crawling, and search indexing

- `sitemap.xml` is generated automatically (`@astrojs/sitemap`) and excludes `/keystatic` and `/search`. Draft and sample content never reach the sitemap because they're filtered out of the collections the sitemap is built from. URLs use `PUBLIC_SITE_URL` (required at build time, see above) — never `example.com`.
- `robots.txt` (`src/pages/robots.txt.ts`) disallows `/keystatic` and `/search` and points at the sitemap.
- `ads.txt` (`src/pages/ads.txt.ts`) is served from Site Settings → `adsTxtLines`.
- Canonical URLs, Open Graph, and Twitter card tags are set per page via `src/components/Seo.astro`.
- Article pages emit `Article` JSON-LD built only from fields actually shown on the page (headline, description, dates, author) — and the author is dropped from the JSON-LD (and from the visible byline) if it resolves to a draft/sample entry, same as everywhere else.
- **Pagefind indexing is scoped to `<main data-pagefind-body>`** in `BaseLayout.astro` — header/footer nav, breadcrumbs, the table of contents, and ad-slot labels are tagged `data-pagefind-ignore` or sit outside `<main>` entirely, so none of it pollutes search results. Once any page on the site uses `data-pagefind-body`, Pagefind stops indexing pages that don't have it at all — which is how 404 and `/search` itself (neither sets it; see `pagefindIndex={false}` on `BaseLayout`) are excluded from the index.
- **The Privacy Policy is treated as a draft until it has a `policyReviewDate`** set by a human (`src/content/legal/privacy.mdoc`): while unset, the page sets `noindex`, `pagefindIndex={false}`, and `adPageEligible={false}`, and `astro.config.mjs` excludes it from the sitemap outright (it reads that one file's frontmatter directly, since `@astrojs/sitemap`'s filter only gets a URL string). Setting the date makes it indexable again automatically.

## Content model reference

| Collection | Purpose |
| --- | --- |
| `categories` | Topic taxonomy (e.g. Productivity, Photo & Video). |
| `authors` | Author name, bio, avatar. |
| `apps` | App information pages: specs, platforms, official link only — no hosted downloads. |
| `articles` | Reviews, tutorials, and troubleshooting guides (`type` field selects the template). |
| `siteSettings` (singleton) | Business details, analytics, ads, and CMP configuration. |
| `legalAbout` / `legalContact` / `legalPrivacy` / `legalTerms` (singletons) | Body copy for the four legal/info pages, published as-is — field descriptions (CMS-only, never rendered) tell editors what's expected instead of instructional text in the body. The Privacy Policy page is mostly generated dynamically from `siteSettings`; the singleton holds only an explicit `policyReviewDate` and optional supplementary notes. |

**Related-content safety:** an article's author and related app are resolved through `getPublicEntry()` (`src/lib/content.ts`), which applies the same draft/sample rules as the listing pages. A published article referencing a sample author or a draft/sample app will not show that entry's details or link to a page that doesn't exist in production — `npm run launch-check` flags the underlying content problem instead.

Sample content ships in `src/content/` clearly marked with `[SAMPLE]` titles and `sample: true` — it's visible in `npm run dev` and automatically excluded from `npm run build`.

## Before you launch

Run `npm run launch-check:strict` (or just `npm run release`, which runs it for you) and resolve everything it blocks on. See the launch-readiness report delivered alongside this project for the fuller picture of what's implemented vs. what still needs your input (business/legal details, AdSense account, CMP account and its dashboard setup, real content).


### Automatic game updates

Popular games link to official Steam stores; no game installers are hosted here. Upcoming-game blogs are original dated editorial features under `/blog` and `/news/[slug]`. Previous articles are preserved as drafts.

`/updates` and the homepage load publisher announcements from the allowlisted games in `src/lib/news.ts`. Every card opens an internal `/updates/[appid]/[timestamp]-[gid]` automatic brief, with the source date, a limited source preview, game context, and official announcement/store links. These briefs are labeled as automated and remain noindex. Valid briefs allow an article-bottom ad placement only when the global AdSense settings and consent gates permit it; unavailable and invalid briefs remain ad-ineligible. Live ad serving stays off until configured; original editorial features remain separate. New announcements become new briefs rather than silently rewriting an older story.

The same-origin `/api/news.json` endpoint uses Steam's public news API. The browser checks on arrival, every 15 minutes while visible, and on returning to a tab. Successful responses are cached for 15 minutes; partial/outage responses retry after a minute. Failed sources retain saved items with a notice. The checked-in snapshot supplies a clearly dated fallback. Older timestamped brief URLs resolve through historical API queries if no longer in the recent list.

Deploy using the existing Astro Node adapter (or another compatible server adapter), with outbound HTTPS access to api.steampowered.com. A static-only file server cannot execute the news endpoint or internal brief routes. No scheduler, external AI service, or API key is needed. For local development use `npm run dev -- --background`, then `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop`.

Run `npm run test:news` for cache, outage, and source-validation checks.
