export interface Guild {
  id: string;
  name: string;
  iconUrl: string | null;
}

export interface Channel {
  id: string;
  type: string;
  name: string;
  topic: string | null;
  category: string | null;
}

export interface Author {
  id: string;
  name: string;
  discriminator: string;
  nickname: string | null;
  color: string | null;
  avatarUrl: string;
  isBot: boolean;
}

export interface Attachment {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
}

export interface EmbedField {
  name: string;
  value: string;
  isInline: boolean;
}

export interface Embed {
  title: string | null;
  description: string | null;
  url: string | null;
  timestamp: string | null;
  color: string | null;
  thumbnail: { url: string } | null;
  image: { url: string } | null;
  author: { name: string; url?: string; iconUrl?: string } | null;
  fields: EmbedField[];
  footer: { text: string; iconUrl?: string } | null;
}

export interface ReactionEmoji {
  id: string | null;
  name: string;
  isAnimated: boolean;
}

export interface Reaction {
  emoji: ReactionEmoji;
  count: number;
}

export interface Reference {
  messageId: string;
  channelId: string;
  guildId: string;
}

export interface Message {
  id: string;
  type: string;
  timestamp: string;
  timestampEdited: string | null;
  callEndedTimestamp: string | null;
  isPinned: boolean;
  content: string;
  author: Author;
  attachments: Attachment[];
  embeds: Embed[];
  reactions: Reaction[];
  mentions: { id: string; name: string }[];
  reference: Reference | null;
}

export interface ChannelData {
  channelInfo: Channel;
  messages: Message[];
  guildInfo: Guild | null;
}

export interface ImportState {
  channels: Record<string, ChannelData>; // key is channel ID
  assetMap: Record<string, File>; // key is filename or path suffix, value is File
  isLoading: boolean;
  error: string | null;
}
