// Gemeinsame Typen für Main, Preload und Renderer

export interface AttachmentModel {
  id: string;
  fileName: string;
  url: string;
  localPath: string | null;
  fileSizeBytes: number;
  mimeType: string;
}

export interface EmbedModel {
  title: string;
  description: string;
  url: string;
  color: number | null;
  timestamp: string | null;
  authorName: string;
  authorUrl: string;
  authorIconUrl: string;
  footerText: string;
  footerIconUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  fields: Array<{ name: string; value: string; inline: boolean }>;
}

export interface ReactionModel {
  emojiName: string;
  emojiId: string | null;
  emojiImageUrl: string;
  count: number;
  isAnimated: boolean;
}

export interface ReplyToModel {
  messageId: string;
  authorName: string;
  contentExcerpt: string;
}

export interface MessageModel {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string | null;
  editedTimestamp: string | null;
  content: string;
  attachments: AttachmentModel[];
  embeds: EmbedModel[];
  reactions: ReactionModel[];
  replyTo: ReplyToModel | null;
}

export interface UserModel {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface ChannelModel {
  id: string;
  folderPath: string;
  jsonFilePath: string;
  htmlFilePath: string | null;
  displayName: string;
  channelName: string;
  guildName: string;
  messageCount: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  users: UserModel[];
  messages: MessageModel[];
  warnings: string[];
}

export interface ChannelLoadError {
  filePath: string;
  errorType: 'json_invalid' | 'missing_required_fields' | 'io_error' | 'unknown';
  message: string;
}

export type FolderEntryKind = 'channel' | 'root';

export interface FolderEntry {
  id: string;
  kind: FolderEntryKind;
  path: string;
  addedAt: string;
  /** Anzeigename der Person, deren Nachrichten aus diesem Ordner stammen (z. B. bei Discords offiziellem Datenexport). */
  personLabel?: string;
}

export interface ScanResultChannelMeta {
  id: string;
  jsonFilePath: string;
  folderPath: string;
  htmlFilePath: string | null;
  channelName: string;
  guildName: string;
  displayName: string;
  messageCount: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  available: boolean;
  warnings: string[];
  /** Anzahl der Quell-Ordner (Personen), aus denen dieser Channel zusammengeführt wurde. */
  sourceCount?: number;
}

/** Eine einzelne Datenquelle für einen (ggf. zusammengeführten) Channel. */
export type ChannelSourceRef =
  | { format: 'dce'; jsonFilePath: string; folderPath: string }
  | {
      format: 'package';
      channelJsonPath: string;
      messagesJsonPath: string;
      folderPath: string;
      folderEntryId: string;
      personLabel: string;
      indexLabel?: string;
    };

export interface ScanResult {
  channels: ScanResultChannelMeta[];
  errors: ChannelLoadError[];
  scannedFolders: string[];
  skippedFolders: Array<{ path: string; reason: string }>;
  /** channelId -> alle Quellen, aus denen der Channel zusammengeführt wurde. */
  channelSources: Record<string, ChannelSourceRef[]>;
}

export type Density = 'compact' | 'cozy';
export type FontSize = 'small' | 'medium' | 'large';
export type ImageSize = 'small' | 'medium' | 'large' | 'huge' | 'native';
export type TimeFormat = '24h' | '12h';
export type AvatarShape = 'circle' | 'rounded' | 'square';

export interface ThemeOverride {
  accentColor?: string;
  fontSize?: FontSize;
  density?: Density;
}

export interface AppSettings {
  folders: FolderEntry[];
  theme: string;
  themeOverrides: Record<string, ThemeOverride>;
  density: Density;
  fontSize: FontSize;
  imageSize: ImageSize;
  timeFormat: TimeFormat;
  avatarShape: AvatarShape;
  sidebarWidth: number;
  pinnedChannelIds: string[];
  collapsedGuilds: string[];
  hiddenChannelIds: string[];
  autoHideEmptyChannels: boolean;
  showAttachmentFilters: boolean;
  groupConsecutiveMessages: boolean;
  hideBots: boolean;
  showReadingProgress: boolean;
  showAuthorColors: boolean;
  wallpaperOpacity: number; // 0..1
  showMessageDividers: boolean;
  stickyDayDividers: boolean;
  restoreScrollPosition: boolean;
  customCss: string;
  mascotEnabled: boolean;
  mascotPosition: { right: number; bottom: number };
  windowBounds: { x: number; y: number; width: number; height: number } | null;
}

export interface SearchQuery {
  text: string;
  caseSensitive: boolean;
  author: string;
  dateFrom: string | null;
  dateTo: string | null;
  scope: 'current' | 'global';
  currentChannelId: string | null;
}

export interface SearchHit {
  channelId: string;
  channelDisplayName: string;
  messageId: string;
  authorName: string;
  timestamp: string | null;
  contentExcerpt: string;
}

export interface ChannelStats {
  totalMessages: number;
  totalAttachments: number;
  totalReactions: number;
  totalEmbeds: number;
  uniqueAuthors: number;
  firstAt: string | null;
  lastAt: string | null;
  topAuthors: Array<{ name: string; count: number; avatarUrl: string }>;
  topReactions: Array<{ name: string; count: number; imageUrl: string }>;
  attachmentTypes: { images: number; gifs: number; videos: number; audio: number; other: number };
  perDayOfWeek: number[];
  perHour: number[];
  perDay: Array<{ date: string; count: number }>;
  topWords: Array<{ word: string; count: number }>;
}

export const IPC = {
  PICK_CHANNEL_FOLDERS: 'pick-channel-folders',
  PICK_ROOT_FOLDER: 'pick-root-folder',
  SCAN: 'scan-folders',
  RESCAN: 'rescan-folders',
  GET_REGISTERED_FOLDERS: 'get-registered-folders',
  REMOVE_FOLDER: 'remove-folder',
  UPDATE_FOLDER: 'update-folder',
  LOAD_CHANNEL: 'load-channel',
  OPEN_HTML: 'open-html',
  OPEN_IN_BROWSER: 'open-in-browser',
  OPEN_WEBSITE: 'open-website',
  EXPORT_MARKDOWN: 'export-markdown',
  OPEN_FILE: 'open-file',
  OPEN_CHANNEL_FOLDER: 'open-channel-folder',
  SHOW_FILE_IN_EXPLORER: 'show-file-in-explorer',
  GET_SETTINGS: 'get-settings',
  UPDATE_SETTINGS: 'update-settings',
  RESOLVE_MEDIA: 'resolve-media',
  ON_SCAN_PROGRESS: 'on-scan-progress',
  ON_LOAD_PROGRESS: 'on-load-progress',
} as const;
