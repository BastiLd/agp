export interface Wikilink {
  raw: string;
  target: string;
  alias?: string;
}

const WIKILINK_PATTERN = /\[\[([^\]\n]+)\]\]/g;

export function parseWikilinks(text: string): Wikilink[] {
  const links: Wikilink[] = [];
  for (const match of text.matchAll(WIKILINK_PATTERN)) {
    const rawTarget = match[1].trim();
    if (!rawTarget) continue;

    const [target, alias] = rawTarget.split('|').map((part) => part.trim());
    links.push({
      raw: match[0],
      target,
      alias: alias || undefined,
    });
  }

  return links;
}
