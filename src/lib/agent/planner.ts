import {
  cleanTitle,
  contentFormatFromExport,
  createAgentId,
  ensureFileExtension,
  inferPriority,
  normalizeActionType,
  titleCase
} from "./actions";
import { detectRequestedFormat, getDefaultFormatForIntent, normalizeExtension } from "./fileFormatResolver";
import { generateSmartFilename } from "./filenameGenerator";
import type {
  AgentAction,
  AgentContentFormat,
  AgentExportFormat,
  AgentFileLocation,
  AgentGeneratedFileRecord,
  AgentRelevantContextItem
} from "./types";

export interface PlannerContext {
  relevantContext: AgentRelevantContextItem[];
  conversationFiles?: AgentGeneratedFileRecord[];
  completePlan?: (prompt: string, options?: { signal?: AbortSignal }) => Promise<string>;
  signal?: AbortSignal;
}

export interface PlannerResult {
  message: string;
  actions: AgentAction[];
}

const ACTION_INTENT_PATTERNS = [
  /\b(create|add|make|write|generate|prepare|draft|save|store|remember|memorize|export|download|convert|turn|rename|update|change|improve|regenerate|summari[sz]e|plan|schedule|prioriti[sz]e)\b/i,
  /\b(task|todo|to-do|note|file|document|doc|pdf|markdown|checklist|report|email|draft|memory|reminder|txt|docx|csv|html|xlsx|pptx)\b/i,
  /\b(gorev|not|dosya|dokuman|belge|kaydet|indir|hatirla|ozetle|plan|rapor|mail|liste)\b/i
];

function hasActionVerb(input: string) {
  return ACTION_INTENT_PATTERNS.some((pattern) => pattern.test(input));
}

export function isAgentRequest(input: string) {
  const lower = input.toLowerCase();
  if (
    /\bwhat is|who is|why does|how does|explain\b/i.test(lower) &&
    !/\b(save|create|export|download|write|plan|task|note|file|report|email|remember|convert)\b/i.test(lower)
  ) {
    return false;
  }

  return hasActionVerb(input);
}

function relevantContextText(items: AgentRelevantContextItem[]) {
  if (items.length === 0) return "No relevant local context found.";
  return items.map((item) => `- ${item.type}: ${item.title} - ${item.content}`).join("\n");
}

function extractJsonObject(input: string) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(input);
  const candidate = fenced?.[1] ?? input;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Planner did not return JSON.");
  }

  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

function stringValue(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function arrayValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeFormat(value: string, fallback: AgentExportFormat): AgentExportFormat {
  if (!value.trim()) return fallback;
  return normalizeExtension(value);
}

function normalizeContentFormat(value: string, fallback: AgentContentFormat): AgentContentFormat {
  const normalized = value.toLowerCase();
  if (normalized === "json" || normalized === "text" || normalized === "markdown" || normalized === "csv" || normalized === "html") {
    return normalized;
  }
  if (normalized === "md") return "markdown";
  return fallback;
}

function normalizeLocation(value: string): AgentFileLocation {
  const lower = value.toLowerCase();
  if (lower.includes("desktop") || lower.includes("masaustu") || lower.includes("masaust")) return "desktop";
  if (lower.includes("download") || lower.includes("indir")) return "downloads";
  return "browser";
}

function normalizeAction(raw: unknown): AgentAction | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const type = normalizeActionType(String(record.type ?? ""));
  if (!type) return null;

  const title = cleanTitle(stringValue(record, ["title", "topic", "subject"], "NovaMind action"), "NovaMind action");
  const intent = stringValue(record, ["intent"], type);
  const format = normalizeFormat(
    stringValue(record, ["format", "targetFormat", "target_format"], ""),
    getDefaultFormatForIntent(`${intent} ${title}`)
  );
  const content = stringValue(record, ["content", "body", "text"], "");
  const contentFromActionId = stringValue(record, ["contentFromActionId", "content_from_action_id"], "");

  switch (type) {
    case "generate_content": {
      const topic = cleanTitle(stringValue(record, ["topic"], title), title);
      return {
        id: createAgentId(),
        type,
        title,
        topic,
        prompt: stringValue(record, ["prompt"], `Create ${contentFormatFromExport(format)} content about ${topic}.`),
        format: normalizeContentFormat(stringValue(record, ["format"], ""), contentFormatFromExport(format)),
        content: content || undefined
      };
    }

    case "create_file": {
      const topic = cleanTitle(stringValue(record, ["topic"], title), title);
      return {
        id: createAgentId(),
        type,
        title,
        topic,
        prompt: stringValue(record, ["prompt"], `Create ${contentFormatFromExport(format)} content about ${topic}.`),
        format,
        location: normalizeLocation(stringValue(record, ["location"], "browser")),
        content: content || undefined
      };
    }

    case "summarize_content":
      return {
        id: createAgentId(),
        type,
        title,
        sourceText: stringValue(record, ["sourceText", "source_text"], "") || undefined,
        contentFromActionId: contentFromActionId || undefined,
        format: normalizeContentFormat(stringValue(record, ["format"], ""), "text")
      };

    case "create_note":
      return {
        id: createAgentId(),
        type,
        title,
        content: content || undefined,
        contentFromActionId: contentFromActionId || undefined
      };

    case "create_document": {
      const topic = cleanTitle(stringValue(record, ["topic"], title), title);
      return {
        id: createAgentId(),
        type,
        title,
        topic,
        format,
        content: content || undefined,
        contentFromActionId: contentFromActionId || undefined
      };
    }

    case "create_task":
      return {
        id: createAgentId(),
        type,
        title,
        time: stringValue(record, ["time"], "") || undefined,
        dueAt: stringValue(record, ["dueAt", "due_at"], "") || undefined,
        priority: inferPriority(`${title} ${stringValue(record, ["priority"], "")}`)
      };

    case "create_checklist":
      return {
        id: createAgentId(),
        type,
        title,
        items: arrayValue(record, ["items", "checklist"]),
        content: content || undefined,
        contentFromActionId: contentFromActionId || undefined
      };

    case "create_report": {
      const topic = cleanTitle(stringValue(record, ["topic"], title), title);
      return {
        id: createAgentId(),
        type,
        title,
        topic,
        content: content || undefined,
        contentFromActionId: contentFromActionId || undefined
      };
    }

    case "create_email_draft":
      return {
        id: createAgentId(),
        type,
        title,
        to: stringValue(record, ["to", "recipient"], "") || undefined,
        subject: stringValue(record, ["subject"], title),
        body: content || undefined,
        contentFromActionId: contentFromActionId || undefined
      };

    case "store_memory":
      return {
        id: createAgentId(),
        type,
        title,
        key: cleanTitle(stringValue(record, ["key"], title), title),
        value: stringValue(record, ["value", "content"], title),
        memoryType: stringValue(record, ["memoryType", "memory_type", "kind"], "context") as any,
        confidence: Number(record.confidence ?? 0.78) || 0.78
      };

    case "retrieve_memory":
      return {
        id: createAgentId(),
        type,
        title,
        query: stringValue(record, ["query", "content"], title)
      };

    case "convert_file":
      return {
        id: createAgentId(),
        type,
        title,
        sourceActionId: stringValue(record, ["sourceActionId", "source_action_id"], "") || undefined,
        sourceFilename: stringValue(record, ["sourceFilename", "source_filename"], "") || undefined,
        targetFormat: normalizeFormat(stringValue(record, ["targetFormat", "target_format", "format"], ""), "pdf"),
        filename: stringValue(record, ["filename"], "") || undefined,
        location: normalizeLocation(stringValue(record, ["location"], "downloads"))
      };

    case "rename_file":
    case "update_file_title":
      return {
        id: createAgentId(),
        type,
        title,
        sourceFormat: stringValue(record, ["sourceFormat", "source_format"], "")
          ? normalizeFormat(stringValue(record, ["sourceFormat", "source_format"], ""), "pdf")
          : undefined,
        newTitle: stringValue(record, ["newTitle", "new_title"], "") || undefined,
        newFilename: stringValue(record, ["newFilename", "new_filename"], "") || undefined,
        instruction: content || undefined,
        location: normalizeLocation(stringValue(record, ["location"], "browser"))
      };

    case "update_file_content":
    case "improve_file":
    case "regenerate_file":
      return {
        id: createAgentId(),
        type,
        title,
        sourceFormat: stringValue(record, ["sourceFormat", "source_format"], "")
          ? normalizeFormat(stringValue(record, ["sourceFormat", "source_format"], ""), "pdf")
          : undefined,
        instruction: stringValue(record, ["instruction", "prompt", "content"], title),
        content: content || undefined,
        location: normalizeLocation(stringValue(record, ["location"], "browser"))
      };

    case "export_file":
      return {
        id: createAgentId(),
        type,
        title,
        sourceFormat: stringValue(record, ["sourceFormat", "source_format"], "")
          ? normalizeFormat(stringValue(record, ["sourceFormat", "source_format"], ""), "pdf")
          : undefined,
        targetFormat: normalizeFormat(stringValue(record, ["targetFormat", "target_format", "format"], ""), format),
        location: normalizeLocation(stringValue(record, ["location"], "downloads"))
      };

    case "summarize_file":
      return {
        id: createAgentId(),
        type,
        title,
        sourceFormat: stringValue(record, ["sourceFormat", "source_format"], "")
          ? normalizeFormat(stringValue(record, ["sourceFormat", "source_format"], ""), "pdf")
          : undefined
      };

    case "save_file":
    case "download_file":
    case "export_content": {
      const filename = ensureFileExtension(
        stringValue(record, ["filename", "fileName", "name"], generateSmartFilename({ userInput: title, intent, format })),
        format
      );
      return {
        id: createAgentId(),
        type,
        title,
        filename,
        format,
        location: normalizeLocation(stringValue(record, ["location"], type === "save_file" ? "desktop" : "downloads")),
        content: content || undefined,
        contentFromActionId: contentFromActionId || undefined
      } as AgentAction;
    }

    default:
      return null;
  }
}

function normalizePlannerResult(raw: unknown): PlannerResult {
  if (!raw || typeof raw !== "object") throw new Error("Planner result was invalid.");
  const record = raw as Record<string, unknown>;
  const actions = Array.isArray(record.actions)
    ? record.actions.map(normalizeAction).filter((action): action is AgentAction => Boolean(action))
    : [];

  return {
    message: String(record.message ?? "I've completed the requested action.").trim(),
    actions: actions.slice(0, 12)
  };
}

function extractTopic(input: string) {
  return cleanTitle(
    input
      .replace(/^(please\s+)?/i, "")
      .replace(/\bbenim\s+için\b/gi, " ")
      .replace(/\bbenim\s+icin\b/gi, " ")
      .replace(/\b(create|make|write|generate|prepare|save|export|download|draft|summarize|summarise|convert|turn|into|as)\b/gi, " ")
      .replace(/\b(oluştur|olustur|yaz|kaydet|indir|çevir|cevir|kısaca|kisaca|masaüstüne|masaustune)\b/gi, " ")
      .replace(/\b(a|an|the|file|document|doc|report|note|checklist|email|draft|about|on|for|to|my|this|it|last|pdf|txt|docx|markdown|md|json|csv|html|xlsx|pptx)\b/gi, " ")
      .replace(/\.(txt|md|pdf|json|docx|csv|html|xlsx|pptx)\b/gi, " ")
      .replace(/\s+/g, " "),
    "NovaMind output"
  );
}

function detectIntent(input: string) {
  const lower = input.toLowerCase();
  if (/\b(note|quick note|not al|kisa not|kısa not|not)\b/i.test(lower)) return "note";
  if (/\b(report|rapor)\b/i.test(lower)) return "report";
  if (/\b(proposal|sponsorship|investor)\b/i.test(lower)) return "proposal";
  if (/\b(document|doc|belge|dokuman|doküman)\b/i.test(lower)) return "document";
  if (/\b(checklist|check list|kontrol listesi)\b/i.test(lower)) return "checklist";
  if (/\b(spreadsheet|table|csv|liste|list|xlsx|excel)\b/i.test(lower)) return "spreadsheet";
  if (/\b(presentation|slides|deck|pptx|sunum)\b/i.test(lower)) return "presentation";
  if (/\b(email|mail)\b/i.test(lower)) return "email";
  if (/\b(json|data|config)\b/i.test(lower)) return "data";
  return "content";
}

function createExportAction(input: string, topic: string, previousActionId: string, intent: string): AgentAction {
  const format = detectRequestedFormat(input, intent);
  const filename = ensureFileExtension(
    generateSmartFilename({
      userInput: input,
      intent,
      format
    }),
    format
  );

  return {
    id: createAgentId(),
    type: /\bdownload|indir\b/i.test(input) ? "download_file" : "export_content",
    title: `Export ${titleCase(topic)}`,
    filename,
    format,
    location: normalizeLocation(input),
    contentFromActionId: previousActionId
  } as AgentAction;
}

function includesAny(input: string, terms: string[]) {
  const lower = input.toLocaleLowerCase("tr-TR");
  return terms.some((term) => lower.includes(term.toLocaleLowerCase("tr-TR")));
}

function isConversionRequest(input: string) {
  const conversionIntent = includesAny(input, [
    "convert",
    "turn",
    "make it",
    "export this",
    "export it",
    "last file",
    "generated file",
    "çevir",
    "cevir",
    "formatına",
    "formatina"
  ]);
  const targetFormat = /\.(txt|md|pdf|json|docx|csv|html|xlsx|pptx)\b/i.test(input) ||
    includesAny(input, ["pdf", "txt", "docx", "markdown", "html", "json", "csv", "xlsx", "pptx"]);

  return conversionIntent && targetFormat;
}

function sourceFormatFromInput(input: string): AgentExportFormat | undefined {
  const lower = input.toLowerCase();
  if (/\bpdf\b|\.pdf\b/.test(lower)) return "pdf";
  if (/\btxt\b|\.txt\b|text file/.test(lower)) return "txt";
  if (/\bdocx\b|\.docx\b|word/.test(lower)) return "docx";
  if (/\bmd\b|markdown|\.md\b/.test(lower)) return "md";
  if (/\bhtml\b|\.html\b/.test(lower)) return "html";
  if (/\bjson\b|\.json\b/.test(lower)) return "json";
  if (/\bcsv\b|\.csv\b/.test(lower)) return "csv";
  if (/\bxlsx\b|\.xlsx\b|excel/.test(lower)) return "xlsx";
  if (/\bpptx\b|\.pptx\b/.test(lower)) return "pptx";
  return undefined;
}

function isExistingFileReference(input: string) {
  return includesAny(input, [
    "last",
    "previous",
    "that file",
    "the file",
    "file you created",
    "generated file",
    "az önce",
    "az önceki",
    "az once",
    "onceki",
    "son dosya",
    "oluşturduğun",
    "olusturdugun",
    "o dosya",
    "bu dosya",
    "pdf dosyası",
    "txt dosyası",
    "dosyanın",
    "dosyanin",
    "içeriğini",
    "icerigini",
    "başlığını",
    "basligini"
  ]);
}

function isRenameRequest(input: string) {
  return includesAny(input, [
    "rename",
    "change title",
    "update title",
    "change its title",
    "başlığını",
    "basligini",
    "adını",
    "adini",
    "title"
  ]);
}

function isImproveRequest(input: string) {
  return includesAny(input, [
    "improve",
    "rewrite",
    "update",
    "change",
    "edit",
    "modify",
    "more professional",
    "professional",
    "kurumsal",
    "profesyonel",
    "daha iyi",
    "içeriğini",
    "icerigini",
    "content",
    "güncelle",
    "guncelle",
    "değiştir",
    "degistir",
    "shorten",
    "shorter",
    "summarize it",
    "kısalt",
    "kisalt",
    "daha kısa",
    "daha kisa"
  ]);
}

function isSummarizeExistingFileRequest(input: string) {
  return (
    isExistingFileReference(input) &&
    includesAny(input, ["summarize", "summarise", "summary", "özetle", "ozetle", "konusunu", "subject", "topic"])
  );
}

function isExplicitNewFileRequest(input: string) {
  return /\b(create new|new file|new document|yeni oluştur|yeni olustur|yeni dosya)\b/i.test(input);
}

function extractExplicitRenameTitle(input: string) {
  const match =
    /(?:title(?:\s+to)?|başlığını|basligini|adını|adini|rename(?:\s+to)?)\s+(.+?)(?:\s+yap|\s+olarak|$)/i.exec(
      input
    );
  const title = match?.[1]?.replace(/^["']|["']$/g, "").trim() ?? "";
  if (!title || /\b(değiştir|degistir|change|update|rename)\b/i.test(title)) return "";
  return title;
}

function deterministicPlan(input: string, conversationFiles: AgentGeneratedFileRecord[] = []): PlannerResult | null {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const topic = extractTopic(trimmed);
  const intent = detectIntent(trimmed);
  const hasConversationFiles = conversationFiles.length > 0;

  if (isConversionRequest(trimmed)) {
    const targetFormat = detectRequestedFormat(trimmed, "convert");
    return {
      message: `I'll convert the last generated file to ${targetFormat.toUpperCase()}.`,
      actions: [
        {
          id: createAgentId(),
          type: "convert_file",
          title: `Convert last file to ${targetFormat.toUpperCase()}`,
          targetFormat,
          location: normalizeLocation(trimmed)
        }
      ]
    };
  }

  if (hasConversationFiles && isSummarizeExistingFileRequest(trimmed)) {
    return {
      message: "I'll summarize the existing file from this conversation.",
      actions: [
        {
          id: createAgentId(),
          type: "summarize_file",
          title: "Summarize existing file",
          sourceFormat: sourceFormatFromInput(trimmed)
        }
      ]
    };
  }

  if (isExistingFileReference(trimmed) && isRenameRequest(trimmed)) {
    return {
      message: "I'll update the existing file title instead of creating a new file.",
      actions: [
        {
          id: createAgentId(),
          type: "update_file_title",
          title: "Update file title",
          sourceFormat: sourceFormatFromInput(trimmed),
          newTitle: extractExplicitRenameTitle(trimmed) || undefined,
          instruction: trimmed,
          location: normalizeLocation(trimmed)
        }
      ]
    };
  }

  if (isExistingFileReference(trimmed) && isImproveRequest(trimmed)) {
    return {
      message: "I'll update the existing file content and regenerate its download.",
      actions: [
        {
          id: createAgentId(),
          type: "improve_file",
          title: "Improve existing file",
          sourceFormat: sourceFormatFromInput(trimmed),
          instruction: trimmed,
          location: normalizeLocation(trimmed)
        }
      ]
    };
  }

  if (hasConversationFiles && isImproveRequest(trimmed) && !isExplicitNewFileRequest(trimmed)) {
    return {
      message: "I'll update the existing file instead of creating a new one.",
      actions: [
        {
          id: createAgentId(),
          type: "improve_file",
          title: "Update existing file",
          sourceFormat: sourceFormatFromInput(trimmed),
          instruction: trimmed,
          location: normalizeLocation(trimmed)
        }
      ]
    };
  }

  if (/\b(remember|store in memory|memorize|bunu hatirla|from now on|always|never|don't|do not|prefer)\b/i.test(lower)) {
    const value = cleanTitle(
      trimmed.replace(/^(please\s+)?(remember that|remember|store in memory|memorize|bunu hatirla:?)/i, ""),
      trimmed
    );
    return {
      message: "I've saved that preference to memory.",
      actions: [
        {
          id: createAgentId(),
          type: "store_memory",
          title: "Saved memory",
          key: /\b(format|note|txt|md|markdown|file)\b/i.test(lower) ? "file_format_preference" : "user_preference",
          value,
          memoryType: /\b(from now on|always|never|prefer|don't|do not)\b/i.test(lower) ? "preference" : "instruction",
          confidence: 0.9
        }
      ]
    };
  }

  if (/\b(create|add|make)\s+(?:a\s+)?(?:task|todo|to-do|reminder)\b|gorev olustur|hatirlatici/i.test(lower)) {
    return {
      message: "I've created the task.",
      actions: [
        {
          id: createAgentId(),
          type: "create_task",
          title: titleCase(topic),
          priority: inferPriority(trimmed)
        }
      ]
    };
  }

  if (/\b(save|create|write|make)\s+(?:a\s+)?note\b|not kaydet|not al|kisa not|kısa not/i.test(lower)) {
    const generateId = createAgentId();
    const format = detectRequestedFormat(trimmed, "note");
    return {
      message: `I've created the note and prepared the ${format.toUpperCase()} file.`,
      actions: [
        {
          id: generateId,
          type: "generate_content",
          title: titleCase(topic),
          topic,
          prompt: `Write a clean, concise note about: ${topic}. Use plain text unless the user explicitly requested a richer format.`,
          format: contentFormatFromExport(format)
        },
        {
          id: createAgentId(),
          type: "create_note",
          title: titleCase(topic),
          contentFromActionId: generateId
        },
        createExportAction(trimmed, topic, generateId, "note")
      ]
    };
  }

  if (/\b(checklist|check list|kontrol listesi)\b/i.test(lower)) {
    const generateId = createAgentId();
    const format = detectRequestedFormat(trimmed, "checklist");
    return {
      message: `I've created the checklist and prepared the ${format.toUpperCase()} file.`,
      actions: [
        {
          id: generateId,
          type: "generate_content",
          title: titleCase(topic),
          topic,
          prompt: `Create a practical checklist for: ${topic}. Return clear checklist items.`,
          format: format === "csv" || format === "xlsx" ? "csv" : "text"
        },
        {
          id: createAgentId(),
          type: "create_checklist",
          title: titleCase(topic),
          items: [],
          contentFromActionId: generateId
        },
        createExportAction(trimmed, topic, generateId, "checklist")
      ]
    };
  }

  if (/\b(draft|write|prepare)\s+(?:an?\s+)?email\b|mail taslagi/i.test(lower)) {
    return {
      message: "I've prepared an email draft.",
      actions: [
        {
          id: createAgentId(),
          type: "create_email_draft",
          title: `Draft email: ${titleCase(topic)}`,
          subject: titleCase(topic)
        }
      ]
    };
  }

  if (/\b(summarize|summarise|summary|ozetle)\b/i.test(lower)) {
    const actionId = createAgentId();
    const format = detectRequestedFormat(trimmed, "note");
    return {
      message: "I've summarized the content and saved the result.",
      actions: [
        {
          id: actionId,
          type: "summarize_content",
          title: `Summary: ${titleCase(topic)}`,
          sourceText: trimmed,
          format: contentFormatFromExport(format)
        },
        {
          id: createAgentId(),
          type: "create_note",
          title: `Summary: ${titleCase(topic)}`,
          contentFromActionId: actionId
        },
        createExportAction(trimmed, `summary ${topic}`, actionId, "note")
      ]
    };
  }

  if (/\b(plan my day|plan (?:my )?(?:day|week|schedule)|schedule my day|prioriti[sz]e|make a plan|gunumu planla|plan yap)\b/i.test(lower)) {
    return fallbackDayPlan(trimmed);
  }

  if (/\b(report|rapor|proposal|sponsorship|document|doc|file|save file|export|download|pdf|markdown|txt|json|docx|csv|html|xlsx|pptx|dokuman|dosya|indir|kaydet)\b/i.test(lower)) {
    const actionId = createAgentId();
    const format = detectRequestedFormat(trimmed, intent);
    const documentActionType = ["report", "proposal", "document", "presentation"].includes(intent)
      ? "create_document"
      : "generate_content";
    return {
      message: `I've generated the content and prepared the ${format.toUpperCase()} file.`,
      actions: [
        documentActionType === "create_document"
          ? {
              id: actionId,
              type: "create_document",
              title: titleCase(topic),
              topic,
              format
            }
          : {
              id: actionId,
              type: "generate_content",
              title: titleCase(topic),
              topic,
              prompt: `Create polished ${contentFormatFromExport(format)} content about: ${topic}. Match the requested output format .${format}.`,
              format: contentFormatFromExport(format)
            },
        createExportAction(trimmed, topic, actionId, intent)
      ] as AgentAction[]
    };
  }

  return null;
}

function fallbackDayPlan(input: string): PlannerResult {
  return {
    message: "I've planned this into concrete tasks.",
    actions: [
      {
        id: createAgentId(),
        type: "create_task",
        title: "Review the request and define the outcome",
        time: "09:00",
        priority: "high"
      },
      {
        id: createAgentId(),
        type: "create_task",
        title: "Complete the most important execution block",
        time: "10:00",
        priority: "high"
      },
      {
        id: createAgentId(),
        type: "create_task",
        title: "Review progress and prepare next steps",
        time: "16:00",
        priority: "medium"
      },
      {
        id: createAgentId(),
        type: "create_note",
        title: "Planning context",
        content: `Original request: ${input}`
      }
    ]
  };
}

export async function planner(input: string, context: PlannerContext): Promise<PlannerResult> {
  const deterministic = deterministicPlan(input, context.conversationFiles);
  if (deterministic) return deterministic;

  if (!context.completePlan) {
    return fallbackDayPlan(input);
  }

  const prompt = [
    "You are NovaMind AI's action planner.",
    'Return only valid JSON with this exact shape: {"message":"...","actions":[...]}',
    "Plan one or more executable local actions. Never tell the user to do it manually.",
    "Allowed action types and fields:",
    "- generate_content: {type,title,topic,prompt,format}",
    "- create_file: {type,title,topic,prompt,format,location,content}",
    "- create_note: {type,title,content,contentFromActionId}",
    "- create_document: {type,title,topic,format,content,contentFromActionId}",
    "- save_file: {type,title,filename,location,format,content,contentFromActionId}",
    "- download_file: {type,title,filename,format,content,contentFromActionId}",
    "- convert_file: {type,title,targetFormat,location,sourceActionId,sourceFilename,filename}",
    "- rename_file/update_file_title: {type,title,sourceFormat,newTitle,newFilename,instruction,location}",
    "- update_file_content/improve_file/regenerate_file: {type,title,sourceFormat,instruction,content,location}",
    "- export_file: {type,title,sourceFormat,targetFormat,location}",
    "- summarize_file: {type,title,sourceFormat}",
    "- create_task: {type,title,time,dueAt,priority}",
    "- create_checklist: {type,title,items,content,contentFromActionId}",
    "- create_report: {type,title,topic,content,contentFromActionId}",
    "- create_email_draft: {type,title,to,subject,body,contentFromActionId}",
    "- store_memory: {type,title,key,value,memoryType,confidence}",
    "- retrieve_memory: {type,title,query}",
    "- summarize_content: {type,title,sourceText,contentFromActionId,format}",
    "- export_content: {type,title,filename,location,format,content,contentFromActionId}",
    "Use contentFromActionId to pass generated content into later file/note/export actions.",
    "File format rules: notes default to txt; report/document/proposal defaults to docx; presentation defaults to pptx; spreadsheet/checklist defaults to csv unless xlsx is requested; markdown/md only when explicitly requested.",
    "Formats: text, markdown, json, csv, html for content; txt, md, pdf, docx, json, csv, html, xlsx, pptx for files.",
    "Locations: desktop, downloads, browser.",
    "",
    "Relevant local context and memory:",
    relevantContextText(context.relevantContext),
    "",
    "Conversation files available for references like previous file, last file, az önceki dosya:",
    context.conversationFiles?.length
      ? context.conversationFiles
          .map((file) => `- ${file.id}: ${file.title} (${file.filename}, .${file.format}, v${file.version})`)
          .join("\n")
      : "No generated files in this conversation yet.",
    "",
    `User request: ${input}`
  ].join("\n");

  try {
    const raw = await context.completePlan(prompt, { signal: context.signal });
    return normalizePlannerResult(extractJsonObject(raw));
  } catch {
    return fallbackDayPlan(input);
  }
}
