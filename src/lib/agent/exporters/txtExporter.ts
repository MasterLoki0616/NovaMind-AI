import { normalizeText } from "../textNormalizer";

export function createTxtBlob(content: string) {
  const normalized = normalizeText(content);
  return {
    content: normalized,
    blob: new Blob([new TextEncoder().encode(normalized)], {
      type: "text/plain;charset=utf-8"
    })
  };
}

export function createMarkdownBlob(content: string) {
  const normalized = normalizeText(content);
  return {
    content: normalized,
    blob: new Blob([new TextEncoder().encode(normalized)], {
      type: "text/markdown;charset=utf-8"
    })
  };
}
