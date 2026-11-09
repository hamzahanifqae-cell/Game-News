import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { googleConsentMessageSrc } from '../src/lib/ads.ts';

const id = 'ca-pub-4998739298306378';
const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${id}`;

test('the AdSense tag is available for Google’s published message and does not request an ad', () => {
  assert.equal(googleConsentMessageSrc(id, '/', 'none'), src);
  assert.equal(googleConsentMessageSrc(id, '/news/gta-vi-release-watchlist', 'none'), src);
  assert.equal(src.includes('enable_page_level_ads'), false);
});

test('the page does not invent a consent namespace and the privacy control calls Google’s revocation message', () => {
  const consent = readFileSync(new URL('../src/components/ConsentScripts.astro', import.meta.url), 'utf8');
  const footer = readFileSync(new URL('../src/components/Footer.astro', import.meta.url), 'utf8');
  assert.equal(consent.includes('window.googlefc'), false);
  assert.equal(/pauseAdRequests\s*=/.test(consent), false);
  assert.match(footer, /googlefc\?\.showRevocationMessage/);
  assert.match(footer, /CONSENT_API_READY/);
  assert.equal(footer.includes('window.googlefc ='), false);
});

test('the privacy policy and a second consent tool do not get the AdSense tag', () => {
  assert.equal(googleConsentMessageSrc(id, '/privacy', 'none'), null);
  assert.equal(googleConsentMessageSrc(id, '/privacy/', 'none'), null);
  assert.equal(googleConsentMessageSrc(id, '/', 'cookiebot'), null);
  assert.equal(googleConsentMessageSrc('pub-1', '/', 'none'), null);
});
