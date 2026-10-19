import type { CollectionEntry } from 'astro:content';

export type AdPlacement = 'homeMid' | 'articleBottom' | 'appBottom';

type Settings = CollectionEntry<'siteSettings'>['data'];

const placementField: Record<AdPlacement, keyof Settings> = {
  homeMid: 'adUnitHomeMid',
  articleBottom: 'adUnitArticleBottom',
  appBottom: 'adUnitAppBottom',
};

/** AdSense ad-unit ("slot") IDs are numeric, typically 10 digits. */
function isValidAdUnitId(value: string): boolean {
  return /^\d{6,16}$/.test(value.trim());
}

function isValidPublisherId(value: string): boolean {
  return /^ca-pub-\d{10,20}$/.test(value.trim());
}

/**
 * Per-provider required-field check. "cmpConfiguredAndVerified" is an
 * operator's manual attestation, not proof of anything — this function is
 * what stops a contradictory state (verified=true with provider=none, or a
 * provider selected with no site ID) from ever counting as valid, regardless
 * of what the checkbox says.
 */
export function isCmpConfigValid(settings: Settings): boolean {
  switch (settings.cmpProvider) {
    case 'none':
      return false;
    case 'cookiebot':
    case 'cookieyes':
      return settings.cmpSiteId.trim().length > 0;
    case 'custom':
      return settings.cmpCustomScript.trim().length > 0;
    default:
      return false;
  }
}

/**
 * Master gate: true only when ad serving is explicitly enabled, the
 * publisher ID looks valid, and the consent setup is both attested AND
 * structurally valid for the selected provider. All of these are required —
 * see Site Settings for what each means. This does not mean any ad request
 * has actually been sent: see src/lib/consent-client.ts for the per-visitor
 * consent gate that controls that at runtime.
 */
export function adsMasterEnabled(settings: Settings): boolean {
  return (
    settings.adsEnabled &&
    isValidPublisherId(settings.adsensePublisherId) &&
    settings.cmpConfiguredAndVerified &&
    isCmpConfigValid(settings)
  );
}

/**
 * Resolves whether a specific placement should render, and with which
 * ad-unit ID. Returns null if the master gate is off, this specific page is
 * not ad-eligible, or this placement has no valid ad-unit ID configured —
 * callers should render nothing at all, not a placeholder.
 */
export function resolveAdSlot(
  settings: Settings,
  placement: AdPlacement,
  pageEligible: boolean
): { publisherId: string; adUnitId: string } | null {
  if (!pageEligible) return null;
  if (!adsMasterEnabled(settings)) return null;
  const adUnitId = String(settings[placementField[placement]] ?? '');
  if (!isValidAdUnitId(adUnitId)) return null;
  return { publisherId: settings.adsensePublisherId, adUnitId };
}
