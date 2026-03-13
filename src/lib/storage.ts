import type { AppSettings, ChatMode, Conversation } from "../types/app";

const SETTINGS_KEY = "novamind:settings";
const CONVERSATIONS_KEY = "novamind:conversations";

export const defaultSettings: AppSettings = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787",
  defaultModel: "gpt-4o-mini",
  temperature: 0.4,
  systemPrompt: "",
  voiceAutoSpeak: true,
  voiceName: "nova"
};

export function createConversation(mode: ChatMode): Conversation {
  const timestamp = new Date().toISOString();
  const title =
    mode === "code"
      ? "New Code Session"
      : mode === "voice"
        ? "New Voice Session"
        : "New Chat";

  return {
    id: crypto.randomUUID(),
    title,
    mode,
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: []
  };
}

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) } as AppSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveAppSettings(settings: AppSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const conversations = JSON.parse(raw) as Conversation[];
    return conversations.sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}
