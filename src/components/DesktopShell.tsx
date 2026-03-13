import { LoaderCircle, MonitorSmartphone, Plus, Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import logoUrl from "../../logo.jpeg";
import { parseSmartCommand } from "../lib/smartCommands";
import {
  createConversation,
  defaultSettings,
  loadAppSettings,
  loadConversations,
  saveAppSettings,
  saveConversations
} from "../lib/storage";
import {
  bytesToReadable,
  formatRelativeTime,
  makeConversationTitle,
  truncate
} from "../lib/utils";
import { analyzeScreenImage, streamChatResponse, uploadDocument } from "../services/ai";
import { captureScreenImage, cropImageDataUrl } from "../services/screen";
import { playSpeech } from "../services/speech";
import type {
  AppSettings,
  ChatMessage,
  Conversation,
  ScreenSelection
} from "../types/app";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChatWindow } from "./ChatWindow";
import { CompactComposer } from "./CompactComposer";
import { Input } from "./ui/input";
import { ScreenCapture } from "./ScreenCapture";

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function loadInitialConversations() {
  const stored = loadConversations().filter((conversation) => conversation.mode === "chat");
  if (stored.length > 0) {
    return sortConversations(stored);
  }

  return [createConversation("chat")];
}

function createScreenAssistantState() {
  return {
    open: false,
    imageDataUrl: null as string | null,
    selection: null as ScreenSelection | null,
    prompt: "Explain what is on this screen and tell me the fastest way to help.",
    status: "idle" as "idle" | "capturing" | "analyzing",
    error: null as string | null
  };
}

const bootConversations = loadInitialConversations();

export function DesktopShell() {
  const [settings] = useState<AppSettings>(() => ({
    ...defaultSettings,
    ...loadAppSettings()
  }));
  const [conversations, setConversations] = useState<Conversation[]>(bootConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    bootConversations[0]?.id ?? null
  );
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [screenAssistant, setScreenAssistant] = useState(createScreenAssistantState);

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const activeConversation = useMemo(() => {
    const selected = conversations.find((conversation) => conversation.id === selectedConversationId);
    return selected ?? conversations[0] ?? null;
  }, [conversations, selectedConversationId]);

  const recentConversations = conversations.slice(0, 6);

  function updateConversation(
    conversationId: string,
    updater: (conversation: Conversation) => Conversation
  ) {
    setConversations((current) =>
      sortConversations(
        current.map((conversation) =>
          conversation.id === conversationId ? updater(conversation) : conversation
        )
      )
    );
  }

  function handleNewConversation() {
    const created = createConversation("chat");
    setConversations((current) => sortConversations([created, ...current]));
    setSelectedConversationId(created.id);
  }

  async function speakMessage(messageId: string, text: string) {
    if (!text.trim()) return;

    setSpeakingMessageId(messageId);

    try {
      const audio = await playSpeech(settings.apiBaseUrl, text, settings.voiceName);
      audio.addEventListener(
        "ended",
        () => {
          setSpeakingMessageId((current) => (current === messageId ? null : current));
        },
        { once: true }
      );
    } catch {
      setSpeakingMessageId(null);
    }
  }

  async function sendConversationMessage(rawInput: string) {
    const conversation = activeConversation;
    if (!conversation) return false;

    const parsed = parseSmartCommand(rawInput);
    const content = parsed.content.trim();

    if (!content) {
      return false;
    }

    const timestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: timestamp,
      meta: {
        command: parsed.command,
        source: "chat"
      }
    };
    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: timestamp
    };

    updateConversation(conversation.id, (current) => ({
      ...current,
      title: current.messages.length === 0 ? makeConversationTitle(content) : current.title,
      updatedAt: timestamp,
      messages: [...current.messages, userMessage, assistantMessage]
    }));

    setPendingConversationId(conversation.id);
    let aggregated = "";

    try {
      await streamChatResponse({
        baseUrl: settings.apiBaseUrl,
        mode: "chat",
        model: settings.defaultModel,
        temperature: settings.temperature,
        systemPrompt: settings.systemPrompt,
        command: parsed.command,
        messages: [...conversation.messages, userMessage].map((message) => ({
          role: message.role,
          content: message.content
        })),
        onDelta(chunk) {
          aggregated += chunk;
          updateConversation(conversation.id, (current) => ({
            ...current,
            updatedAt: new Date().toISOString(),
            messages: current.messages.map((message) =>
              message.id === assistantId ? { ...message, content: aggregated } : message
            )
          }));
        }
      });

      const finalText = aggregated.trim() || "NovaMind returned an empty response.";

      updateConversation(conversation.id, (current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        messages: current.messages.map((message) =>
          message.id === assistantId ? { ...message, content: finalText } : message
        )
      }));
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "The request failed.";
      updateConversation(conversation.id, (current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        messages: current.messages.map((message) =>
          message.id === assistantId ? { ...message, content: `Error: ${errorText}` } : message
        )
      }));
    } finally {
      setPendingConversationId(null);
    }

    return true;
  }

  function appendResolvedToolResult(
    conversationId: string,
    userContent: string,
    assistantContent: string,
    source: "document" | "screen"
  ) {
    const timestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
      createdAt: timestamp,
      meta: { source }
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: assistantContent,
      createdAt: timestamp,
      meta: { source }
    };

    updateConversation(conversationId, (current) => ({
      ...current,
      title: current.messages.length === 0 ? makeConversationTitle(userContent) : current.title,
      updatedAt: timestamp,
      messages: [...current.messages, userMessage, assistantMessage]
    }));
  }

  async function handleFilesSelected(files: FileList | File[]) {
    const file = Array.from(files)[0];
    const conversation = activeConversation;
    if (!file || !conversation) return;

    setIsUploadingFile(true);
    setBusyLabel(`Uploading and summarizing ${file.name}...`);

    try {
      const record = await uploadDocument(settings.apiBaseUrl, file, settings.defaultModel);
      appendResolvedToolResult(
        conversation.id,
        `Analyze ${record.name}`,
        `## ${record.name}\n\nSize: ${bytesToReadable(record.size)}\n\n${record.summary}`,
        "document"
      );
    } catch (error) {
      appendResolvedToolResult(
        conversation.id,
        `Analyze ${file.name}`,
        `Error: ${error instanceof Error ? error.message : "Document analysis failed."}`,
        "document"
      );
    } finally {
      setIsUploadingFile(false);
      setBusyLabel(null);
    }
  }

  async function captureForScreenAssistant() {
    setScreenAssistant((current) => ({
      ...current,
      open: true,
      status: "capturing",
      error: null
    }));

    try {
      const capture = await captureScreenImage();
      setScreenAssistant((current) => ({
        ...current,
        open: true,
        imageDataUrl: capture,
        selection: null,
        status: "idle",
        error: null
      }));
    } catch (error) {
      setScreenAssistant((current) => ({
        ...current,
        open: true,
        status: "idle",
        error: error instanceof Error ? error.message : "Screen capture failed."
      }));
    }
  }

  function openScreenAssistant() {
    setScreenAssistant((current) => ({
      ...current,
      open: true,
      error: null
    }));
    void captureForScreenAssistant();
  }

  async function handleAnalyzeScreen() {
    const conversation = activeConversation;
    if (!conversation || !screenAssistant.imageDataUrl) return;

    setBusyLabel("Analyzing the captured screen...");
    setScreenAssistant((current) => ({
      ...current,
      status: "analyzing",
      error: null
    }));

    try {
      const cropped = await cropImageDataUrl(
        screenAssistant.imageDataUrl,
        screenAssistant.selection
      );
      const result = await analyzeScreenImage(
        settings.apiBaseUrl,
        cropped,
        screenAssistant.prompt,
        settings.defaultModel
      );

      appendResolvedToolResult(
        conversation.id,
        `Analyze the screen: ${screenAssistant.prompt}`,
        result.analysis,
        "screen"
      );
      setScreenAssistant(createScreenAssistantState());
    } catch (error) {
      setScreenAssistant((current) => ({
        ...current,
        status: "idle",
        error: error instanceof Error ? error.message : "Screen analysis failed."
      }));
    } finally {
      setBusyLabel(null);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-50" />

      <div className="relative mx-auto flex h-screen max-w-[1240px] flex-col px-4 py-4 sm:px-6">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="NovaMind AI logo"
              className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
            />
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-sky-200/75">
                Compact Desktop
              </div>
              <h1 className="font-heading text-xl font-semibold text-white">NovaMind AI</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-100">
              {settings.defaultModel}
            </Badge>
            <Badge className="border-white/10 bg-white/[0.04] text-slate-300">
              Chat + Screen + File + Voice
            </Badge>
            <Button variant="secondary" onClick={handleNewConversation}>
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </div>
        </header>

        <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="glass-panel hidden min-h-0 flex-col overflow-hidden p-4 lg:flex">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-heading text-lg font-semibold text-white">Recent sessions</div>
                <div className="text-sm text-slate-400">Saved locally and ready to reopen fast.</div>
              </div>
              <Badge>{conversations.length}</Badge>
            </div>

            <div className="space-y-2 overflow-y-auto">
              {recentConversations.map((conversation) => {
                const active = conversation.id === activeConversation?.id;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-[24px] border px-3 py-3 text-left transition ${
                      active
                        ? "border-sky-400/25 bg-sky-400/10"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="font-medium text-white">{truncate(conversation.title, 26)}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {conversation.messages.length} messages - {formatRelativeTime(conversation.updatedAt)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-[28px] border border-white/10 bg-black/25 p-4 text-sm text-slate-300">
              <div className="mb-2 flex items-center gap-2 font-medium text-white">
                <Sparkles className="h-4 w-4 text-sky-300" />
                Quick actions
              </div>
              Stay in chat to write. Use the monitor icon for screen help and the upload icon for
              document summaries.
            </div>
          </aside>

          <main className="glass-panel flex min-h-0 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
              <div>
                <div className="font-heading text-2xl font-semibold text-white">
                  {activeConversation?.title ?? "NovaMind"}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  A focused AI chat space with screen, file, and voice tools one tap away.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="border-white/10 bg-white/[0.04] text-slate-300">
                  {activeConversation?.messages.length ?? 0} messages
                </Badge>
                <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                  Ready
                </Badge>
              </div>
            </div>

            <ChatWindow
              messages={activeConversation?.messages ?? []}
              emptyTitle="Start chatting with NovaMind"
              emptyDescription="Open the screen tool, attach a file, or speak with your microphone. Everything else stays in one clean chat flow."
              speakingMessageId={speakingMessageId}
              onSpeak={speakMessage}
            />

            <div className="border-t border-white/10 p-4 sm:p-5">
              <CompactComposer
                apiBaseUrl={settings.apiBaseUrl}
                isSending={pendingConversationId === activeConversation?.id}
                isUploadingFile={isUploadingFile}
                onSend={sendConversationMessage}
                onOpenScreenAssistant={openScreenAssistant}
                onFilesSelected={handleFilesSelected}
              />

              {busyLabel ? (
                <div className="mt-3 flex items-center gap-2 px-1 text-xs text-slate-400">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {busyLabel}
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>

      {screenAssistant.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="glass-panel flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <div className="font-heading text-2xl font-semibold text-white">Screen Assistant</div>
                <div className="text-sm text-slate-400">
                  Capture the screen, select an area, and tell NovaMind what to focus on.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setScreenAssistant(createScreenAssistantState())}>
                  Close
                </Button>
                <Button
                  onClick={() => void handleAnalyzeScreen()}
                  disabled={!screenAssistant.imageDataUrl || screenAssistant.status !== "idle"}
                >
                  {screenAssistant.status === "analyzing" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <MonitorSmartphone className="h-4 w-4" />
                  )}
                  Analyze
                </Button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-h-0 overflow-hidden rounded-[30px] border border-white/10 bg-black/25 p-4">
                <ScreenCapture
                  imageDataUrl={screenAssistant.imageDataUrl}
                  selection={screenAssistant.selection}
                  isCapturing={screenAssistant.status === "capturing"}
                  onCapture={captureForScreenAssistant}
                  onSelectionChange={(selection) =>
                    setScreenAssistant((current) => ({ ...current, selection }))
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                    <Upload className="h-4 w-4 text-sky-300" />
                    What should NovaMind focus on?
                  </div>
                  <Input
                    value={screenAssistant.prompt}
                    onChange={(event) =>
                      setScreenAssistant((current) => ({
                        ...current,
                        prompt: event.target.value
                      }))
                    }
                    placeholder="Example: Explain the error on this screen and tell me how to fix it."
                  />
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 text-sm text-slate-300">
                  <div className="mb-2 font-medium text-white">What this mode does</div>
                  It captures the screen, crops the selected area, and adds the answer back into your
                  main chat instead of sending you to another page.
                </div>

                {screenAssistant.error ? (
                  <div className="rounded-[28px] border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                    {screenAssistant.error}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
