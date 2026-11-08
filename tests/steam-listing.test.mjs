import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSteamWatchService, listingLine, normalizeSteamListing, sameWatchFacts, watchedStoreApps } from '../src/lib/steam-listing.ts';
import { newsGames } from '../src/lib/news.ts';

const app = watchedStoreApps[0];
const now = Date.UTC(2026, 10, 8, 12);
const facts = { comingSoon: false, releaseDate: '28 Oct, 2026', platforms: ['windows'], free: false };
const details = (overrides = {}) => ({ [app.appId]: { success: true, data: {
  steam_appid: app.appId,
  name: app.name,
  is_free: false,
  release_date: { coming_soon: false, date: '28 Oct, 2026' },
  platforms: { windows: true, mac: false, linux: false },
  short_description: 'Copied store text',
  pc_requirements: { minimum: 'secret requirements' },
  price_overview: { final_formatted: '$39.99' },
  website: 'https://evil.example',
  ...overrides,
} } });
const post = { gid: '99', title: 'A new official post', date: Math.floor(now / 1000) - 60, url: 'https://steamcommunity.com/games/4115450/announcements/detail/99', feedname: 'steam_community_announcements', contents: '<b>copied announcement</b>' };

test('the watched store app is the same Phantom Blade Zero record as the news feed', () => {
  assert.deepEqual(newsGames.find((game) => game.appId === app.appId), { appId: app.appId, slug: app.slug, name: app.name });
});

test('listing text uses only structured store fields', () => {
  const clean = normalizeSteamListing(details(), app);
  assert.deepEqual(clean, facts);
  assert.equal(JSON.stringify(clean).includes('Copied'), false);
  assert.equal(JSON.stringify(clean).includes('39.99'), false);
  assert.equal(JSON.stringify(clean).includes('evil.example'), false);
  assert.equal(listingLine({ ...facts, name: app.name }), 'Steam lists Phantom Blade Zero as released and paid. Platforms: Windows. Store date: 28 Oct, 2026.');
});

test('rejects renamed, unmarked, or markup-bearing store fields', () => {
  assert.equal(normalizeSteamListing(details({ name: 'Other Game' }), app), undefined);
  assert.equal(normalizeSteamListing(details({ release_date: { coming_soon: false, date: '<script>' } }), app), undefined);
  assert.equal(normalizeSteamListing({ [app.appId]: { success: false } }, app), undefined);
  assert.equal(sameWatchFacts(facts, { ...facts, comingSoon: true }), false);
});

test('unknown apps are not fetched and a live check replaces the saved record for fifteen minutes', async () => {
  let calls = 0;
  let time = now;
  const service = createSteamWatchService(async (url) => {
    calls += 1;
    const address = new URL(url);
    if (address.hostname === 'store.steampowered.com') return Response.json(details());
    return Response.json({ appnews: { newsitems: [post] } });
  }, () => time);
  assert.equal(await service(1), undefined);
  assert.equal(calls, 0);
  const [first, second] = await Promise.all([service(app.appId), service(app.appId)]);
  assert.equal(calls, 2);
  assert.deepEqual(first, second);
  assert.equal(first.listingStale, false);
  assert.equal(first.postsStale, false);
  assert.equal(first.posts.length, 1);
  assert.equal('contents' in first.posts[0], false);
  assert.equal(first.posts[0].title, post.title);
  await service(app.appId);
  assert.equal(calls, 2);
  time += 15 * 60_000 + 1;
  await service(app.appId);
  assert.equal(calls, 4);
});

test('a store outage keeps the saved 8 November listing and saved posts', async () => {
  const service = createSteamWatchService(async () => { throw new Error('offline'); }, () => now);
  const watch = await service(app.appId);
  assert.equal(watch.listingStale, true);
  assert.equal(watch.postsStale, true);
  assert.equal(watch.checkedAt, '2026-11-08T00:00:00.000Z');
  assert.equal(watch.releaseDate, '28 Oct, 2026');
  assert.equal(watch.posts.length > 0, true);
  assert.equal(watch.storeUrl, app.storeUrl);
});
