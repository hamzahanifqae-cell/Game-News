import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/**
 * Draft and sample content is visible in `astro dev` so editors can preview it,
 * but must never ship in a production build (sitemap, pages, or feeds).
 */
function isPublic(data: { draft?: boolean; sample?: boolean }): boolean {
  if (import.meta.env.PROD && data.sample) return false;
  if (data.draft) return false;
  return true;
}

/**
 * True when the game an article covers is out: either an editor set `released`, or the
 * official `releaseDate` is on or before `now`. Pages are prerendered, so `now` is the
 * build time; each deploy refreshes the Upcoming lists.
 */
export function hasReleased(
  data: { released?: boolean; releaseDate?: Date },
  now: Date = new Date()
): boolean {
  if (data.released) return true;
  return data.releaseDate !== undefined && data.releaseDate.valueOf() <= now.valueOf();
}

export async function getPublicCollection<C extends 'articles' | 'apps'>(collection: C) {
  const entries = (await getCollection(collection)).filter((entry) => isPublic(entry.data));
  if (collection !== 'articles') return entries;
  // Resolve the release status once so every page reads the same `data.released`.
  return (entries as CollectionEntry<'articles'>[]).map((entry) => ({
    ...entry,
    data: { ...entry.data, released: hasReleased(entry.data) },
  })) as typeof entries;
}

/**
 * Safe single-entry lookup for relations (an article's author, or a related
 * app) that applies the same publication rules as the listing queries.
 * Returns undefined for a missing, draft, or (in production) sample entry,
 * instead of surfacing sample/draft data on an otherwise-published page.
 */
export async function getPublicEntry<C extends 'apps' | 'authors'>(
  collection: C,
  id: string | undefined
): Promise<CollectionEntry<C> | undefined> {
  if (!id) return undefined;
  const entry = (await getEntry(collection, id)) as CollectionEntry<C> | undefined;
  if (!entry) return undefined;
  if (import.meta.env.PROD && entry.data.sample) return undefined;
  if ('draft' in entry.data && entry.data.draft) return undefined;
  return entry;
}

export function sortByPublishDateDesc<T extends CollectionEntry<'articles'>>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

/** Used by listing pages to decide page-level ad eligibility without duplicating the filter inline. */
export async function hasPublicArticlesOfType(
  type: CollectionEntry<'articles'>['data']['type']
): Promise<boolean> {
  const articles = await getPublicCollection('articles');
  return articles.some((a) => a.data.type === type);
}

export async function getSiteSettings() {
  const [entry] = await getCollection('siteSettings');
  return entry.data;
}

export async function getLegalPage<
  C extends 'legalAbout' | 'legalPrivacy' | 'legalTerms',
>(collection: C): Promise<CollectionEntry<C>> {
  const [entry] = await getCollection(collection);
  return entry as CollectionEntry<C>;
}

export async function getCategory(id: string | undefined) {
  if (!id) return undefined;
  return await getEntry('categories', id);
}
