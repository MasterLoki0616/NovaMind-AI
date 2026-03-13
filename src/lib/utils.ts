import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ChatMode, PageId } from "../types/app";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(text: string, maxLength = 56) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}...`;
}

export function formatRelativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return "yesterday";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function makeConversationTitle(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();

  if (!normalized) return "New Session";

  return truncate(normalized, 42);
}

export function modeToPage(mode: ChatMode): PageId {
  switch (mode) {
    case "code":
      return "code";
    case "voice":
      return "voice";
    default:
      return "chat";
  }
}

export function pageToMode(page: PageId): ChatMode | null {
  switch (page) {
    case "chat":
      return "chat";
    case "code":
      return "code";
    case "voice":
      return "voice";
    default:
      return null;
  }
}

export function bytesToReadable(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
