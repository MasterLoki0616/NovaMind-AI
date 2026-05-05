import type { FileFormat } from "./fileFormatResolver";
import { normalizeFilenameText, normalizeText } from "./textNormalizer";

const COMMAND_PHRASES = [
  "benim için",
  "benim icin",
  "lütfen",
  "lutfen",
  "please",
  "create",
  "make",
  "write",
  "generate",
  "prepare",
  "save",
  "export",
  "download",
  "convert",
  "turn",
  "draft",
  "oluştur",
  "olustur",
  "yaz",
  "kaydet",
  "indir",
  "çevir",
  "cevir",
  "dosya oluştur",
  "dosya olustur",
  "masaüstüne",
  "masaustune",
  "desktop",
  "downloads",
  "kısaca",
  "kisaca",
  "hakkında",
  "hakkinda",
  "about",
  "as",
  "to",
  "my",
  "the",
  "a",
  "an"
];

const TYPE_WORDS = [
  "pdf",
  "txt",
  "docx",
  "markdown",
  "md",
  "json",
  "csv",
  "html",
  "xlsx",
  "pptx",
  "file",
  "document",
  "note",
  "report",
  "rapor",
  "not",
  "belge",
  "doküman",
  "dokuman"
];

const TOPIC_STOPWORDS = new Set([
  "ve",
  "ile",
  "bir",
  "bu",
  "şu",
  "su",
  "için",
  "icin",
  "olan",
  "gibi",
  "kısa",
  "kisa",
  "kısaca",
  "kisaca",
  "detaylı",
  "detayli",
  "hakkında",
  "hakkinda",
  "and",
  "or",
  "with",
  "from",
  "into",
  "this",
  "that",
  "quick",
  "short"
]);

const TITLE_WORD_OVERRIDES = new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["pdf", "PDF"],
  ["txt", "TXT"],
  ["docx", "DOCX"],
  ["iha", "İHA"],
  ["uav", "UAV"],
  ["novamind", "NovaMind"]
]);

function stripMarkdownHeading(content?: string) {
  const heading = normalizeText(content ?? "").match(/^\s*#{1,3}\s+(.+)$/m)?.[1];
  return heading?.trim() ?? "";
}

function replacePhrase(input: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return input.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "giu"), " ");
}

function stripCommands(input: string) {
  let cleaned = normalizeText(input);

  for (const phrase of COMMAND_PHRASES) {
    cleaned = replacePhrase(cleaned, phrase);
  }

  for (const word of TYPE_WORDS) {
    cleaned = replacePhrase(cleaned, word);
  }

  return cleaned
    .replace(/\.(txt|md|pdf|json|docx|csv|html|xlsx|pptx)\b/giu, " ")
    .replace(/[,:;.!?()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulWords(input: string) {
  return stripCommands(input)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !TOPIC_STOPWORDS.has(word.toLocaleLowerCase("tr-TR")));
}

function topicFromInput(userInput: string, generatedContent?: string, intent?: string) {
  const words = meaningfulWords(userInput);
  if (words.length > 0) return words.slice(0, 6).join(" ");

  const headingWords = meaningfulWords(stripMarkdownHeading(generatedContent));
  if (headingWords.length > 0) return headingWords.slice(0, 6).join(" ");

  const contentWords = meaningfulWords(normalizeText(generatedContent ?? "").slice(0, 220));
  if (contentWords.length > 0) return contentWords.slice(0, 6).join(" ");

  return intent || "NovaMind Output";
}

function titleCaseWord(word: string) {
  const normalized = word.toLocaleLowerCase("tr-TR");
  const override = TITLE_WORD_OVERRIDES.get(normalized);
  if (override) return override;
  if (/^[A-ZÇĞİÖŞÜ0-9]{2,}$/.test(word)) return word;
  return normalized.charAt(0).toLocaleUpperCase("tr-TR") + normalized.slice(1);
}

export function generateSmartTitle(params: {
  userInput: string;
  generatedContent?: string;
  intent?: string;
  format: FileFormat;
}) {
  const topic = topicFromInput(params.userInput, params.generatedContent, params.intent);
  const words = meaningfulWords(topic).slice(0, 6);
  const sourceWords = words.length > 0 ? words : topic.split(/\s+/).filter(Boolean).slice(0, 6);
  return sourceWords.map(titleCaseWord).join(" ") || "NovaMind Output";
}

function kebabCase(input: string) {
  const words = normalizeFilenameText(input)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !TOPIC_STOPWORDS.has(word));

  return words.slice(0, 6).join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function generateSmartFilename(params: {
  userInput: string;
  generatedContent?: string;
  intent?: string;
  format: FileFormat;
}) {
  const title = generateSmartTitle(params);
  const base = kebabCase(title) || kebabCase(params.intent ?? "") || "novamind-output";
  return `${base.slice(0, 72).replace(/-$/g, "")}.${params.format}`;
}
