/** A version token only when the publisher title already contains one, such as 7.41f. */
export function patchToken(title: string): string | undefined {
  return title.match(/\b\d+\.\d+[a-z]?\b/i)?.[0];
}

/** Link text that distinguishes same-titled briefs by the publisher date or patch token. */
export function briefAnchor(game: string, title: string, dateLabel: string): string {
  const patch = patchToken(title);
  if (patch) return `Open the official ${game} ${patch} announcement`;
  const tokens = (value: string) => value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word && !['the', 'a', 'of', 'and'].includes(word));
  const gameWords = tokens(game);
  const titleWords = new Set(tokens(title));
  const shared = gameWords.filter((word) => titleWords.has(word)).length;
  if (title.toLowerCase().startsWith(game.toLowerCase()) || shared >= Math.min(2, gameWords.length)) {
    return `Open the official announcement: ${title} (${dateLabel})`;
  }
  return `Open the official ${game} announcement: ${title}`;
}
