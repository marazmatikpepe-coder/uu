export type AIState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'searching'
  | 'working'
  | 'speaking'
  | 'success'
  | 'error'
  | 'offline'
  | 'online'
  | 'recording'
  | 'syncing'
  | 'saving'
  | 'saved'
  | 'downloading'
  | 'uploading'
  | 'processing'
  | 'paused'
  | 'cancelled'
  | 'updating'
  | 'locked'
  | 'happy'
  | 'sad'
  | 'love'
  | 'angry'
  | 'confused'
  | 'hmm'
  | 'oops'
  | 'goodIdea'
  | 'gotIt';

export interface Chat {
  id: string;
  title: string;
  createdAt: any;
  updatedAt: any;
  archived: boolean;
  favorite: boolean;
  lastMessagePreview: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'sticker' | 'image' | 'file' | 'code';

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'file';
}

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  stickerId?: string;
  attachments?: MessageAttachment[];
  createdAt: any;
  edited?: boolean;
  pending?: boolean;
  error?: boolean;
}

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface ProjectDoc {
  id: string;
  name: string;
  files: ProjectFile[];
  createdAt: any;
  updatedAt: any;
}

export interface UserSettings {
  aiName?: string;
  voiceEnabled: boolean;
  voiceURI?: string;
  voiceVolume: number;
  voiceRate: number;
  animationsEnabled: boolean;
  theme: 'dark' | 'light';
}

export interface StickerItem {
  id: string;
  name: string;
  url: string;
}

export interface StickerCategory {
  name: string;
  stickers: StickerItem[];
}
