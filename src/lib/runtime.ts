import { isTauri } from "@tauri-apps/api/core";

export const LEGACY_DESKTOP_API_BASE_URL = "http://127.0.0.1:8787";

export function isDesktopApp() {
  return isTauri();
}

export function usesDesktopAiBridge(baseUrl: string) {
  if (!isDesktopApp()) {
    return false;
  }

  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, "");
  return !normalizedBaseUrl || normalizedBaseUrl === LEGACY_DESKTOP_API_BASE_URL;
}
