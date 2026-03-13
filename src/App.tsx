import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { createConversation, defaultSettings, loadAppSettings, loadConversations, saveAppSettings, saveConversations } from "./lib/storage";
import { makeConversationTitle, modeToPage, pageToMode } from "./lib/utils";
import { CodeAssistantPage } from "./pages/CodeAssistant";
import { ChatPage } from "./pages/Chat";
import { DocumentsPage } from "./pages/Documents";
import { ScreenAIPage } from "./pages/ScreenAI";
import { SettingsPage } from "./pages/Settings";
import { VoiceModePage } from "./pages/VoiceMode";
import { streamChatResponse } from "./services/ai";
import { playSpeech } from "./services/speech";
import type { AppSettings, ChatMessage, ChatMode, Conversation, PageId } from "./types/app";
import { parseSmartCommand } from "./lib/smartCommands";

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function loadInitialConversations() {
  const stored = loadConversations();
  if (stored.length > 0) {
    return sortConversations(stored);
  }

  return [createConversation("chat")];
}

const bootConversations = loadInitialConversations();

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...defaultSettings,
    ...loadAppSettings()
  }));
  const [conversations, setConversations] = useState<Conversation[]>(bootConversations);
  const [activePage, setActivePage] = useState<PageId>("chat");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    bootConversations[0]?.id ?? null
  );
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    const mode = pageToMode(activePage);
    if (!mode) return;

    const selectedConversation = conversations.find((item) => item.id === selectedConversationId);
    if (selectedConversation?.mode === mode) return;

    const latestForMode = conversations.find((item) => item.mode === mode);
    if (latestForMode) {
      setSelectedConversationId(latestForMode.id);
      return;
    }

    const created = createConversation(mode);
    setConversations((current) => sortConversations([created, ...current]));
    setSelectedConversationId(created.id);
  }, [activePage, conversations, selectedConversationId]);

  const activeMode = pageToMode(activePage);

  const activeConversation = useMemo(() => {
    if (!activeMode) return null;

    const selected = conversations.find(
      (conversation) =>
        conversation.id === selectedConversationId && conversation.mode === activeMode
    );

    if (selected) return selected;

    return conversations.find((conversation) => conversation.mode === activeMode) ?? null;
  }, [activeMode, conversations, selectedConversationId]);

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

  function handleNewConversation(mode: ChatMode) {
    const conversation = createConversation(mode);
    setConversations((current) => sortConversations([conversation, ...current]));
    setSelectedConversationId(conversation.id);
    setActivePage(modeToPage(mode));
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

  async function sendConversationMessage(
    conversation: Conversation | null,
    mode: ChatMode,
    rawInput: string
  ) {
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
        source: mode === "voice" ? "voice" : "chat"
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
        mode,
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

      const finalText = aggregated.trim() || "No response returned.";

      updateConversation(conversation.id, (current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        messages: current.messages.map((message) =>
          message.id === assistantId ? { ...message, content: finalText } : message
        )
      }));

      if (settings.voiceAutoSpeak && mode === "voice") {
        void speakMessage(assistantId, finalText);
      }
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Request failed.";
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

  const sharedChatProps = {
    conversation: activeConversation,
    settings,
    isSending: pendingConversationId === activeConversation?.id,
    speakingMessageId,
    onSpeak: speakMessage
  };

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto grid h-[calc(100vh-2rem)] max-w-[1760px] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Sidebar
          activePage={activePage}
          conversations={conversations}
          selectedConversationId={activeConversation?.id ?? selectedConversationId}
          onNavigate={setActivePage}
          onSelectConversation={(conversationId) => {
            const conversation = conversations.find((item) => item.id === conversationId);
            if (!conversation) return;
            setSelectedConversationId(conversationId);
            setActivePage(modeToPage(conversation.mode));
          }}
          onNewConversation={handleNewConversation}
        />

        <main className="min-h-0">
          {activePage === "chat" ? (
            <ChatPage
              {...sharedChatProps}
              onSend={(value) => sendConversationMessage(activeConversation, "chat", value)}
              onNewConversation={() => handleNewConversation("chat")}
            />
          ) : null}

          {activePage === "code" ? (
            <CodeAssistantPage
              {...sharedChatProps}
              onSend={(value) => sendConversationMessage(activeConversation, "code", value)}
              onNewConversation={() => handleNewConversation("code")}
            />
          ) : null}

          {activePage === "voice" ? (
            <VoiceModePage
              {...sharedChatProps}
              onSend={(value) => sendConversationMessage(activeConversation, "voice", value)}
              onNewConversation={() => handleNewConversation("voice")}
              onTranscriptSend={async (text) => {
                await sendConversationMessage(activeConversation, "voice", text);
              }}
            />
          ) : null}

          {activePage === "screen" ? <ScreenAIPage settings={settings} /> : null}
          {activePage === "documents" ? <DocumentsPage settings={settings} /> : null}
          {activePage === "settings" ? (
            <SettingsPage settings={settings} onChange={setSettings} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
