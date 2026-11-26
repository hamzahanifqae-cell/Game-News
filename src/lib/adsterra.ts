/**
 * Adsterra ad units for gamenews.online. Keys and script URLs are copied exactly from the
 * Adsterra publisher dashboard; do not edit them by hand.
 */
export const ADSTERRA_BANNER_SRC = 'https://bauval.org/22/';

export const adsterraBanners = {
  rectangle300x250: { adKey: '21bf474dbffc92988bb7df0ccd7a3c9a', width: 300, height: 250 },
  leaderboard728x90: { adKey: 'f683e4b4dfdd6983cc7e031675873224', width: 728, height: 90 },
  banner468x60: { adKey: '340eaf14a9c4add067bf30e0fa4d5b6a', width: 468, height: 60 },
  skyscraper160x300: { adKey: '6a454de7ad4048cab6262213828ae077', width: 160, height: 300 },
  mobile320x50: { adKey: 'c995545aa0911bcfba0024e35243e7e2', width: 320, height: 50 },
  skyscraper160x600: { adKey: '6e2ba1566faca611ba801d7f972350c1', width: 160, height: 600 },
} as const;

export const ADSTERRA_NATIVE_KEY = '35c5a9c688f86175f1dc3564314841f1';
export const ADSTERRA_NATIVE_SRC = `https://bauval.org/21/${ADSTERRA_NATIVE_KEY}`;
export const ADSTERRA_SOCIAL_BAR_SRC = 'https://bauval.org/14/95c729b5549baaeeb40fef353746d16b';
export const ADSTERRA_POPUNDER_SRC = 'https://abscloud.org/1/6649a7867620c86f9602d32cffc94979';

/** Breakpoints used by the placements (match Tailwind md and lg). */
export const AD_MEDIA = {
  desktop: '(min-width: 768px)',
  mobile: '(max-width: 767.98px)',
  wide: '(min-width: 1024px)',
} as const;
