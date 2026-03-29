import mammoth from "mammoth";
import type { AttachmentRecord } from "../types/app";
import { fetchFormData } from "./api";
import { usesDesktopAiBridge } from "../lib/runtime";

async function extractLocalDocumentText(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return file.text();
  }

  if (lowerName.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  throw new Error(
    "The built-in desktop mode supports TXT, MD, and DOCX files. Use a custom API URL for PDF support."
  );
}

export async function prepareDocumentAttachment(baseUrl: string, file: File): Promise<AttachmentRecord> {
  const lowerName = file.name.toLowerCase();
  const extension = lowerName.split(".").pop();

  if (usesDesktopAiBridge(baseUrl)) {
    const extractedText = await extractLocalDocumentText(file);

    return {
      id: crypto.randomUUID(),
      kind: "document",
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      extension,
      origin: "upload",
      previewKind: lowerName.endsWith(".docx") ? "docx" : "text",
      extractedText
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  const result = await fetchFormData<{ extractedText: string }>(baseUrl, "/api/documents/extract", formData);

  return {
    id: crypto.randomUUID(),
    kind: "document",
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    extension,
    origin: "upload",
    previewKind: lowerName.endsWith(".docx") ? "docx" : "text",
    extractedText: result.extractedText
  };
}
