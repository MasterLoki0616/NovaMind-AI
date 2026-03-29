export type PageId =
  | "chat"
  | "screen"
  | "documents"
  | "code"
  | "voice"
  | "settings";

export type ChatMode = "chat" | "code" | "voice";
export type SmartCommand = "summarize" | "explain" | "rewrite" | "translate" | "code";
export type ModelName = string;
export type TtsVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
export type AppTheme = "ai" | "dark" | "light";
export type AppLanguage = "en" | "tr";
export type AttachmentKind =
  | "document"
  | "video"
  | "image"
  | "text"
  | "code"
  | "pdf"
  | "file";
export type AttachmentPreviewKind =
  | "text"
  | "code"
  | "image"
  | "video"
  | "pdf"
  | "docx"
  | "file";
export type AttachmentOrigin = "upload";

export interface AttachmentRecord {
  id: string;
  kind: AttachmentKind;
  name: string;
  size: number;
  mimeType: string;
  extension?: string;
  path?: string;
  origin?: AttachmentOrigin;
  previewKind?: AttachmentPreviewKind;
  extractedText?: string;
  durationSeconds?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  meta?: {
    command?: SmartCommand | null;
    copiedFromScreen?: boolean;
    source?: "chat" | "document" | "screen" | "voice";
    attachments?: AttachmentRecord[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  mode: ChatMode;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  apiBaseUrl: string;
  openAiApiKey: string;
  defaultModel: ModelName;
  temperature: number;
  systemPrompt: string;
  voiceAutoSpeak: boolean;
  voiceName: TtsVoice;
  preferredInputDeviceId: string;
  preferredOutputDeviceId: string;
  inputGain: number;
  theme: AppTheme;
  language: AppLanguage;
}

export interface ScreenSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  extractedText: string;
  summary: string;
  truncated: boolean;
  createdAt: string;
}
