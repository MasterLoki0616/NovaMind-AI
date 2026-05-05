import type { AgentExportFormat } from "./types";

export type FileFormat = AgentExportFormat;

const SUPPORTED_FORMATS: FileFormat[] = [
  "txt",
  "md",
  "pdf",
  "docx",
  "json",
  "csv",
  "html",
  "xlsx",
  "pptx"
];

const EXTENSION_ALIASES: Record<string, FileFormat> = {
  text: "txt",
  plain: "txt",
  markdown: "md",
  md: "md",
  pdf: "pdf",
  doc: "docx",
  docx: "docx",
  word: "docx",
  json: "json",
  csv: "csv",
  html: "html",
  htm: "html",
  webpage: "html",
  "web-page": "html",
  excel: "xlsx",
  xls: "xlsx",
  xlsx: "xlsx",
  spreadsheet: "xlsx",
  powerpoint: "pptx",
  ppt: "pptx",
  pptx: "pptx",
  slides: "pptx",
  deck: "pptx"
};

export function normalizeExtension(ext: string): FileFormat {
  const normalized = ext.trim().toLowerCase().replace(/^\./, "").replace(/\s+/g, "-");
  return EXTENSION_ALIASES[normalized] ?? (isSupportedFormat(normalized) ? (normalized as FileFormat) : "txt");
}

export function isSupportedFormat(ext: string): boolean {
  return SUPPORTED_FORMATS.includes(ext.trim().toLowerCase().replace(/^\./, "") as FileFormat);
}

export function getDefaultFormatForIntent(intent: string): FileFormat {
  const normalized = intent.toLowerCase();

  if (/\b(note|quick_note|quick note|not|kisa not|kısa not|short note)\b/.test(normalized)) {
    return "txt";
  }

  if (/\b(report|rapor|proposal|sponsorship|document|doc|belge|dokuman|doküman)\b/.test(normalized)) {
    return "docx";
  }

  if (/\b(presentation|deck|slides|slide|sunum)\b/.test(normalized)) {
    return "pptx";
  }

  if (/\b(spreadsheet|table|csv|liste|list|checklist|xlsx|excel)\b/.test(normalized)) {
    return normalized.includes("xlsx") || normalized.includes("excel") ? "xlsx" : "csv";
  }

  if (/\b(json|data|config|configuration)\b/.test(normalized)) {
    return "json";
  }

  if (/\b(pdf)\b/.test(normalized)) {
    return "pdf";
  }

  if (/\b(html|web page|webpage|website page)\b/.test(normalized)) {
    return "html";
  }

  if (/\b(markdown|md)\b/.test(normalized)) {
    return "md";
  }

  return "txt";
}

export function detectRequestedFormat(userInput: string, intent = ""): FileFormat {
  const lower = userInput.toLowerCase();
  const extensionMatch = lower.match(/\.(txt|md|markdown|pdf|docx|doc|json|csv|html|htm|xlsx|xls|pptx|ppt)\b/);
  if (extensionMatch?.[1]) {
    return normalizeExtension(extensionMatch[1]);
  }

  const explicitFormatPatterns: Array<[RegExp, FileFormat]> = [
    [/\b(markdown|md)\b/, "md"],
    [/\bpdf\b|pdf'e|pdfye/, "pdf"],
    [/\b(docx|word document|word file)\b/, "docx"],
    [/\b(json)\b/, "json"],
    [/\b(csv)\b/, "csv"],
    [/\b(html|web page|webpage)\b/, "html"],
    [/\b(xlsx|excel)\b/, "xlsx"],
    [/\b(pptx|powerpoint|presentation deck|slide deck)\b/, "pptx"],
    [/\b(txt|text file|plain text)\b/, "txt"]
  ];

  for (const [pattern, format] of explicitFormatPatterns) {
    if (pattern.test(lower)) {
      return format;
    }
  }

  return getDefaultFormatForIntent(`${intent} ${lower}`);
}

export function supportedFormats() {
  return [...SUPPORTED_FORMATS];
}
