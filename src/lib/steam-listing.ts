import snapshot from '../data/news-snapshot.json' with { type: 'json' };
import records from '../data/steam-listings.json' with { type: 'json' };
import { isOfficialNewsUrl, newsGames, normalizeNews, type NewsItem } from './news.ts';
import { isStoreDate, type SteamListingFacts } from './steam-listing-copy.ts';

export { isStoreDate, listingLine, sameWatchFacts } from './steam-listing-copy.ts';
export type { SteamListingFacts } from './steam-listing-copy.ts';

export const watchedStoreApps = [
  {
    appId: 4115450,
    slug: 'phantom-blade-zero',
    name: 'Phantom Blade Zero',
    storeUrl: 'https://store.steampowered.com/app/4115450/Phantom_Blade_Zero/',
  },
] as const;

export interface SteamWatch extends SteamListingFacts {
  appId: number;
  name: string;
  storeUrl: string;
  checkedAt: string;
  listingStale: boolean;
  posts: NewsItem[];
  postsCheckedAt: string;
  postsStale: boolean;
}

const platformOrder = ['windows', 'mac', 'linux'] as const;

export function normalizeSteamListing(raw: unknown, app: (typeof watchedStoreApps)[number]): SteamListingFacts | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const entry = (raw as Record<string, unknown>)[String(app.appId)];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
  if ((entry as { success?: unknown }).success !== true) return;
  const data = (entry as { data?: unknown }).data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return;
  const record = data as Record<string, unknown>;
  if (record.steam_appid !== app.appId || record.name !== app.name || typeof record.is_free !== 'boolean') return;
  const release = record.release_date;
  if (!release || typeof release !== 'object' || Array.isArray(release)) return;
  const dated = release as { coming_soon?: unknown; date?: unknown };
  if (typeof dated.coming_soon !== 'boolean' || typeof dated.date !== 'string' || !isStoreDate(dated.date)) return;
  const platforms = record.platforms;
  if (!platforms || typeof platforms !== 'object' || Array.isArray(platforms)) return;
  const flags = platforms as Record<string, unknown>;
  if (flags.windows !== undefined && typeof flags.windows !== 'boolean') return;
  if (flags.mac !== undefined && typeof flags.mac !== 'boolean') return;
  if (flags.linux !== undefined && typeof flags.linux !== 'boolean') return;
  return {
    comingSoon: dated.coming_soon,
    releaseDate: dated.date,
    free: record.is_free,
    platforms: platformOrder.filter((platform) => flags[platform] === true),
  };
}

function savedPosts(name: string): NewsItem[] {
  return snapshot.items
    .filter((item) => item.game === name && isOfficialNewsUrl(item.url))
    .slice(0, 4)
    .map((item) => ({ id: item.id, game: item.game, title: item.title, url: item.url, publishedAt: item.publishedAt }));
}

function savedWatch(app: (typeof watchedStoreApps)[number]): SteamWatch {
  const saved = records[String(app.appId) as keyof typeof records];
  return {
    appId: app.appId,
    name: app.name,
    storeUrl: app.storeUrl,
    comingSoon: saved.comingSoon,
    releaseDate: saved.releaseDate,
    platforms: saved.platforms.filter((platform): platform is SteamListingFacts['platforms'][number] => platform === 'windows' || platform === 'mac' || platform === 'linux'),
    free: saved.free,
    checkedAt: saved.checkedAt,
    listingStale: true,
    posts: savedPosts(app.name),
    postsCheckedAt: snapshot.checkedAt,
    postsStale: true,
  };
}

function publicPosts(items: NewsItem[]): NewsItem[] {
  return items.map(({ id, game, title, url, publishedAt }) => ({ id, game, title, url, publishedAt }));
}

export function createSteamWatchService(fetcher: typeof fetch = fetch, clock = Date.now) {
  const cache = new Map<number, { watch: SteamWatch; expiresAt: number }>();
  const pending = new Map<number, Promise<SteamWatch>>();
  async function refresh(app: (typeof watchedStoreApps)[number]): Promise<SteamWatch> {
    const now = clock();
    const saved = savedWatch(app);
    const detailsUrl = new URL('https://store.steampowered.com/api/appdetails');
    detailsUrl.search = new URLSearchParams({ appids: String(app.appId), l: 'english' }).toString();
    const newsUrl = new URL('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/');
    newsUrl.search = new URLSearchParams({ appid: String(app.appId), count: '4', maxlength: '0', feeds: 'steam_community_announcements', format: 'json' }).toString();
    const game = newsGames.find((item) => item.appId === app.appId);
    const [detailsResult, newsResult] = await Promise.allSettled([
      fetcher(detailsUrl, { signal: AbortSignal.timeout(8000) }).then(async (response) => {
        if (!response.ok) throw new Error('Store listing unavailable');
        return normalizeSteamListing(await response.json(), app);
      }),
      fetcher(newsUrl, { signal: AbortSignal.timeout(8000) }).then(async (response) => {
        if (!response.ok || !game) throw new Error('Publisher feed unavailable');
        const raw = await response.json();
        if (!Array.isArray(raw?.appnews?.newsitems)) throw new Error('Invalid publisher feed');
        return normalizeNews(raw, game, now).toSorted((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt)).slice(0, 4);
      }),
    ]);
    const details = detailsResult.status === 'fulfilled' ? detailsResult.value : undefined;
    const posts = newsResult.status === 'fulfilled' ? newsResult.value : undefined;
    const checked = new Date(now).toISOString();
    return {
      appId: app.appId,
      name: app.name,
      storeUrl: app.storeUrl,
      comingSoon: details?.comingSoon ?? saved.comingSoon,
      releaseDate: details?.releaseDate ?? saved.releaseDate,
      platforms: details?.platforms ?? saved.platforms,
      free: details?.free ?? saved.free,
      checkedAt: details ? checked : saved.checkedAt,
      listingStale: !details,
      posts: publicPosts(posts ?? saved.posts),
      postsCheckedAt: posts ? checked : saved.postsCheckedAt,
      postsStale: !posts,
    };
  }
  return async (appId: number): Promise<SteamWatch | undefined> => {
    const app = watchedStoreApps.find((item) => item.appId === appId);
    if (!app) return;
    const saved = cache.get(appId);
    if (saved && clock() < saved.expiresAt) return saved.watch;
    const current = pending.get(appId);
    if (current) return current;
    const request = refresh(app).then((watch) => {
      cache.set(appId, { watch, expiresAt: clock() + ((watch.listingStale || watch.postsStale) ? 60_000 : 15 * 60_000) });
      return watch;
    }).finally(() => { pending.delete(appId); });
    pending.set(appId, request);
    return request;
  };
}

export const getSteamWatch = createSteamWatchService();
