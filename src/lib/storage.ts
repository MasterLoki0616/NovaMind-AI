import type { AppSettings, ChatMode, Conversation } from "../types/app";
import { LEGACY_DESKTOP_API_BASE_URL } from "./runtime";

const SETTINGS_KEY = "novamind:settings";
const CONVERSATIONS_KEY = "novamind:conversations";

function getDefaultApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window === "undefined") {
    return "http://127.0.0.1:8787";
  }

  const { hostname, port, origin, protocol } = window.location;

  if (protocol === "tauri:") {
    return "";
  }

  if ((hostname === "127.0.0.1" || hostname === "localhost") && ["1420", "4173", "5173"].includes(port)) {
    return `${protocol}//${hostname}:8787`;
  }

  return origin;
}

export const defaultSettings: AppSettings = {
  apiBaseUrl: getDefaultApiBaseUrl(),
  openAiApiKey: "",
  defaultModel: "gpt-4o-mini",
  temperature: 0.4,
  systemPrompt: "",
  voiceAutoSpeak: true,
  voiceName: "nova",
  preferredInputDeviceId: "",
  preferredOutputDeviceId: "",
  inputGain: 1,
  theme: "ai",
  language: "en"
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
    const stored = { ...defaultSettings, ...JSON.parse(raw) } as AppSettings;

    if (stored.apiBaseUrl === LEGACY_DESKTOP_API_BASE_URL && protocolIsTauri()) {
      stored.apiBaseUrl = "";
    }

    return stored;
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

function protocolIsTauri() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.protocol === "tauri:";
}
