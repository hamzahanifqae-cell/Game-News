# SEO notes

GameNews (`https://gamenews.online`) is a gaming publication. It publishes dated editorial watchlists, official-download pages for PC games, and automatic Steam update briefs. It does not host game files. These changes are local only. Nothing here was deployed.

Search Console had already shown the property receiving impressions, including a brand query, with an average position around 12. That is context, not a ranking target. Nothing in this pass promises a first page or a first position.

## Highest-priority findings

Confirmed in the repository and in the production build:

- Article and game pages had no share image, and article structured data had no image, even when a real cover existed.
- News breadcrumbs and their structured data pointed at `/news`, which is only a redirect to `/updates`. Those are different pages: `/updates` is the automatic Steam desk, and `/news/[slug]` is an editorial article.
- On the live site, `/news` was HTTP 200 with a meta refresh, not an HTTP 301. The Node server now sends `301` to `/updates`.
- Canonical URLs had no trailing slash, while the sitemap used a trailing slash. Both now use the slash-free URL, and `/blog/` returns `301` to `/blog`.
- `/categories` and `/categories/games` repeated the games list and the watchlist. They are now `noindex` and out of the sitemap. Links from articles and game pages go to `/blog` or `/games`.
- The homepage structured-data name was `GameNews: GTA VI News & Upcoming PC Games | GameNews`. The visible title does not repeat the brand. The structured data now matches the title.
- The sitemap had no `lastmod`. It now has one only where a content file has a real date. Build time is not used.
- Empty review, tutorial, and troubleshooting listings stay `noindex` and out of the sitemap. Their introductions claimed hands-on work the About page does not claim. The introductions now match that policy.
- Publication dates used the build machine’s timezone. They now render in UTC, so a date-only value such as `2026-10-16` stays October 16.

Not confirmed, because this environment cannot see them:

- Which URLs Google has indexed, and the current Performance report after the previous deploy.
- Core Web Vitals field data. No Lighthouse score was invented.
- Whether the favicon used as the organization logo meets Google’s logo guidelines.
- Google News inclusion. The publication name on `news.google.com` was not checked.

## What changed

- Article pages use one layout. Each indexable article gets Open Graph and Twitter image tags from its real cover, `article:published_time`, and `NewsArticle` or `Article` structured data whose headline, date, image, and author match the page. `dateModified` is included only when `updatedDate` exists. None of the current articles have one.
- The byline “GameNews” links to `/about`. The author in structured data is an `Organization` with that URL. No person was invented.
- News breadcrumbs are Home / Upcoming games (`/blog`) / the article. The article URL did not change.
- `/blog`, `/games`, and `/updates` have visible breadcrumbs. `/games` links to the GTA VI and Fable articles. `/updates` links every published editorial article and says the briefs underneath are automatic.
- `/updates` heading is now “Official PC game updates.”
- The homepage, blog, and games list structured-data names match the visible headings.
- Game and app pages get a share image and an `image` on the existing `VideoGame` or `SoftwareApplication` object. No ratings were added.
- `robots.txt` still allows public pages and points at `sitemap-index.xml`. It does not use `Disallow` to hide pages that should drop out of the index. Those pages use `noindex`.
- The sitemap has 26 URLs. It omits `/news`, `/search`, `/categories`, `/reviews`, `/tutorials`, `/troubleshooting`, `/privacy` (still unpublished), `/404`, `/in-progress`, and `/keystatic`.
- `lastmod` is the article `updatedDate` or `publishDate`, the newest of those for `/blog` (`2026-10-16`), and the saved snapshot check date for `/updates` (`2026-10-15`). The sitemap writer stores those as midnight UTC. That matches the date-only source. It is not a claim that the page changed at midnight.
- The two fonts used for body text and the main heading are preloaded. Other weights stay available. `font-display: swap` was already set.
- A news sitemap was not added. [Google’s news sitemap documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap) says to include articles from the last two days only. The newest editorial date is 16 October 2026, and today in this session is 3 November 2026. The automatic briefs are `noindex`, so they do not qualify either. An empty news sitemap would not help. Revisit this only after a real article is published inside that two-day window.

## Page-to-query map

These are intent hypotheses from the page content. They are not search volumes, and they were not taken from a keyword tool. The only Search Console query confirmed in earlier work was the site name.

| Page | Intent the page can honestly serve |
| --- | --- |
| `/` | Brand query for GameNews, plus a starting point for GTA VI news and upcoming PC games |
| `/news/gta-vi-release-watchlist` | GTA VI release date. The page states 19 November 2026 for PlayStation 5 and Xbox Series X\|S, checked 16 October 2026. It does not state a PC date |
| `/news/fable-watchlist` | New Fable release date. The page states 23 February 2027 on the official Steam listing, checked 15 October 2026 |
| Other `/news/*-watchlist` pages | Release news for that named game. Titles do not add a date the article does not state |
| `/blog` | Upcoming PC games and release-date articles |
| `/games` | Popular PC games and official Steam downloads |
| `/apps/[slug]` | That game or app’s official download. Example: “GTA V Enhanced PC” is the released PC game, not GTA VI |
| `/updates` | A list of official Steam announcements. Individual `/updates/...` briefs stay `noindex`, so they are not the landing page for “[game] patch notes” |
| `/reviews`, `/tutorials`, `/troubleshooting` | Reserved for those formats. No public articles yet, so the listings stay out of the index |
| `/about` | How the editorial work is made |

## What was verified

- `npm run test:news`: 6 tests passed.
- `PUBLIC_SITE_URL=https://gamenews.online npm run build` completed. Pagefind indexed 25 pages. The existing chunk-size warning and the missing `photo-and-video` category on VLC are unchanged.
- Built HTML for the homepage, GTA VI article, GTA V Enhanced page, updates page, reviews listing, and category page: title, canonical `https://gamenews.online/...`, robots directive, and share image where a cover exists.
- GTA VI structured data: `NewsArticle` headline matches the H1, image is the built cover, author URL is `/about`, breadcrumb items are `/`, `/blog`, and the article.
- Homepage `WebPage` name is `GameNews: GTA VI News & Upcoming PC Games`.
- Sitemap: 26 slash-free URLs, no category, review, search, or 404 URLs, `lastmod` on the nine articles, `/blog`, and `/updates`.
- Node server on `127.0.0.1:4324`: `/news` is `301` to `/updates`, `/blog/` is `301` to `/blog`, the GTA VI article is `200`, and an unknown URL is `404` with `noindex`.
- Browser pass: homepage title and H1, click through “Read the GTA VI release brief” to the article, breadcrumb to `/blog`, then `/games` and `/updates` showed the new headings and the editorial links.

## Second pass, 5 November 2026

Search Console baseline supplied for this pass, with no page-filtered queries. Zero clicks was not treated as a title failure or an indexing failure.

- `/updates` and `/updates/`: live check showed `200` and `301` to `/updates`. Canonical and sitemap use the slash-free URL. The hub now groups the saved announcements by game. A patch token is shown only when it is already in the publisher title (`7.41f` is the one in the current snapshot). Link text includes the game and the publisher date when several briefs share a title. The meta description now names Phantom Blade Zero and The Wolf Among Us 2, which the page already listed.
- `/tutorials` and `/tutorials/`: live check showed `200` and `301` to `/tutorials`. The page stays `noindex` because no tutorial is published. The title no longer says buying checklists are available. The empty page links to the Counter-Strike 2 download, the Dota 2 download, and `/updates`. Draft guides were not published.
- `/categories` and `/categories/`: live check showed `200` and `301` to `/categories`. Canonical is `https://gamenews.online/categories`. Both are `noindex` and absent from the sitemap. Internal links already use the slash-free form. No page change. Search Console can still list the slash URL until it records the redirect.

The first pass was deployed on 3 November 2026. This second pass is local until the next deploy.

## Remaining issues

- Deploy is still required before Google can see any of this. After deploy, the old `/news` response should be checked on the public site. It was HTTP 200 there on 3 November 2026.
- Automatic update briefs remain `noindex`. That avoids a pile of thin pages. It also means a query such as “Counter-Strike 2 patch notes” does not have an indexable article yet.
- Several watchlist titles say “release news” because the article does not give a publisher date. Do not add a date until the source states one, and do not change `publishDate` just to look fresh. When a source changes, edit the article and set `updatedDate`.
- VLC’s category `photo-and-video` does not exist, so that page has no category link. The warning was already in the build.
- Draft tutorials and comparisons exist for Counter-Strike 2, Dota 2, VLC, Stardew Valley, Slay the Spire, and Terraria. They are not public. Publish one only after a person checks the sources.
- The organization logo in structured data is still the favicon. It was left in place because there is no separate logo file.
- Analytics still will not record visits until a consent provider is connected and a visitor accepts statistics. That is unchanged.
- Nine font files are still shipped. Two are preloaded. This was not measured in field data.

## Manual Search Console steps

Do these after the build is deployed. Do not remove `public/googlef5680b860a624f88.html`.

1. Open the existing URL-prefix property for `https://gamenews.online/`.
2. Submit `https://gamenews.online/sitemap-index.xml` again if the last read is older than this deploy.
3. Use URL inspection and request indexing for `/`, `/news/gta-vi-release-watchlist`, `/blog`, `/games`, and `/updates`.
4. If “Request indexing” shows “Something went wrong,” leave it. The sitemap is enough for discovery. That error is Google’s tool, not a broken page.
5. Inspect `/news` after deploy and confirm it reports a redirect to `/updates`.
6. In a few days, check Pages for the new article and for excluded `noindex` URLs. Excluded category and empty listing URLs are expected.
7. Do not submit a news sitemap until an article is actually inside Google’s two-day window.

## Measurement

Use Search Console, not a rank tracker snapshot.

- Organic clicks, impressions, CTR, and average position for the property.
- The same metrics for the pages in the map above, especially the GTA VI and Fable articles.
- Indexed page count, and the queries those pages actually receive.
- Compare the 28 days after Google recrawls the deploy with the previous 28 days. GTA VI’s 19 November 2026 release will change demand on its own. Say so when reading the numbers. Do not treat a launch-week spike as proof that a title change worked.
- There is no on-site purchase. Useful outcomes are clicks from an article or game page to the official store, and return visits. Those store clicks are not in Search Console. They need Analytics, which stays inactive until consent is configured.
- Do not judge success by one day’s average position.

## Content and promotion backlog

In this order:

1. After Rockstar or Playground changes a stated date, update that one article, set `updatedDate`, and keep the original `publishDate`.
2. Review and publish the existing draft checklists one at a time, starting with a game that already has a public download page, such as Counter-Strike 2 or Dota 2. Link the article from that game page with `relatedApp`.
3. For a patch-notes query, write a short original explanation that quotes and links the official post. Leave the automatic brief `noindex`.
4. Add a real logo file before expecting organization logo treatment. Do not mark the favicon up as something it is not.
5. Connect Cookiebot or CookieYes so Analytics can measure engaged visits. Do not paste a second Google tag around the consent gate.
6. Promotion that fits the site: share a specific article when its source is current, and link between a game page and its own article. Do not buy links, trade links in bulk, or submit the site to directories.
