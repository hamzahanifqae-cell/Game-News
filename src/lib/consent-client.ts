// Runs in the browser. Implements Basic Consent Mode (see README "Consent &
// Analytics" for why this project chose Basic over Advanced): the GA4 tag
// is not injected at all until the visitor's chosen CMP reports analytics
// consent. Google AdSense was removed from this site; Adsterra ads load
// separately (see src/lib/adsterra.ts). Nothing here
// invents a TCF purpose mapping — it reads each CMP's own documented
// JavaScript event/object, exactly as their own docs show.

export interface ConsentGateConfig {
  cmpProvider: 'none' | 'cookiebot' | 'cookieyes' | 'custom';
  ga4MeasurementId: string | null;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    Cookiebot?: {
      consent?: { statistics?: boolean; marketing?: boolean };
    };
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

let analyticsLoaded = false;
function loadAnalytics(measurementId: string) {
  if (analyticsLoaded) return;
  analyticsLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', measurementId);
}

export function initConsentGate(config: ConsentGateConfig): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || gtag;

  function applyConsent(analyticsGranted: boolean, adsGranted: boolean) {
    gtag('consent', 'update', {
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage: adsGranted ? 'granted' : 'denied',
      ad_user_data: adsGranted ? 'granted' : 'denied',
      ad_personalization: adsGranted ? 'granted' : 'denied',
    });
    if (analyticsGranted && config.ga4MeasurementId) loadAnalytics(config.ga4MeasurementId);
  }

  if (config.cmpProvider === 'cookiebot') {
    // Cookiebot's own documented API: https://www.cookiebot.com (CookiebotOnConsentReady
    // fires once on initial load, whether from a fresh submission or an existing cookie;
    // CookiebotOnAccept/CookiebotOnDecline cover later changes via the preference banner).
    const readFromCookiebot = () => {
      const consent = window.Cookiebot?.consent;
      if (!consent) return;
      applyConsent(Boolean(consent.statistics), Boolean(consent.marketing));
    };
    window.addEventListener('CookiebotOnConsentReady', readFromCookiebot);
    window.addEventListener('CookiebotOnAccept', readFromCookiebot);
    window.addEventListener('CookiebotOnDecline', readFromCookiebot);
  } else if (config.cmpProvider === 'cookieyes') {
    // CookieYes's own documented event: https://www.cookieyes.com/documentation/events-on-cookie-banner-interactions/
    document.addEventListener('cookieyes_consent_update', (event) => {
      const detail = (event as CustomEvent<{ accepted?: string[]; rejected?: string[] }>).detail;
      const accepted = detail?.accepted ?? [];
      applyConsent(accepted.includes('analytics'), accepted.includes('advertisement'));
    });
  }
  // 'custom' and 'none': intentionally no automatic wiring. We don't know a
  // custom CMP's event shape, and inventing one would be exactly the kind of
  // unvalidated mapping this project avoids — see README "Consent & CMP".
  // Analytics simply won't load for those providers until this file is
  // extended with that CMP's own documented event.
}
