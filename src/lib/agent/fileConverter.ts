import { generateSmartFilename } from "./filenameGenerator";
import { createFileBlob, downloadFile, saveFileDesktop } from "./fileActions";
import { normalizeText } from "./textNormalizer";
import type { AgentExecutorContext } from "./executor";
import type { AgentExportFormat, AgentGeneratedFileRecord } from "./types";

const CONVERSIONS: Record<AgentExportFormat, AgentExportFormat[]> = {
  txt: ["pdf", "docx", "md", "html", "json"],
  md: ["pdf", "docx", "txt", "html"],
  pdf: ["txt"],
  docx: ["pdf", "txt", "md"],
  json: ["txt", "md"],
  csv: ["xlsx", "txt", "json"],
  html: ["pdf", "txt", "md"],
  xlsx: ["csv", "txt"],
  pptx: ["pdf", "txt"]
};

export function supportedConversionsFor(format: AgentExportFormat) {
  return CONVERSIONS[format] ?? [];
}

export function canConvertFile(sourceFormat: AgentExportFormat, targetFormat: AgentExportFormat) {
  return sourceFormat === targetFormat || supportedConversionsFor(sourceFormat).includes(targetFormat);
}

function contentForTarget(file: AgentGeneratedFileRecord, targetFormat: AgentExportFormat) {
  const source = normalizeText(file.content || "");

  if (targetFormat === "json") {
    if (file.format === "csv") {
      const [headerLine = "", ...rows] = source.split(/\r?\n/).filter(Boolean);
      const headers = headerLine.split(",").map((item) => item.trim());
      return JSON.stringify(
        rows.map((row) => {
          const values = row.split(",");
          return Object.fromEntries(headers.map((header, index) => [header || `column_${index + 1}`, values[index] ?? ""]));
        }),
        null,
        2
      );
    }

    try {
      JSON.parse(source);
      return source;
    } catch {
      return JSON.stringify({ title: file.filename, content: source }, null, 2);
    }
  }

  if (targetFormat === "csv" && file.format === "xlsx") {
    return source;
  }

  if (targetFormat === "md" && !source.trim().startsWith("#")) {
    return `# ${file.filename.replace(/\.[^.]+$/, "")}\n\n${source}`;
  }

  if (targetFormat === "html" && !/<html[\s>]/i.test(source)) {
    return `# ${file.filename.replace(/\.[^.]+$/, "")}\n\n${source}`;
  }

  return source;
}

export async function convertGeneratedFile(
  file: AgentGeneratedFileRecord,
  targetFormat: AgentExportFormat,
  context?: Pick<AgentExecutorContext, "saveFileToDesktop"> & {
    location?: "desktop" | "downloads" | "browser";
  }
) {
  if (!canConvertFile(file.format, targetFormat)) {
    throw new Error(
      `Conversion from .${file.format} to .${targetFormat} is not supported yet. Supported alternatives: ${supportedConversionsFor(
        file.format
      )
        .map((format) => `.${format}`)
        .join(", ") || "none"}.`
    );
  }

  const filename = generateSmartFilename({
    userInput: file.filename.replace(/\.[^.]+$/, ""),
    generatedContent: file.content,
    intent: "converted file",
    format: targetFormat
  });
  const content = contentForTarget(file, targetFormat);
  const generated = await createFileBlob(targetFormat, content, filename);
  const saveToDesktop = context?.location === "desktop" && context.saveFileToDesktop;
  const saved = saveToDesktop
    ? await saveFileDesktop(generated.blob, generated.filename, content, context)
    : null;
  const downloadTriggered = saved ? false : downloadFile(generated.blob, generated.filename);

  return {
    id: crypto.randomUUID(),
    filename: saved?.filename ?? generated.filename,
    title: file.title,
    format: targetFormat,
    content,
    mimeType: generated.mimeType,
    size: saved?.bytes ?? generated.blob.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceMessageId: file.sourceMessageId,
    version: file.version + 1,
    status: "converted",
    actionId: file.actionId,
    path: saved?.path,
    downloadTriggered
  } satisfies AgentGeneratedFileRecord;
}
