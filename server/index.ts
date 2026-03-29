import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { toFile } from "openai";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSystemPrompt, type AssistantMode, type SmartCommand } from "./lib/commands.js";
import {
  extractDocumentText,
  SUPPORTED_DOCUMENT_TYPES,
  truncateDocumentContext
} from "./lib/documents.js";
import { getOpenAIClient } from "./lib/openai.js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const staticDistCandidates = [
  path.resolve(currentDirPath, "..", "dist"),
  path.resolve(currentDirPath, "..", "..", "dist")
];
const staticDistPath = staticDistCandidates.find((candidate) => existsSync(candidate));

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "NovaMind AI API",
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    supportedDocumentTypes: SUPPORTED_DOCUMENT_TYPES
  });
});

function shouldRetryWithoutWebSearch(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("web search") ||
    message.includes("web_search") ||
    message.includes("not supported") ||
    message.includes("unsupported") ||
    message.includes("does not support")
  );
}

async function createStreamChatCompletion(options: {
  openai: ReturnType<typeof getOpenAIClient>;
  model: string;
  temperature: number;
  messages: Array<Record<string, unknown>>;
  webSearch: boolean;
}) {
  const baseRequest = {
    model: options.model,
    stream: true as const,
    temperature: options.temperature,
    messages: options.messages
  };

  try {
    return await options.openai.chat.completions.create(
      options.webSearch
        ? {
            ...baseRequest,
            web_search_options: {
              search_context_size: "high"
            }
          }
        : baseRequest
    );
  } catch (error) {
    if (options.webSearch && shouldRetryWithoutWebSearch(error)) {
      return options.openai.chat.completions.create(baseRequest);
    }

    throw error;
  }
}

app.post("/api/chat/stream", async (req, res) => {
  const {
    messages,
    command,
    mode = "chat",
    model = "gpt-4o-mini",
    temperature = 0.4,
    systemPrompt = "",
    webSearch = false,
    imageDataUrl
  }: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    command?: SmartCommand | null;
    mode?: AssistantMode;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    webSearch?: boolean;
    imageDataUrl?: string;
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Chat history is required." });
    return;
  }

  try {
    const openai = getOpenAIClient();
    const lastMessageIndex = messages.length - 1;
    const modelMessages = messages.map((message, index) => {
      if (imageDataUrl && index === lastMessageIndex && message.role === "user") {
        const promptText =
          typeof message.content === "string" ? message.content : JSON.stringify(message.content);
        return {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "The latest shared screen image is attached to this message. Analyze what is visible on the screen directly before answering.\n\nUser question:\n" +
                promptText
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
                detail: "high"
              }
            }
          ]
        };
      }

      return message;
    });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    });

    const stream = await createStreamChatCompletion({
      openai,
      model,
      temperature,
      webSearch: webSearch && !Boolean(imageDataUrl),
      messages: [
        {
          role: "system",
          content: buildSystemPrompt({
            mode,
            command,
            userSystemPrompt: systemPrompt
          })
        },
        ...modelMessages
      ]
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";

      if (delta) {
        res.write(`data: ${JSON.stringify({ type: "delta", text: delta })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected chat error.";

    if (!res.headersSent) {
      res.status(500).json({ error: message });
      return;
    }

    res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
    res.end();
  }
});

app.post("/api/vision/analyze", async (req, res) => {
  const {
    imageDataUrl,
    prompt = "Explain what is visible on screen and answer the user's likely intent.",
    model = "gpt-4o-mini"
  }: {
    imageDataUrl?: string;
    prompt?: string;
    model?: string;
  } = req.body;

  if (!imageDataUrl) {
    res.status(400).json({ error: "imageDataUrl is required." });
    return;
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are NovaMind AI screen reader mode. Describe relevant UI, text, code, or equations and solve the user's task when possible."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    res.json({
      analysis: response.choices[0]?.message?.content ?? "No analysis returned."
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Vision request failed."
    });
  }
});

app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const model = String(req.body.model || "gpt-4o-mini");

  if (!file) {
    res.status(400).json({ error: "Document file is required." });
    return;
  }

  try {
    const openai = getOpenAIClient();
    const extractedText = await extractDocumentText(file);
    const { text: context, truncated } = truncateDocumentContext(extractedText);

    const summary = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Summarize uploaded documents for a knowledge worker. Return a short summary followed by bullet-style key points and notable actions or risks."
        },
        {
          role: "user",
          content: `Document name: ${file.originalname}\n\n${context}`
        }
      ]
    });

    res.json({
      id: crypto.randomUUID(),
      name: file.originalname,
      size: file.size,
      extractedText,
      truncated,
      summary: summary.choices[0]?.message?.content ?? "No summary returned."
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Document analysis failed."
    });
  }
});

app.post("/api/documents/extract", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "Document file is required." });
    return;
  }

  try {
    const extractedText = await extractDocumentText(file);
    res.json({ extractedText });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Document extraction failed."
    });
  }
});

app.post("/api/documents/ask", async (req, res) => {
  const {
    documentText,
    question,
    model = "gpt-4o-mini"
  }: {
    documentText?: string;
    question?: string;
    model?: string;
  } = req.body;

  if (!documentText?.trim() || !question?.trim()) {
    res.status(400).json({ error: "Both documentText and question are required." });
    return;
  }

  try {
    const openai = getOpenAIClient();
    const { text: context, truncated } = truncateDocumentContext(documentText);
    const answer = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Answer questions strictly using the supplied document context. If context is missing, say so clearly."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nDocument context:\n${context}`
        }
      ]
    });

    res.json({
      truncated,
      answer: answer.choices[0]?.message?.content ?? "No answer returned."
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Document Q&A failed."
    });
  }
});

app.post("/api/speech/transcribe", upload.single("audio"), async (req, res) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "Audio file is required." });
    return;
  }

  try {
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(file.buffer, file.originalname || "recording.webm", {
        type: file.mimetype || "audio/webm"
      }),
      model: "whisper-1"
    });

    res.json({ text: transcription.text });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Speech-to-text failed."
    });
  }
});

app.post("/api/speech/tts", async (req, res) => {
  const {
    text,
    voice = "nova"
  }: {
    text?: string;
    voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  } = req.body;

  if (!text?.trim()) {
    res.status(400).json({ error: "text is required." });
    return;
  }

  try {
    const openai = getOpenAIClient();
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text.slice(0, 4000)
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Text-to-speech failed."
    });
  }
});

if (staticDistPath) {
  app.use(express.static(staticDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.sendFile(path.join(staticDistPath, "index.html"));
  });
}

app.listen(port, host, () => {
  console.log(`NovaMind AI listening on http://${host}:${port}`);
});
