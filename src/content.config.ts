import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categories = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/categories' }),
  schema: z.object({
    name: z.string(),
    description: z.string().default(''),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      bio: z.string().default(''),
      kind: z.enum(['Person', 'Organization']).default('Person'),
      avatar: image().optional(),
      sample: z.boolean().default(false),
    }),
});

const apps = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/content/apps' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.string(),
      category: z.string(),
      developer: z.string().default(''),
      officialLink: z.string().url(),
      platforms: z.array(z.enum(['android', 'ios', 'windows', 'macos', 'linux', 'web'])).default([]),
      currentVersion: z.string().default(''),
      lastUpdated: z.coerce.date().optional(),
      fileSize: z.string().default(''),
      coverImage: image().optional(),
      coverImageAlt: z.string().default(''),
      coverImageCredit: z.string().default(''),
      coverImageSource: z.string().url().optional(),
      seoTitle: z.string().default(''),
      seoDescription: z.string().default(''),
      draft: z.boolean().default(true),
      sample: z.boolean().default(false),
    }),
});

const articles = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      type: z.enum(['review', 'tutorial', 'troubleshooting', 'news']),
      description: z.string(),
      category: z.string(),
      author: z.string(),
      relatedApp: z.string().optional(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      coverImage: image().optional(),
      coverImageAlt: z.string().default(''),
      coverImageCredit: z.string().default(''),
      coverImageSource: z.string().url().optional(),
      seoTitle: z.string().default(''),
      seoDescription: z.string().default(''),
      draft: z.boolean().default(true),
      sample: z.boolean().default(false),
      // News about a game that has already launched: labeled "Game news" instead of "Upcoming".
      released: z.boolean().default(false),
      // Official release day, when one is announced. Once this day has passed at build time the
      // article is treated as released and leaves every Upcoming list without editing `released`.
      releaseDate: z.coerce.date().optional(),
      // Short source note shown next to the date on /blog, e.g. "confirmed on Steam, checked 18 November 2026".
      releaseDateNote: z.string().default(''),
      // Official trailer, embedded with YouTube's player. Only uploads verified (via YouTube oEmbed)
      // to be on the publisher's own channel; nothing is downloaded or re-hosted.
      trailer: z
        .object({
          youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
          title: z.string(),
          channel: z.string(),
        })
        .optional(),
      // Official Steam store pages for the games this article covers, shown with Steam's own
      // embeddable store widget (see SteamWidget.astro). Art loads from Steam; nothing is re-hosted.
      steamAppIds: z.array(z.number().int().positive()).max(3).optional(),
    }),
});

const siteSettings = defineCollection({
  loader: glob({ pattern: 'site-settings.json', base: './src/content' }),
  schema: z.object({
    siteName: z.string().default('GameNews'),
    tagline: z.string().default(''),
    businessLegalName: z.string().default(''),
    contactEmail: z.string().default(''),
    contactAddress: z.string().default(''),
    socialLinks: z.array(z.object({ platform: z.string(), url: z.string() })).default([]),
    analyticsProvider: z.enum(['none', 'plausible', 'ga4']).default('none'),
    analyticsId: z.string().default(''),
    cmpProvider: z.enum(['none', 'cookiebot', 'cookieyes', 'custom']).default('none'),
    cmpSiteId: z.string().default(''),
    cmpCustomScript: z.string().default(''),
    cmpConfiguredAndVerified: z.boolean().default(false),
    adsEnabled: z.boolean().default(false),
    adsensePublisherId: z.string().default(''),
    searchConsoleVerification: z.string().default(''),
    adUnitHomeMid: z.string().default(''),
    adUnitArticleBottom: z.string().default(''),
    adUnitAppBottom: z.string().default(''),
    adsTxtLines: z.string().default(''),
  }),
});

const legalAbout = defineCollection({
  loader: glob({ pattern: 'about.mdoc', base: './src/content/legal' }),
  schema: z.object({
    seoTitle: z.string().default(''),
    seoDescription: z.string().default(''),
  }),
});

const legalPrivacy = defineCollection({
  loader: glob({ pattern: 'privacy.mdoc', base: './src/content/legal' }),
  schema: z.object({
    seoTitle: z.string().default(''),
    seoDescription: z.string().default(''),
    policyReviewDate: z.coerce.date().optional(),
  }),
});

const legalTerms = defineCollection({
  loader: glob({ pattern: 'terms.mdoc', base: './src/content/legal' }),
  schema: z.object({
    seoTitle: z.string().default(''),
    seoDescription: z.string().default(''),
  }),
});

export const collections = {
  categories,
  authors,
  apps,
  articles,
  siteSettings,
  legalAbout,
  legalPrivacy,
  legalTerms,
};
