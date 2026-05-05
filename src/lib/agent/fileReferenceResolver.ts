import type { AgentExportFormat, AgentGeneratedFileRecord } from "./types";

const FORMAT_PATTERNS: Array<[RegExp, AgentExportFormat]> = [
  [/\bpdf\b|\.pdf\b/i, "pdf"],
  [/\btxt\b|\.txt\b|text file/i, "txt"],
  [/\bdocx\b|\.docx\b|word/i, "docx"],
  [/\bmarkdown\b|\bmd\b|\.md\b/i, "md"],
  [/\bhtml\b|\.html\b/i, "html"],
  [/\bjson\b|\.json\b/i, "json"],
  [/\bcsv\b|\.csv\b/i, "csv"],
  [/\bxlsx\b|\.xlsx\b|excel/i, "xlsx"],
  [/\bpptx\b|\.pptx\b|powerpoint/i, "pptx"]
];

const LAST_FILE_PATTERN =
  /\b(last|previous|that file|the file|created file|generated file|az once|az önce|az önceki|onceki|oluşturduğun|olusturdugun|o dosya|bu dosya|dosyanın|dosyanin|başlığını|basligini|içeriğini|icerigini)\b/i;

export function resolveFileReference(
  userInput: string,
  conversationFiles: AgentGeneratedFileRecord[]
) {
  if (conversationFiles.length === 0) return null;
  const lower = userInput.toLocaleLowerCase("tr-TR");

  if (/\b(first|ilk)\b/i.test(lower)) {
    return conversationFiles[conversationFiles.length - 1] ?? null;
  }

  for (const [pattern, format] of FORMAT_PATTERNS) {
    if (pattern.test(userInput)) {
      const byFormat = conversationFiles.find((file) => file.format === format);
      if (byFormat) return byFormat;
    }
  }

  const titleMatch = conversationFiles.find((file) => {
    const title = file.title.toLocaleLowerCase("tr-TR");
    const filename = file.filename.toLocaleLowerCase("tr-TR");
    return lower.includes(title) || lower.includes(filename) || lower.includes(filename.replace(/\.[^.]+$/, ""));
  });
  if (titleMatch) return titleMatch;

  if (LAST_FILE_PATTERN.test(userInput)) {
    return conversationFiles[0] ?? null;
  }

  return conversationFiles[0] ?? null;
}
