export interface SteamListingFacts {
  comingSoon: boolean;
  releaseDate: string;
  platforms: Array<'windows' | 'mac' | 'linux'>;
  free: boolean;
}

const datePattern = /^[A-Za-z0-9][A-Za-z0-9 ,.'-]{0,39}$/;
const platformLabels: Record<SteamListingFacts['platforms'][number], string> = { windows: 'Windows', mac: 'macOS', linux: 'Linux' };

export function isStoreDate(value: string): boolean {
  return datePattern.test(value);
}

export function listingLine(listing: SteamListingFacts & { name: string }): string {
  const names = listing.platforms.map((platform) => platformLabels[platform]);
  const platforms = names.length ? names.join(', ') : 'none listed for Windows, macOS, or Linux';
  const status = listing.comingSoon ? 'upcoming' : 'released';
  const price = listing.free ? 'free' : 'paid';
  return `Steam lists ${listing.name} as ${status} and ${price}. Platforms: ${platforms}. Store date: ${listing.releaseDate}.`;
}

export function sameWatchFacts(left: SteamListingFacts, right: SteamListingFacts): boolean {
  const key = (facts: SteamListingFacts) => [...facts.platforms].sort().join('\n');
  return left.comingSoon === right.comingSoon
    && left.releaseDate === right.releaseDate
    && left.free === right.free
    && key(left) === key(right);
}
