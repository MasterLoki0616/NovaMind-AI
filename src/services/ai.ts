import type { ChatMode, DocumentRecord, ModelName, SmartCommand } from "../types/app";
import { usesDesktopAiBridge } from "../lib/runtime";
import {
  desktopAnalyzeScreen,
  desktopChatCompletionStream,
  desktopSummarizeDocument
} from "./desktop";
import { fetchFormData, fetchJson, getApiUrl, safeReadError } from "./api";

interface StreamChatParams {
  baseUrl: string;
  mode: ChatMode;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  model: ModelName;
  temperature: number;
  systemPrompt: string;
  apiKey?: string;
  command?: SmartCommand | null;
  webSearch?: boolean;
  imageDataUrl?: string;
  inputMethod?: "text" | "voice";
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}

export async function streamChatResponse({
  baseUrl,
  mode,
  messages,
  model,
  temperature,
  systemPrompt,
  apiKey = "",
  command,
  webSearch = false,
  imageDataUrl,
  inputMethod = "text",
  signal,
  onDelta
}: StreamChatParams) {
  console.debug("[NovaMind][streamChatResponse]", {
    inputMethod,
    mode,
    messageCount: messages.length,
    hasScreenContext: Boolean(imageDataUrl),
    webSearch
  });

  if (usesDesktopAiBridge(baseUrl)) {
    await desktopChatCompletionStream(
      {
        apiKey,
        mode,
        messages,
        model,
        temperature,
        systemPrompt,
        command,
        webSearch,
        imageDataUrl,
        inputMethod
      },
      {
        signal,
        onDelta
      }
    );

    return;
  }

  const response = await fetch(getApiUrl(baseUrl, "/api/chat/stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mode,
      messages,
      model,
      temperature,
      systemPrompt,
      command,
      webSearch,
      imageDataUrl
    }),
    signal
  });

  if (!response.ok) {
    throw new Error(await safeReadError(response));
  }

  if (!response.body) {
    throw new Error("Streaming is not supported by this environment.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const payload = JSON.parse(line.slice(5).trim()) as
          | { type: "delta"; text: string }
          | { type: "done" }
          | { type: "error"; message: string };

        if (payload.type === "delta") {
          onDelta(payload.text);
        }

        if (payload.type === "error") {
          throw new Error(payload.message);
        }
      }
    }
  }
}

export async function analyzeScreenImage(
  baseUrl: string,
  imageDataUrl: string,
  prompt: string,
  model: ModelName,
  apiKey = ""
) {
  if (usesDesktopAiBridge(baseUrl)) {
    const analysis = await desktopAnalyzeScreen({
      apiKey,
      imageDataUrl,
      prompt,
      model
    });

    return { analysis };
  }

  return fetchJson<{ analysis: string }>(baseUrl, "/api/vision/analyze", {
    method: "POST",
    body: JSON.stringify({ imageDataUrl, prompt, model })
  });
}

export async function uploadDocument(
  baseUrl: string,
  file: File,
  model: ModelName,
  apiKey = ""
) {
  if (usesDesktopAiBridge(baseUrl)) {
    return desktopSummarizeDocument(apiKey, file, model);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", model);

  const result = await fetchFormData<
    Omit<DocumentRecord, "createdAt"> & {
      truncated: boolean;
    }
  >(baseUrl, "/api/documents/upload", formData);

  return {
    ...result,
    createdAt: new Date().toISOString()
  } satisfies DocumentRecord;
}

export async function askDocumentQuestion(
  baseUrl: string,
  documentText: string,
  question: string,
  model: ModelName
) {
  return fetchJson<{ answer: string; truncated: boolean }>(baseUrl, "/api/documents/ask", {
    method: "POST",
    body: JSON.stringify({ documentText, question, model })
  });
}
