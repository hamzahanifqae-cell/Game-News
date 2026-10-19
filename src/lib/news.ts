import snapshot from '../data/news-snapshot.json' with { type: 'json' };

export const newsGames = [
  { appId: 2769570, slug: 'fable', name: 'Fable' },
  { appId: 4115450, slug: 'phantom-blade-zero', name: 'Phantom Blade Zero' },
  { appId: 1884870, slug: 'the-wolf-among-us-2', name: 'The Wolf Among Us 2' },
  { appId: 730, slug: 'counter-strike-2', name: 'Counter-Strike 2' },
  { appId: 570, slug: 'dota-2', name: 'Dota 2' },
  { appId: 578080, slug: 'pubg-battlegrounds', name: 'PUBG: BATTLEGROUNDS' },
];
export interface NewsItem { id: string; game: string; title: string; url: string; publishedAt: string; preview?: string }
export interface NewsFeed { items: NewsItem[]; checkedAt: string; stale: boolean; partial: boolean }
const allowedHosts = new Set(['steamcommunity.com', 'store.steampowered.com', 'steamstore-a.akamaihd.net']);

// Never render upstream HTML or use an untrusted redirect destination.
export function normalizeNews(raw: unknown, game: typeof newsGames[number], now: number): NewsItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const items = (raw as { appnews?: { newsitems?: unknown } }).appnews?.newsitems;
  if (!Array.isArray(items)) return [];
  return items.flatMap(item => {
    if (!item || item.feedname !== 'steam_community_announcements' || typeof item.gid !== 'string' || !/^\d{1,24}$/.test(item.gid) || typeof item.title !== 'string' || !item.title.trim() || !Number.isFinite(item.date) || item.date <= 0 || item.date * 1000 > now) return [];
    try {
      const url = new URL(item.url);
      if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname) || url.username || url.password) return [];
      return [{id: `${game.appId}:${String(item.gid)}`, game: game.name, title: item.title.trim().slice(0, 240), url: url.href, publishedAt: new Date(item.date * 1000).toISOString(), preview: sourcePreview(item.contents, item.title)}];
    } catch { return []; }
  });
}

export function createNewsService(fetcher: typeof fetch = fetch, clock = Date.now) {
  let cache: NewsFeed | undefined;
  let expiresAt = 0;
  let pending: Promise<NewsFeed> | undefined;
  async function refresh(): Promise<NewsFeed> {
    const now = clock();
    const results = await Promise.allSettled(newsGames.map(async game => {
      const url = new URL('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/');
      url.search = new URLSearchParams({appid: String(game.appId), count: '4', maxlength: '0', feeds: 'steam_community_announcements', format: 'json'}).toString();
      const response = await fetcher(url, {signal: AbortSignal.timeout(8000)});
      if (!response.ok) throw new Error('Publisher feed unavailable');
      const raw = await response.json();
      if (!Array.isArray(raw?.appnews?.newsitems)) throw new Error('Invalid publisher feed');
      return {game, items: normalizeNews(raw, game, now)};
    }));
    const succeeded = results.filter(r => r.status === 'fulfilled');
    const previous = cache || snapshot;
    if (!succeeded.length) return {...previous, stale: true, partial: true};
    const items = results.flatMap((result, index) => result.status === 'fulfilled' ? result.value.items : previous.items.filter(item => item.game === newsGames[index].name));
    const unique = [...new Map(items.map(item => [item.id, item])).values()].sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 18);
    return {items: unique, checkedAt: new Date(now).toISOString(), stale: false, partial: succeeded.length !== newsGames.length};
  }
  return async (): Promise<NewsFeed> => {
    if (cache && clock() < expiresAt) return cache;
    if (!pending) pending = refresh().then(feed => {
      cache = feed;
      expiresAt = clock() + (feed.stale || feed.partial ? 60_000 : 15 * 60_000);
      return feed;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}
export const getNews = createNewsService();


// Keep quotations short; publisher content is never treated as GameNews reporting.
export function sourcePreview(contents: unknown, title: string): string {
  if (typeof contents !== 'string') return '';
  const text = contents.replace(/\\/g, '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\[img\][\s\S]*?\[\/img\]/gi, ' ').replace(/\[url=[^\]]*\]/gi, '').replace(/\[\/?[^\]]+\]/g, ' ').replace(/https?:\/\/\S+/g, '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&[^; ]+;/g,' ').replace(/\s+/g,' ').trim();
  const budget = Math.max(0, Math.min(18, 25 - title.trim().split(/\s+/).length));
  const words = text.split(/\s+/);
  return budget ? words.slice(0,budget).join(' ') + (words.length > budget ? '…' : '') : '';
}
export function newsPath(item: NewsItem): string {
  const [appId, gid] = item.id.split(':');
  return `/updates/${appId}/${Math.floor(Date.parse(item.publishedAt)/1000)}-${gid}`;
}
export async function getNewsStory(path: string): Promise<NewsItem | undefined> {
  const match = /^(\d{1,10})\/(\d{1,12})-(\d{1,24})$/.exec(path);
  if (!match) return;
  const [, appId, stamp, gid] = match;
  const game = newsGames.find(g => String(g.appId) === appId);
  const seconds = Number(stamp);
  if (!game || seconds <= 0 || seconds > Date.now()/1000) return;
  const saved = (await getNews()).items.find(item => item.id === `${appId}:${gid}`);
  if (saved && Math.floor(Date.parse(saved.publishedAt)/1000) === seconds) return saved;
  // Timestamped URLs let older posts remain resolvable after they leave the recent list.
  try {
    const url = new URL('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/');
    url.search = new URLSearchParams({appid:appId,count:'5',maxlength:'0',feeds:'steam_community_announcements',enddate:String(seconds+1),format:'json'}).toString();
    const response = await fetch(url, {signal:AbortSignal.timeout(8000)});
    if (!response.ok) return;
    const item = normalizeNews(await response.json(), game, Date.now()).find(item => item.id === `${appId}:${gid}`);
    if (item && Math.floor(Date.parse(item.publishedAt)/1000) === seconds) return item;
  } catch { return; }
}
