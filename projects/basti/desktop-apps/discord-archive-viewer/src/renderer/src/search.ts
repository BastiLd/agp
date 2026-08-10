import type { ChannelModel, SearchHit, SearchQuery } from '../../shared/types';

export function executeSearch(
  query: SearchQuery,
  loadedChannels: Map<string, ChannelModel>,
  channelMetaList: Array<{ id: string; displayName: string }>,
  cap = 500,
): { hits: SearchHit[]; truncated: boolean; error?: string } {
  // Datumsbereich-Validierung
  if (query.dateFrom && query.dateTo && new Date(query.dateFrom) > new Date(query.dateTo)) {
    return { hits: [], truncated: false, error: '„Von"-Datum liegt nach „Bis"-Datum.' };
  }

  const text = query.text.trim();
  const hasText = text.length > 0;
  const hasAuthor = query.author.trim().length > 0;
  const hasFrom = !!query.dateFrom;
  const hasTo = !!query.dateTo;

  const fromTs = hasFrom ? new Date(query.dateFrom + 'T00:00:00').getTime() : -Infinity;
  const toTs = hasTo ? new Date(query.dateTo + 'T23:59:59').getTime() : Infinity;

  if (!hasText && !hasAuthor && !hasFrom && !hasTo) {
    return { hits: [], truncated: false };
  }

  const cmpText = (a: string) =>
    query.caseSensitive ? a.includes(text) : a.toLowerCase().includes(text.toLowerCase());

  const targetChannelIds: string[] =
    query.scope === 'current' && query.currentChannelId ? [query.currentChannelId] : [...loadedChannels.keys()];

  const hits: SearchHit[] = [];
  const channelMetaById = new Map(channelMetaList.map((m) => [m.id, m] as const));

  for (const cid of targetChannelIds) {
    const ch = loadedChannels.get(cid);
    if (!ch) continue;
    const meta = channelMetaById.get(cid);
    for (const m of ch.messages) {
      if (hasText && !cmpText(m.content)) continue;
      if (hasAuthor) {
        const a = query.author.trim();
        if (m.authorName !== a && m.authorId !== a) continue;
      }
      if (hasFrom || hasTo) {
        if (!m.timestamp) continue;
        const ts = Date.parse(m.timestamp);
        if (Number.isNaN(ts)) continue;
        if (ts < fromTs || ts > toTs) continue;
      }
      const excerpt = m.content.length > 160 ? m.content.slice(0, 160) + '…' : m.content;
      hits.push({
        channelId: cid,
        channelDisplayName: meta?.displayName ?? ch.displayName,
        messageId: m.id,
        authorName: m.authorName,
        timestamp: m.timestamp,
        contentExcerpt: excerpt,
      });
      if (hits.length >= cap + 1) break;
    }
    if (hits.length >= cap + 1) break;
  }
  const truncated = hits.length > cap;
  if (truncated) hits.length = cap;
  return { hits, truncated };
}
