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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  meta?: {
    command?: SmartCommand | null;
    copiedFromScreen?: boolean;
    source?: "chat" | "document" | "screen" | "voice";
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
  defaultModel: ModelName;
  temperature: number;
  systemPrompt: string;
  voiceAutoSpeak: boolean;
  voiceName: TtsVoice;
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
