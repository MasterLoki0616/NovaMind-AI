import path from "node:path";
import mammoth from "mammoth";
import pdf from "pdf-parse";

export const SUPPORTED_DOCUMENT_TYPES = [".pdf", ".txt", ".docx", ".md"] as const;

export async function extractDocumentText(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();

  switch (extension) {
    case ".pdf": {
      const result = await pdf(file.buffer);
      return normalizeText(result.text);
    }
    case ".docx": {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return normalizeText(result.value);
    }
    case ".txt":
    case ".md":
      return normalizeText(file.buffer.toString("utf-8"));
    default:
      throw new Error(
        `Unsupported document type "${extension}". Use ${SUPPORTED_DOCUMENT_TYPES.join(", ")}.`
      );
  }
}

export function normalizeText(text: string) {
  return text
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function truncateDocumentContext(text: string, limit = 18000) {
  if (text.length <= limit) {
    return { text, truncated: false };
  }

  return {
    text: `${text.slice(0, limit)}\n\n[Document truncated for MVP context window]`,
    truncated: true
  };
}
