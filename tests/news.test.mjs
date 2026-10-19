import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNews, createNewsService, newsGames } from '../src/lib/news.ts';
const now = Date.UTC(2026,9,15,12);
const item = {gid:'1',title:'An official update',date:Math.floor(now/1000)-60,url:'https://steamcommunity.com/games/730/announcements/detail/1',feedname:'steam_community_announcements',contents:'<script>untrusted body</script>'};
const payload = entries => ({appnews:{newsitems:entries}});
test('accepts official metadata, excludes bodies and rejects untrusted/future posts', () => {
  const clean=normalizeNews(payload([item,{...item,url:'javascript:alert(1)'},{...item,url:'https://example.org/'},{...item,feedname:'pcgamer'},{...item,date:now/1000+10}]),newsGames[0],now);
  assert.equal(clean.length,1);assert.equal(clean[0].title,item.title);assert.equal('contents' in clean[0],false);
});
test('coalesces requests, caches success, and refreshes after fifteen minutes', async () => {
  let calls=0,time=now;
  const service=createNewsService(async () => {calls++;return Response.json(payload([item]));},()=>time);
  const [a,b]=await Promise.all([service(),service()]);
  assert.equal(calls,6);assert.deepEqual(a,b);assert.equal(a.stale,false);
  await service();assert.equal(calls,6);
  time+=15*60_000+1;await service();assert.equal(calls,12);
});
test('outage preserves the last good publication and check dates', async () => {
  let fail=false,time=now;
  const service=createNewsService(async () => {if(fail)throw Error('offline');return Response.json(payload([item]));},()=>time);
  const good=await service();fail=true;time+=16*60_000;
  const fallback=await service();assert.equal(fallback.stale,true);assert.equal(fallback.checkedAt,good.checkedAt);assert.deepEqual(fallback.items,good.items);
});
test('partial failure retains that game’s saved items and shows partial status', async () => {
  let fail=false,time=now;
  const service=createNewsService(async url => {if(fail && new URL(url).searchParams.get('appid')==='730')throw Error('offline');return Response.json(payload([item]));},()=>time);
  await service();fail=true;time+=16*60_000;const feed=await service();
  assert.equal(feed.partial,true);assert.equal(feed.stale,false);assert.equal(feed.items.some(i=>i.game==='Counter-Strike 2'),true);
});
test('cold outage uses an explicitly stale saved snapshot', async () => {
  const service=createNewsService(async () => {throw Error('offline');},()=>now);
  const feed=await service();assert.equal(feed.stale,true);assert.ok(feed.items.length>0);
});

test('preview has a bounded quotation budget and removes source markup', async () => {
  const {sourcePreview,newsPath,getNewsStory}=await import('../src/lib/news.ts');
  const preview=sourcePreview('[b]one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty[/b]','Short update');
  assert.ok(preview.split(/\s+/).length<=18);assert.equal(preview.includes('[b]'),false);
  assert.equal(newsPath({id:'730:123',publishedAt:'2026-10-14T00:00:00Z'}),'/updates/730/1791936000-123');
  assert.equal(await getNewsStory('999999/12-123'),undefined);assert.equal(await getNewsStory('../../bad'),undefined);
});
