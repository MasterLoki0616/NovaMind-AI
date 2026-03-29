import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import mammoth from "mammoth";
import type { ChatMode, ModelName, SmartCommand, TtsVoice } from "../types/app";

interface DesktopChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

interface DesktopChatRequest {
  apiKey: string;
  mode: ChatMode;
  messages: DesktopChatMessageInput[];
  model: ModelName;
  temperature: number;
  systemPrompt: string;
  command?: SmartCommand | null;
  webSearch?: boolean;
  imageDataUrl?: string;
  inputMethod?: "text" | "voice";
}

interface DesktopChatStreamEvent {
  streamId: string;
  kind: "delta" | "done" | "error";
  text?: string | null;
  message?: string | null;
}

interface DesktopScreenRequest {
  apiKey: string;
  imageDataUrl: string;
  prompt: string;
  model: ModelName;
}

interface DesktopSpeechRequest {
  apiKey: string;
  text: string;
  voice: TtsVoice;
}

interface DesktopTranscriptionRequest {
  apiKey: string;
  audioBase64: string;
  mimeType: string;
  fileName: string;
}

interface DesktopDocumentSummaryRequest {
  apiKey: string;
  fileName: string;
  extractedText: string;
  model: ModelName;
}

interface DesktopDocumentSummaryResponse {
  summary: string;
  truncated: boolean;
}

function extractDesktopErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    const directMessage = candidate.message;

    if (typeof directMessage === "string" && directMessage.trim()) {
      return directMessage;
    }

    const nestedError = candidate.error;
    if (typeof nestedError === "string" && nestedError.trim()) {
      return nestedError;
    }

    if (typeof nestedError === "object" && nestedError !== null) {
      const nestedMessage = (nestedError as Record<string, unknown>).message;
      if (typeof nestedMessage === "string" && nestedMessage.trim()) {
        return nestedMessage;
      }
    }
  }

  return null;
}

export async function invokeDesktop<T>(command: string, args?: Record<string, unknown>) {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(extractDesktopErrorMessage(error) ?? "Desktop AI request failed.");
  }
}

function requireDesktopApiKey(apiKey: string) {
  if (!isTauri()) {
    throw new Error("Desktop AI commands are only available inside the app.");
  }

  if (!apiKey.trim()) {
    throw new Error("Add your OpenAI API key in Settings to use the desktop app.");
  }
}

function stripDataUrlPrefix(dataUrl: string) {
  const [, base64 = dataUrl] = dataUrl.split(",", 2);
  return base64;
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(blob);
  });
}

export async function desktopChatCompletion(request: DesktopChatRequest) {
  requireDesktopApiKey(request.apiKey);
  return invokeDesktop<string>("desktop_chat_completion", { request });
}

function createAbortError() {
  return Object.assign(new Error("The request was aborted."), {
    name: "AbortError"
  });
}

export async function desktopChatCompletionStream(
  request: DesktopChatRequest,
  options: {
    signal?: AbortSignal;
    onDelta: (chunk: string) => void;
  }
) {
  requireDesktopApiKey(request.apiKey);

  const streamId = crypto.randomUUID();

  return new Promise<void>(async (resolve, reject) => {
    let settled = false;
    let unlisten: (() => void) | null = null;

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      options.signal?.removeEventListener("abort", handleAbort);
      unlisten?.();
      unlisten = null;

      if (error) {
        reject(error);
        return;
      }

      resolve();
    };

    const handleAbort = () => {
      finish(createAbortError());
    };

    try {
      unlisten = await listen<DesktopChatStreamEvent>("desktop-chat-stream", (event) => {
        const payload = event.payload;

        if (!payload || payload.streamId !== streamId) {
          return;
        }

        if (payload.kind === "delta" && payload.text) {
          options.onDelta(payload.text);
          return;
        }

        if (payload.kind === "done") {
          finish();
          return;
        }

        if (payload.kind === "error") {
          finish(new Error(payload.message?.trim() || "Desktop AI streaming failed."));
        }
      });

      if (options.signal?.aborted) {
        finish(createAbortError());
        return;
      }

      options.signal?.addEventListener("abort", handleAbort, { once: true });

      await invokeDesktop<void>("desktop_chat_stream", {
        request: {
          streamId,
          ...request
        }
      });
    } catch (error) {
      finish(
        new Error(extractDesktopErrorMessage(error) ?? "Desktop AI streaming failed to start.")
      );
    }
  });
}

export async function desktopAnalyzeScreen(request: DesktopScreenRequest) {
  requireDesktopApiKey(request.apiKey);
  return invokeDesktop<string>("desktop_analyze_screen", { request });
}

export async function desktopTranscribeAudio(apiKey: string, audio: Blob) {
  requireDesktopApiKey(apiKey);
  const audioDataUrl = await blobToDataUrl(audio);

  return invokeDesktop<string>("desktop_transcribe_audio", {
    request: {
      apiKey,
      audioBase64: stripDataUrlPrefix(audioDataUrl),
      mimeType: audio.type || "audio/webm",
      fileName: "recording.webm"
    } satisfies DesktopTranscriptionRequest
  });
}

export async function desktopRequestSpeech(apiKey: string, text: string, voice: TtsVoice) {
  requireDesktopApiKey(apiKey);
  const audioBase64 = await invokeDesktop<string>("desktop_text_to_speech", {
    request: {
      apiKey,
      text,
      voice
    } satisfies DesktopSpeechRequest
  });

  return base64ToBlob(audioBase64, "audio/mpeg");
}

async function extractBuiltinDocumentText(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
    return file.text();
  }

  if (lowerName.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  throw new Error("The built-in desktop mode supports TXT, MD, and DOCX files. Use a custom API URL for PDF support.");
}

export async function desktopSummarizeDocument(
  apiKey: string,
  file: File,
  model: ModelName
) {
  requireDesktopApiKey(apiKey);
  const extractedText = await extractBuiltinDocumentText(file);

  if (!extractedText.trim()) {
    throw new Error("This file did not contain readable text.");
  }

  const result = await invokeDesktop<DesktopDocumentSummaryResponse>("desktop_summarize_document", {
    request: {
      apiKey,
      fileName: file.name,
      extractedText,
      model
    } satisfies DesktopDocumentSummaryRequest
  });

  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    extractedText,
    summary: result.summary,
    truncated: result.truncated,
    createdAt: new Date().toISOString()
  };
}
