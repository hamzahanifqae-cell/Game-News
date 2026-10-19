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
      platforms: z.array(z.enum(['android', 'ios', 'windows', 'macos', 'web'])).default([]),
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
