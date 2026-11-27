/**
 * Adsterra ad units for gamenews.online. Keys and script URLs are copied exactly from the
 * Adsterra publisher dashboard; do not edit them by hand.
 */
export const ADSTERRA_BANNER_SRC = 'https://bauval.org/22/';

export const adsterraBanners = {
  rectangle300x250: { adKey: '81ef00acec5f2ca29511c1e20baf73c2', width: 300, height: 250 },
  leaderboard728x90: { adKey: '413bf59883af0d7558cecc6c92de9f51', width: 728, height: 90 },
  banner468x60: { adKey: '1d774ed4f30734de0240d5a23b164b82', width: 468, height: 60 },
  skyscraper160x300: { adKey: '2a5d66d6a0c4ab04c8bb1096009bbe1a', width: 160, height: 300 },
  mobile320x50: { adKey: '3a7f7915e0554ad378be5703366157e2', width: 320, height: 50 },
  skyscraper160x600: { adKey: '4fcafad22c758c511b79356003cd99ef', width: 160, height: 600 },
} as const;

export const ADSTERRA_NATIVE_KEY = '8a06355af567ff3c8b9f69df4cde6094';
export const ADSTERRA_NATIVE_SRC = `https://bauval.org/21/${ADSTERRA_NATIVE_KEY}`;
export const ADSTERRA_SOCIAL_BAR_SRC = 'https://bauval.org/14/06f205a60c274329d77187c6598a975a';
export const ADSTERRA_POPUNDER_SRC = 'https://abscloud.org/1/017f788aaa300a445c2e5f48e98f83ca';

/** Breakpoints used by the placements (match Tailwind md and lg). */
export const AD_MEDIA = {
  desktop: '(min-width: 768px)',
  mobile: '(max-width: 767.98px)',
  wide: '(min-width: 1024px)',
} as const;

/**
 * Inline JavaScript that writes an Adsterra tag into the page at this exact spot, unchanged,
 * but only when the visitor has not rejected advertising cookies (see ConsentBanner.astro,
 * which sets window.gnAdsAllowed in the <head>) and, if given, the media query matches.
 *
 * The tag HTML is passed base64-encoded so it needs no quote escaping (Markdoc escapes quotes,
 * and a literal "</script>" would end the surrounding script). document.write keeps Adsterra's
 * requirement that its scripts run where the ad appears, in page order.
 */
export function adsterraWriteScript(tagHtml: string, media?: string): string {
  const encoded = Buffer.from(tagHtml, 'utf8').toString('base64');
  const mediaCheck = media && media !== 'all' ? ` && window.matchMedia(\`${media}\`).matches` : '';
  return `if (window.gnAdsAllowed !== false${mediaCheck}) { document.write(atob(\`${encoded}\`)); }`;
}

/** Adsterra's banner tag exactly as the dashboard gives it. */
export function adsterraBannerTag(adKey: string, width: number, height: number): string {
  return `<script>
  atOptions = {
    'key' : '${adKey}',
    'format' : 'iframe',
    'height' : ${height},
    'width' : ${width},
    'params' : {}
  };
</script>
<script data-cfasync="false" src="${ADSTERRA_BANNER_SRC}${adKey}"></script>`;
}
