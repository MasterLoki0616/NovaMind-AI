import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import mammoth from "mammoth";
import type { AttachmentPreviewKind, AttachmentRecord } from "../types/app";
import { invokeDesktop } from "./desktop";

interface DesktopFilePreviewResponse {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  previewKind: AttachmentPreviewKind | "docx";
  text?: string | null;
  base64?: string | null;
  truncated: boolean;
}

export interface LoadedAttachmentPreview {
  kind: AttachmentPreviewKind | "docx";
  text?: string;
  url?: string;
  truncated?: boolean;
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

export async function loadAttachmentPreview(
  attachment: AttachmentRecord
): Promise<LoadedAttachmentPreview> {
  if (!attachment.path || !isTauri()) {
    return {
      kind: attachment.previewKind ?? "text",
      text: attachment.extractedText ?? "",
      truncated: false
    };
  }

  const preview = await invokeDesktop<DesktopFilePreviewResponse>("desktop_prepare_file_preview", {
    request: {
      path: attachment.path
    }
  });

  switch (preview.previewKind) {
    case "image":
    case "video":
    case "pdf":
      return {
        kind: preview.previewKind,
        url: convertFileSrc(preview.path)
      };
    case "docx": {
      const result = await mammoth.extractRawText({
        arrayBuffer: base64ToArrayBuffer(preview.base64 ?? "")
      });

      return {
        kind: "docx",
        text: result.value.trim(),
        truncated: preview.truncated
      };
    }
    case "code":
    case "text":
      return {
        kind: preview.previewKind,
        text: preview.text ?? "",
        truncated: preview.truncated
      };
    default:
      return {
        kind: "file",
        text: attachment.extractedText ?? "",
        truncated: preview.truncated
      };
  }
}
