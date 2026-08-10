import type { ChannelModel, ChannelStats } from '../../shared/types';
import { dayKey, classifyFileName } from './format';

const STOP_WORDS = new Set<string>([
  'aber','also','auch','beim','beim','dann','dass','denn','doch','eine','einem','einen','einer','eines',
  'etwa','etwas','euch','euer','eure','genau','gibt','habe','haben','hatte','hier','immer','jede','jeden',
  'jedoch','kann','kein','keine','kommt','könnte','machen','mehr','mein','meine','mich','mir','muss',
  'nach','nichts','noch','oder','ohne','sehr','sein','seine','sich','sind','soll','sollen','steht',
  'über','und','unter','viel','vielleicht','vom','von','war','warum','was','weil','wenn','werde','werden',
  'wieder','wird','wirklich','wirst','wohl','würde','würden','zwei','zwischen','beim',
  'this','that','have','with','from','they','their','there','about','your','yours','will','just','what',
  'when','where','which','would','could','should','because','still','then','than','these','those','some',
  'into','like','only','more','also','been','were','here','really','make','made','very','well','much',
  'most','many','same','take','took','want','need','know','knew','again','ever','even','still','first',
  'last','next','over','under','before','after','through','around','between',
]);

export function computeStats(ch: ChannelModel): ChannelStats {
  const authors = new Map<string, { count: number; avatarUrl: string }>();
  const reactions = new Map<string, { count: number; imageUrl: string }>();
  const att = { images: 0, gifs: 0, videos: 0, audio: 0, other: 0 };
  const perDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  const perHour = new Array(24).fill(0);
  const perDay = new Map<string, number>();
  const wordMap = new Map<string, number>();
  let totalAttachments = 0;
  let totalReactions = 0;
  let totalEmbeds = 0;

  for (const m of ch.messages) {
    const a = m.authorName || 'Unbekannt';
    const cur = authors.get(a);
    if (cur) cur.count++;
    else authors.set(a, { count: 1, avatarUrl: m.authorAvatar });

    for (const att1 of m.attachments) {
      totalAttachments++;
      const k = classifyFileName(att1.fileName || att1.url);
      if (k === 'image') att.images++;
      else if (k === 'gif') att.gifs++;
      else if (k === 'video') att.videos++;
      else if (k === 'audio') att.audio++;
      else att.other++;
    }
    for (const r of m.reactions) {
      totalReactions += r.count;
      const key = r.emojiName || r.emojiId || '?';
      const e = reactions.get(key);
      if (e) e.count += r.count;
      else reactions.set(key, { count: r.count, imageUrl: r.emojiImageUrl });
    }
    totalEmbeds += m.embeds.length;

    if (m.timestamp) {
      const d = new Date(m.timestamp);
      if (!Number.isNaN(d.getTime())) {
        perDayOfWeek[d.getDay()]++;
        perHour[d.getHours()]++;
        const k = dayKey(m.timestamp);
        perDay.set(k, (perDay.get(k) ?? 0) + 1);
      }
    }

    // Wortzählung — kurze Stoppwörter raus
    const words = (m.content || '').toLowerCase()
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[^a-zäöüß0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
    for (const w of words) wordMap.set(w, (wordMap.get(w) ?? 0) + 1);
  }

  const topWords = [...wordMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  const topAuthors = [...authors.entries()]
    .map(([name, v]) => ({ name, count: v.count, avatarUrl: v.avatarUrl }))
    .sort((a, b) => b.count - a.count).slice(0, 10);
  const topReactions = [...reactions.entries()]
    .map(([name, v]) => ({ name, count: v.count, imageUrl: v.imageUrl }))
    .sort((a, b) => b.count - a.count).slice(0, 10);
  const perDayArr = [...perDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  return {
    totalMessages: ch.messages.length,
    totalAttachments,
    totalReactions,
    totalEmbeds,
    uniqueAuthors: authors.size,
    firstAt: ch.firstMessageAt,
    lastAt: ch.lastMessageAt,
    topAuthors,
    topReactions,
    attachmentTypes: att,
    perDayOfWeek,
    perHour,
    perDay: perDayArr,
    topWords,
  };
}
