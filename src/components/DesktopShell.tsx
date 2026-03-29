import {
  Check,
  ChevronDown,
  Moon,
  MonitorSmartphone,
  PencilLine,
  Plus,
  Settings2,
  Sparkles,
  Sun,
  Trash2,
  X,
  Upload
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import logoUrl from "../../logo.png";
import { getAppText } from "../lib/i18n";
import { chatModelGroups, getChatModelOption } from "../lib/models";
import { usesDesktopAiBridge } from "../lib/runtime";
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
import { prepareDocumentAttachment } from "../services/attachments";
import { analyzeScreenImage, streamChatResponse } from "../services/ai";
import { loadAttachmentPreview, type LoadedAttachmentPreview } from "../services/filePreview";
import {
  captureScreenImage,
  captureVideoFrame,
  createPreviewVideoFromStream,
  cropImageDataUrl,
  openLiveScreenStream
} from "../services/screen";
import { requestSpeechBlob, transcribeAudio } from "../services/speech";
import type {
  AppTheme,
  AttachmentRecord,
  AppSettings,
  ChatMessage,
  Conversation,
  ScreenSelection
} from "../types/app";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChatWindow } from "./ChatWindow";
import { CompactComposer } from "./CompactComposer";
import { FeedbackButton } from "./FeedbackButton";
import { FilePreviewModal } from "./FilePreviewModal";
import { Input } from "./ui/input";
import { GlowLoader } from "./ui/glow-loader";
import { LiveScreenShareOverlay } from "./LiveScreenShareOverlay";
import { ScreenCapture } from "./ScreenCapture";
import { Textarea } from "./ui/textarea";
import {
  VoiceChatOverlay,
  type VoiceChatStatus,
  type VoiceChatTurn
} from "./VoiceChatOverlay";

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
const themeOptions: Array<{
  id: AppTheme;
  label: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    id: "ai",
    label: "AI theme",
    description: "Signature NovaMind glow with brand colors.",
    icon: Sparkles
  },
  {
    id: "dark",
    label: "Dark",
    description: "Low-glare contrast for focused work.",
    icon: Moon
  },
  {
    id: "light",
    label: "Light",
    description: "Bright canvas with softer panels.",
    icon: Sun
  }
];

const VOICE_ACTIVITY_THRESHOLD = 0.03;
const VOICE_INTERRUPT_THRESHOLD = 0.05;
const VOICE_INTERRUPT_HOLD_MS = 160;
const VOICE_MAX_RECORDING_MS = 60_000;
const VOICE_MIN_RECORDING_MS = 1_200;
const VOICE_SILENCE_MS = 1_500;
const VOICE_SESSION_TURN_LIMIT = 8;
const VOICE_ANALYSIS_INTERVAL_MS = 80;
const TTS_SENTENCE_MIN_CHARS = 24;
const TTS_SOFT_CHUNK_CHARS = 110;
const LIVE_SCREEN_FRAME_INTERVAL_MS = 350;

type AudioDeviceOption = {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
};

type SendMessageOptions = {
  imageDataUrl?: string;
  attachments?: AttachmentRecord[];
  inputMethod?: "text" | "voice";
  source?: "chat" | "document" | "screen" | "voice";
  autoSpeakReply?: boolean;
  signal?: AbortSignal;
  forceFreshScreenFrame?: boolean;
  onDelta?: (partial: string) => void;
  onResolved?: (response: string) => void;
  onError?: (errorText: string) => void;
};

export function DesktopShell() {
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...defaultSettings,
    ...loadAppSettings()
  }));
  const [conversations, setConversations] = useState<Conversation[]>(bootConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    bootConversations[0]?.id ?? null
  );
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentRecord[]>([]);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [screenAssistant, setScreenAssistant] = useState(createScreenAssistantState);
  const [isLiveScreenOpen, setIsLiveScreenOpen] = useState(false);
  const [isLiveScreenStarting, setIsLiveScreenStarting] = useState(false);
  const [isLiveScreenWatching, setIsLiveScreenWatching] = useState(false);
  const [isLiveScreenAnswering, setIsLiveScreenAnswering] = useState(false);
  const [liveScreenStream, setLiveScreenStream] = useState<MediaStream | null>(null);
  const [liveScreenError, setLiveScreenError] = useState<string | null>(null);
  const [liveScreenLatestQuestion, setLiveScreenLatestQuestion] = useState("");
  const [liveScreenLatestAnswer, setLiveScreenLatestAnswer] = useState("");
  const [liveScreenVoiceReplies, setLiveScreenVoiceReplies] = useState(() =>
    (defaultSettings.voiceAutoSpeak ?? true)
  );
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [audioDevices, setAudioDevices] = useState<AudioDeviceOption[]>([]);
  const [audioOutputSelectionSupported, setAudioOutputSelectionSupported] = useState(true);
  const [isRenamingConversation, setIsRenamingConversation] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentRecord | null>(null);
  const [previewData, setPreviewData] = useState<LoadedAttachmentPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [voiceChatStatus, setVoiceChatStatus] = useState<VoiceChatStatus>("ready");
  const [voiceChatError, setVoiceChatError] = useState<string | null>(null);
  const [voiceChatTranscript, setVoiceChatTranscript] = useState("");
  const [voiceChatReply, setVoiceChatReply] = useState("");
  const [voiceChatAudioLevel, setVoiceChatAudioLevel] = useState(0);
  const [voiceAssistantSurface, setVoiceAssistantSurface] = useState<"overlay" | "screen" | null>(
    null
  );
  const [draftConversationTitle, setDraftConversationTitle] = useState("");
  const [modelMenuPosition, setModelMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 360
  });
  const modelTriggerRef = useRef<HTMLButtonElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const voiceLoopEnabledRef = useRef(false);
  const voiceSessionIdRef = useRef(0);
  const voiceMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<BlobPart[]>([]);
  const voiceAudioContextRef = useRef<AudioContext | null>(null);
  const voiceSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const voiceAnalyserRef = useRef<AnalyserNode | null>(null);
  const voiceAnimationFrameRef = useRef<number | null>(null);
  const voiceSpeechDetectedRef = useRef(false);
  const voiceStartedAtRef = useRef(0);
  const voiceLastSpeechAtRef = useRef(0);
  const voiceResponseAbortRef = useRef<AbortController | null>(null);
  const voicePlaybackRef = useRef<HTMLAudioElement | null>(null);
  const voiceInterruptStreamRef = useRef<MediaStream | null>(null);
  const voiceInterruptAudioContextRef = useRef<AudioContext | null>(null);
  const voiceInterruptSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const voiceInterruptAnalyserRef = useRef<AnalyserNode | null>(null);
  const voiceInterruptAnimationFrameRef = useRef<number | null>(null);
  const voiceInterruptDetectedAtRef = useRef(0);
  const voiceSpeechQueueRef = useRef<Array<{ text: string; blobPromise?: Promise<Blob> }>>([]);
  const voiceSpeechRemainderRef = useRef("");
  const voiceSpeechPlayingRef = useRef(false);
  const voiceSpeechGenerationRef = useRef(0);
  const liveScreenStreamRef = useRef<MediaStream | null>(null);
  const liveScreenPreviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveScreenFrameIntervalRef = useRef<number | null>(null);
  const liveScreenLatestFrameRef = useRef<string | null>(null);

  function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === "string" && error.trim()) {
      return error;
    }

    if (typeof error === "object" && error !== null) {
      const value = error as Record<string, unknown>;

      if (typeof value.message === "string" && value.message.trim()) {
        return value.message;
      }

      if (typeof value.error === "string" && value.error.trim()) {
        return value.error;
      }
    }

    return fallback;
  }

  function logMessageDispatch(
    stage: string,
    details: {
      inputMethod: "text" | "voice";
      source: "chat" | "document" | "screen" | "voice";
      hasScreenContext: boolean;
      messageCount?: number;
      latestMessagePreview?: string;
    }
  ) {
    console.debug("[NovaMind][message-dispatch]", {
      stage,
      ...details
    });
  }

  function isAbortError(error: unknown) {
    if (error instanceof DOMException) {
      return error.name === "AbortError";
    }

    if (error instanceof Error) {
      return error.name === "AbortError" || /aborted/i.test(error.message);
    }

    return typeof error === "string" && /aborted/i.test(error);
  }

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLiveScreenVoiceReplies(settings.voiceAutoSpeak);
  }, [settings.voiceAutoSpeak]);

  const loadAudioDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setAudioDevices([]);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const formatted = devices
        .filter((device) => device.kind === "audioinput" || device.kind === "audiooutput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          kind: device.kind,
          label:
            device.label ||
            (device.kind === "audioinput" ? `Microphone ${index + 1}` : `Speaker ${index + 1}`)
        }));

      setAudioDevices(formatted);
      setAudioOutputSelectionSupported(
        typeof HTMLMediaElement !== "undefined" &&
          typeof (HTMLMediaElement.prototype as HTMLMediaElement & {
            setSinkId?: (sinkId: string) => Promise<void>;
          }).setSinkId === "function"
      );
    } catch {
      setAudioDevices([]);
    }
  }, []);

  useEffect(() => {
    void loadAudioDevices();

    if (!navigator.mediaDevices?.addEventListener) {
      return;
    }

    const handleDeviceChange = () => {
      void loadAudioDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  }, [loadAudioDevices]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (!conversations.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId(conversations[0]?.id ?? null);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    return () => {
      voiceLoopEnabledRef.current = false;
      voiceSessionIdRef.current += 1;
      voiceResponseAbortRef.current?.abort();
      const recorder = voiceMediaRecorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }

      releaseVoiceCapture();
      stopVoiceInterruptMonitor();
      stopVoicePlayback();
      stopLiveScreenShare();
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const insideTrigger = modelTriggerRef.current?.contains(target);
      const insideMenu = modelMenuRef.current?.contains(target);

      if (!insideTrigger && !insideMenu) {
        setIsModelMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModelMenuOpen(false);
        setIsSettingsOpen(false);
        if (isVoiceChatOpen) {
          closeVoiceChat();
        }
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVoiceChatOpen]);

  useEffect(() => {
    if (!isModelMenuOpen) {
      return;
    }

    function updateMenuPosition() {
      const rect = modelTriggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const width = Math.min(360, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));

      setModelMenuPosition({
        top: rect.bottom + 10,
        left,
        width
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isModelMenuOpen]);

  const activeConversation = useMemo(() => {
    const selected = conversations.find((conversation) => conversation.id === selectedConversationId);
    return selected ?? conversations[0] ?? null;
  }, [conversations, selectedConversationId]);

  const recentConversations = conversations;
  const selectedModel = useMemo(
    () => getChatModelOption(settings.defaultModel),
    [settings.defaultModel]
  );
  const inputDevices = useMemo(
    () => audioDevices.filter((device) => device.kind === "audioinput"),
    [audioDevices]
  );
  const outputDevices = useMemo(
    () => audioDevices.filter((device) => device.kind === "audiooutput"),
    [audioDevices]
  );
  const isUsingDesktopAi = usesDesktopAiBridge(settings.apiBaseUrl);
  const needsDesktopApiKey = isUsingDesktopAi && !settings.openAiApiKey.trim();
  const text = getAppText(settings.language);
  const liveScreenSessionTurns = useMemo(
    () =>
      activeConversation
        ? trimVoiceTurns(
            activeConversation.messages
              .filter(
                (message) =>
                  message.meta?.source === "screen" &&
                  (message.role === "user" || message.role === "assistant") &&
                  message.content.trim().length > 0
              )
              .map((message) => ({
                id: message.id,
                role: message.role,
                text: message.content
              }))
          )
        : [],
    [activeConversation]
  );
  const voiceOverlayTurns = useMemo(
    () =>
      voiceAssistantSurface === "screen"
        ? liveScreenSessionTurns
        : recentVoiceTurnsFromConversation(activeConversation),
    [activeConversation, liveScreenSessionTurns, voiceAssistantSurface]
  );

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

  function updateConversationMessage(
    conversationId: string,
    messageId: string,
    updater: (message: ChatMessage) => ChatMessage
  ) {
    updateConversation(conversationId, (current) => ({
      ...current,
      messages: current.messages.map((message) =>
        message.id === messageId ? updater(message) : message
      )
    }));
  }

  function handleNewConversation() {
    const created = createConversation("chat");
    setConversations((current) => sortConversations([created, ...current]));
    setSelectedConversationId(created.id);
    setIsRenamingConversation(false);
    setDraftConversationTitle("");
    setPendingAttachments([]);
  }

  function handleDeleteConversation(conversationId: string) {
    setPendingConversationId((current) => (current === conversationId ? null : current));
    setConversations((current) => {
      const remaining = current.filter((conversation) => conversation.id !== conversationId);
      return remaining.length > 0 ? sortConversations(remaining) : [createConversation("chat")];
    });
    setIsRenamingConversation(false);
    setDraftConversationTitle("");
    setPendingAttachments([]);
  }

  function handleSidebarRename(conversationId: string) {
    const targetConversation = conversations.find((conversation) => conversation.id === conversationId);
    if (!targetConversation) return;

    setSelectedConversationId(conversationId);
    setDraftConversationTitle(targetConversation.title);
    setIsRenamingConversation(true);
  }

  function handleSidebarDelete(conversationId: string) {
    handleDeleteConversation(conversationId);
  }

  function startRenamingConversation() {
    if (!activeConversation) return;
    setDraftConversationTitle(activeConversation.title);
    setIsRenamingConversation(true);
  }

  function saveConversationTitle() {
    if (!activeConversation) return;

    const nextTitle = draftConversationTitle.trim() || text.newSession;
    updateConversation(activeConversation.id, (current) => ({
      ...current,
      title: nextTitle,
      updatedAt: new Date().toISOString()
    }));
    setIsRenamingConversation(false);
  }

  function createRuntimeSystemPrompt() {
    const parts = [
      "Remember prior turns in this conversation and continue naturally without asking the user to repeat information already discussed.",
      "In voice chat, answer like a thoughtful human conversation partner: concise first, but still complete, grounded, and easy to speak aloud.",
      "When the question is technical, research-heavy, or depends on current information, prefer web-backed or documentation-backed reasoning when the model and tools allow it.",
      "If the latest user turn includes a live screen image, treat it as visible context. Analyze what is on the screen directly and do not claim that you cannot see the screen when an image is attached."
    ];

    if (settings.systemPrompt.trim()) {
      parts.push(`User preference: ${settings.systemPrompt.trim()}`);
    }

    return parts.join("\n\n");
  }

  function getPreferredAudioConstraints(): MediaTrackConstraints {
    return {
      deviceId: settings.preferredInputDeviceId
        ? { exact: settings.preferredInputDeviceId }
        : undefined,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
  }

  async function applySelectedOutputDevice(audio: HTMLAudioElement) {
    if (!settings.preferredOutputDeviceId) {
      return;
    }

    const candidate = audio as HTMLAudioElement & {
      setSinkId?: (sinkId: string) => Promise<void>;
    };

    if (typeof candidate.setSinkId !== "function") {
      return;
    }

    try {
      await candidate.setSinkId(settings.preferredOutputDeviceId);
    } catch {
      // Ignore unsupported output routing failures and fall back to default output.
    }
  }

  function buildMessageContentForModel(input: string, attachments: AttachmentRecord[]) {
    const trimmedInput = input.trim();

    if (attachments.length === 0) {
      return trimmedInput;
    }

    const attachmentBlocks = attachments.map((attachment) => {
      const header = `Attached file: ${attachment.name}`;
      const body =
        attachment.extractedText?.trim() ||
        `[No inline text was extracted. File type: ${attachment.previewKind ?? attachment.kind}.]`;
      return `${header}\n${body}`;
    });

    return [trimmedInput, text.askAboutAttachedFiles, ...attachmentBlocks]
      .filter(Boolean)
      .join("\n\n");
  }

  async function openAttachmentPreview(attachment: AttachmentRecord) {
    setPreviewAttachment(attachment);
    setPreviewData(null);
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const preview = await loadAttachmentPreview(attachment);
      setPreviewData(preview);
    } catch (error) {
      setPreviewError(getErrorMessage(error, text.previewUnavailable));
    } finally {
      setIsPreviewLoading(false);
    }
  }

  function trimVoiceTurns(turns: VoiceChatTurn[]) {
    return turns.slice(-VOICE_SESSION_TURN_LIMIT);
  }

  function splitSpeechSegments(
    input: string,
    options: {
      flush?: boolean;
    } = {}
  ) {
    const segments: string[] = [];
    let remaining = input;

    while (remaining.length > 0) {
      const boundaryMatches = Array.from(remaining.matchAll(/[\.\!\?\n:;](?:\s|$)/g));
      const lastBoundary = boundaryMatches.at(-1);

      if (lastBoundary && lastBoundary.index !== undefined) {
        const boundaryEnd = lastBoundary.index + lastBoundary[0].length;
        const candidate = remaining.slice(0, boundaryEnd).trim();

        if (candidate.length >= TTS_SENTENCE_MIN_CHARS) {
          segments.push(candidate);
          remaining = remaining.slice(boundaryEnd).trimStart();
          continue;
        }
      }

      if (!options.flush && remaining.length < TTS_SOFT_CHUNK_CHARS) {
        break;
      }

      const softBreak = remaining.lastIndexOf(" ", TTS_SOFT_CHUNK_CHARS);
      if (softBreak > 40) {
        segments.push(remaining.slice(0, softBreak).trim());
        remaining = remaining.slice(softBreak).trimStart();
        continue;
      }

      if (options.flush) {
        segments.push(remaining.trim());
        remaining = "";
      }

      break;
    }

    return {
      segments: segments.filter(Boolean),
      remainder: remaining
    };
  }

  function resetVoiceSpeechPipeline() {
    voiceSpeechGenerationRef.current += 1;
    voiceSpeechQueueRef.current = [];
    voiceSpeechRemainderRef.current = "";
    voiceSpeechPlayingRef.current = false;
  }

  function recentVoiceTurnsFromConversation(conversation: Conversation | null | undefined) {
    if (!conversation) {
      return [] as VoiceChatTurn[];
    }

    return trimVoiceTurns(
      conversation.messages
        .filter(
          (message) =>
            (message.role === "user" || message.role === "assistant") && message.content.trim()
        )
        .map((message) => ({
          id: message.id,
          role: message.role,
          text: message.content
        }))
    );
  }

  function resetLiveScreenSession() {
    setLiveScreenLatestQuestion("");
    setLiveScreenLatestAnswer("");
    setLiveScreenError(null);
  }

  function stopVoiceInterruptMonitor() {
    if (voiceInterruptAnimationFrameRef.current !== null) {
      window.clearInterval(voiceInterruptAnimationFrameRef.current);
      voiceInterruptAnimationFrameRef.current = null;
    }

    try {
      voiceInterruptSourceRef.current?.disconnect();
    } catch {
      // Ignore disconnect races during teardown.
    }

    voiceInterruptSourceRef.current = null;
    voiceInterruptAnalyserRef.current = null;
    voiceInterruptDetectedAtRef.current = 0;

    if (voiceInterruptStreamRef.current) {
      voiceInterruptStreamRef.current.getTracks().forEach((track) => track.stop());
      voiceInterruptStreamRef.current = null;
    }

    const audioContext = voiceInterruptAudioContextRef.current;
    voiceInterruptAudioContextRef.current = null;
    if (audioContext) {
      void audioContext.close().catch(() => undefined);
    }
  }

  function stopVoicePlayback() {
    resetVoiceSpeechPipeline();
    const audio = voicePlaybackRef.current;
    if (!audio) {
      return;
    }

    voicePlaybackRef.current = null;
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
  }

  function stopVoiceAnalysis() {
    if (voiceAnimationFrameRef.current !== null) {
      window.clearInterval(voiceAnimationFrameRef.current);
      voiceAnimationFrameRef.current = null;
    }

    try {
      voiceSourceRef.current?.disconnect();
    } catch {
      // Ignore disconnect races during teardown.
    }

    voiceSourceRef.current = null;
    voiceAnalyserRef.current = null;

    const audioContext = voiceAudioContextRef.current;
    voiceAudioContextRef.current = null;
    if (audioContext) {
      void audioContext.close().catch(() => undefined);
    }

    setVoiceChatAudioLevel(0);
  }

  function releaseVoiceCapture(preserveChunks = false) {
    stopVoiceAnalysis();
    voiceMediaRecorderRef.current = null;

    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((track) => track.stop());
      voiceStreamRef.current = null;
    }

    voiceSpeechDetectedRef.current = false;
    voiceStartedAtRef.current = 0;
    voiceLastSpeechAtRef.current = 0;

    if (!preserveChunks) {
      voiceChunksRef.current = [];
    }
  }

  function stopVoiceRecording() {
    const recorder = voiceMediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    releaseVoiceCapture();
  }

  function closeVoiceChat() {
    voiceLoopEnabledRef.current = false;
    voiceSessionIdRef.current += 1;
    voiceResponseAbortRef.current?.abort();
    voiceResponseAbortRef.current = null;

    const recorder = voiceMediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }

    releaseVoiceCapture();
    stopVoiceInterruptMonitor();
    stopVoicePlayback();
    setIsVoiceChatOpen(false);
    setVoiceChatStatus("ready");
    setVoiceChatError(null);
    setVoiceChatTranscript("");
    setVoiceChatReply("");
    setVoiceAssistantSurface(null);
  }

  async function startVoiceInterruptMonitor(sessionId: number) {
    if (
      !voiceLoopEnabledRef.current ||
      sessionId !== voiceSessionIdRef.current ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof window === "undefined"
    ) {
      return;
    }

    stopVoiceInterruptMonitor();

    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getPreferredAudioConstraints()
      });
      void loadAudioDevices();

      if (!voiceLoopEnabledRef.current || sessionId !== voiceSessionIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      const analyser = audioContext.createAnalyser();
      gainNode.gain.value = settings.inputGain;
      analyser.fftSize = 2048;
      source.connect(gainNode);
      gainNode.connect(analyser);

      voiceInterruptStreamRef.current = stream;
      voiceInterruptAudioContextRef.current = audioContext;
      voiceInterruptSourceRef.current = source;
      voiceInterruptAnalyserRef.current = analyser;
      voiceInterruptDetectedAtRef.current = 0;

      const samples = new Uint8Array(analyser.fftSize);

      const tick = () => {
        if (
          !voiceLoopEnabledRef.current ||
          sessionId !== voiceSessionIdRef.current ||
          !voicePlaybackRef.current
        ) {
          stopVoiceInterruptMonitor();
          return;
        }

        analyser.getByteTimeDomainData(samples);

        let sum = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const normalized = (samples[index] - 128) / 128;
          sum += normalized * normalized;
        }

        const rms = Math.sqrt(sum / samples.length);
        const now = Date.now();

        if (rms >= VOICE_INTERRUPT_THRESHOLD) {
          if (!voiceInterruptDetectedAtRef.current) {
            voiceInterruptDetectedAtRef.current = now;
          }

          if (now - voiceInterruptDetectedAtRef.current >= VOICE_INTERRUPT_HOLD_MS) {
            voiceResponseAbortRef.current?.abort();
            voiceResponseAbortRef.current = null;
            stopVoicePlayback();
            stopVoiceInterruptMonitor();
            setVoiceChatReply("");
            setVoiceChatStatus("listening");
            window.setTimeout(() => {
              void beginVoiceListening(sessionId);
            }, 60);
            return;
          }
        } else {
          voiceInterruptDetectedAtRef.current = 0;
        }
      };

      tick();
      voiceInterruptAnimationFrameRef.current = window.setInterval(
        tick,
        VOICE_ANALYSIS_INTERVAL_MS
      );
    } catch {
      stopVoiceInterruptMonitor();
    }
  }

  async function pumpVoiceSpeechQueue(sessionId: number) {
    const voiceSessionActive = voiceLoopEnabledRef.current;
    if (voiceSpeechPlayingRef.current) {
      return;
    }

    if (voiceSessionActive && sessionId !== voiceSessionIdRef.current) {
      return;
    }

    const nextChunk = voiceSpeechQueueRef.current.shift();
    if (!nextChunk) {
      return;
    }

    voiceSpeechPlayingRef.current = true;
    const generation = voiceSpeechGenerationRef.current;
    const queuedItem = nextChunk;

    try {
      setVoiceChatStatus("speaking");
      const blob =
        queuedItem.blobPromise ??
        requestSpeechBlob(
          settings.apiBaseUrl,
          queuedItem.text,
          settings.voiceName,
          settings.openAiApiKey
        );
      const resolvedBlob = await blob;

      if (
        generation !== voiceSpeechGenerationRef.current ||
        (voiceLoopEnabledRef.current && sessionId !== voiceSessionIdRef.current)
      ) {
        return;
      }

      if (voiceSpeechQueueRef.current[0] && !voiceSpeechQueueRef.current[0].blobPromise) {
        const upcoming = voiceSpeechQueueRef.current[0];
        upcoming.blobPromise = requestSpeechBlob(
          settings.apiBaseUrl,
          upcoming.text,
          settings.voiceName,
          settings.openAiApiKey
        );
      }

      const url = URL.createObjectURL(resolvedBlob);
      const audio = new Audio(url);
      await applySelectedOutputDevice(audio);
      voicePlaybackRef.current = audio;

      try {
        void startVoiceInterruptMonitor(sessionId);
        await audio.play();

        await new Promise<void>((resolve, reject) => {
          function finalize() {
            audio.removeEventListener("ended", finalize);
            audio.removeEventListener("pause", finalize);
            audio.removeEventListener("error", handleError);
            resolve();
          }

          function handleError() {
            audio.removeEventListener("ended", finalize);
            audio.removeEventListener("pause", finalize);
            audio.removeEventListener("error", handleError);
            reject(new Error("Voice playback failed."));
          }

          audio.addEventListener("ended", finalize, { once: true });
          audio.addEventListener("pause", finalize, { once: true });
          audio.addEventListener("error", handleError, { once: true });
        });
      } finally {
        stopVoiceInterruptMonitor();
        if (voicePlaybackRef.current === audio) {
          voicePlaybackRef.current = null;
        }

        URL.revokeObjectURL(url);
      }
    } finally {
      if (generation === voiceSpeechGenerationRef.current) {
        voiceSpeechPlayingRef.current = false;
        if (voiceSpeechQueueRef.current.length > 0) {
          void pumpVoiceSpeechQueue(sessionId);
        } else if (
          voiceLoopEnabledRef.current &&
          sessionId === voiceSessionIdRef.current &&
          voiceChatStatus === "speaking"
        ) {
          setVoiceChatStatus("thinking");
        }
      }
    }
  }

  function queueVoiceSpeech(textToSpeak: string, sessionId: number, flush = false) {
    const merged = `${voiceSpeechRemainderRef.current}${textToSpeak}`;
    const { segments, remainder } = splitSpeechSegments(merged, { flush });
    voiceSpeechRemainderRef.current = flush ? "" : remainder;

    if (segments.length === 0) {
      return;
    }

    voiceSpeechQueueRef.current.push(
      ...segments.map((segment) => ({
        text: segment
      }))
    );

    if (
      voiceSpeechQueueRef.current.length > 0 &&
      !voiceSpeechQueueRef.current[0].blobPromise
    ) {
      const first = voiceSpeechQueueRef.current[0];
      first.blobPromise = requestSpeechBlob(
        settings.apiBaseUrl,
        first.text,
        settings.voiceName,
        settings.openAiApiKey
      );
    }

    void pumpVoiceSpeechQueue(sessionId);
  }

  async function playVoiceReply(textToSpeak: string, sessionId: number) {
    resetVoiceSpeechPipeline();
    queueVoiceSpeech(textToSpeak, sessionId, true);
    await pumpVoiceSpeechQueue(sessionId);
  }

  async function sendVoiceTurn(transcript: string, sessionId: number) {
    const usingScreenContext = isLiveScreenOpen;
    const shouldSpeakReply = !usingScreenContext || liveScreenVoiceReplies;
    setVoiceChatTranscript(transcript);
    setVoiceChatReply("");
    setVoiceChatStatus("thinking");
    setVoiceChatError(null);
    const abortController = new AbortController();
    voiceResponseAbortRef.current = abortController;

    try {
      const sharedOptions: SendMessageOptions = {
        inputMethod: "voice",
        source: usingScreenContext ? "screen" : "voice",
        autoSpeakReply: shouldSpeakReply,
        signal: abortController.signal,
        forceFreshScreenFrame: usingScreenContext,
        onDelta: (partial) => {
          setVoiceChatReply(partial);
        },
        onResolved: (reply) => {
          setVoiceChatReply(reply);
        },
        onError: (errorText) => {
          setVoiceChatError(errorText);
        }
      };
      const sent = usingScreenContext
        ? await sendLiveScreenQuestion(transcript, sharedOptions)
        : await sendConversationMessage(transcript, sharedOptions);

      if (!sent) {
        setVoiceChatStatus("error");
        setVoiceChatError("A conversation is required for voice chat.");
        return;
      }

      if (!voiceLoopEnabledRef.current || sessionId !== voiceSessionIdRef.current) {
        return;
      }
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      setVoiceChatStatus("error");
      setVoiceChatError(getErrorMessage(error, text.voiceInputError));
    } finally {
      if (voiceResponseAbortRef.current === abortController) {
        voiceResponseAbortRef.current = null;
      }
    }

    if (voiceLoopEnabledRef.current && sessionId === voiceSessionIdRef.current) {
      setVoiceChatStatus("ready");
    }
  }

  async function beginVoiceListening(sessionId = voiceSessionIdRef.current) {
    if (!voiceLoopEnabledRef.current || sessionId !== voiceSessionIdRef.current) {
      return;
    }

    if (needsDesktopApiKey) {
      setVoiceChatStatus("error");
      setVoiceChatError(text.addApiKeyPrompt);
      return;
    }

    if (pendingConversationId || voiceMediaRecorderRef.current) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceChatStatus("error");
      setVoiceChatError(text.microphoneAccessFailed);
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setVoiceChatStatus("error");
      setVoiceChatError(text.voiceInputError);
      return;
    }

    try {
      setVoiceChatError(null);
      setVoiceChatStatus("listening");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getPreferredAudioConstraints()
      });
      void loadAudioDevices();

      if (!voiceLoopEnabledRef.current || sessionId !== voiceSessionIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const preferredMimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : undefined;
      let recorder: MediaRecorder;

      voiceChunksRef.current = [];
      voiceStreamRef.current = stream;
      voiceSpeechDetectedRef.current = false;
      voiceStartedAtRef.current = Date.now();
      voiceLastSpeechAtRef.current = Date.now();

      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        const analyser = audioContext.createAnalyser();
        const destination = audioContext.createMediaStreamDestination();

        gainNode.gain.value = settings.inputGain;
        analyser.fftSize = 2048;
        source.connect(gainNode);
        gainNode.connect(analyser);
        gainNode.connect(destination);

        voiceAudioContextRef.current = audioContext;
        voiceSourceRef.current = source;
        voiceAnalyserRef.current = analyser;

        recorder = preferredMimeType
          ? new MediaRecorder(destination.stream, { mimeType: preferredMimeType })
          : new MediaRecorder(destination.stream);
      } else {
        recorder = preferredMimeType
          ? new MediaRecorder(stream, { mimeType: preferredMimeType })
          : new MediaRecorder(stream);
      }

      voiceMediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setVoiceChatStatus("error");
        setVoiceChatError(text.voiceInputError);
        releaseVoiceCapture();
      };

      recorder.onstop = () => {
        const recordedChunks = [...voiceChunksRef.current];
        const mimeType = recorder.mimeType || "audio/webm";
        voiceChunksRef.current = [];
        releaseVoiceCapture(true);
        const usingScreenContext = voiceAssistantSurface === "screen" && isLiveScreenOpen;

        if (!voiceLoopEnabledRef.current || sessionId !== voiceSessionIdRef.current) {
          return;
        }

        const audio = new Blob(recordedChunks, { type: mimeType });
        if (audio.size < 512) {
          setVoiceChatStatus("ready");
          return;
        }

        setVoiceChatStatus(usingScreenContext ? "thinking" : "transcribing");
        void transcribeAudio(settings.apiBaseUrl, audio, settings.openAiApiKey)
          .then(async (result) => {
            const transcript = result.text.trim();

            if (!transcript) {
              throw new Error(text.voiceInputError);
            }

            if (!voiceLoopEnabledRef.current || sessionId !== voiceSessionIdRef.current) {
              return;
            }

            await sendVoiceTurn(transcript, sessionId);

            if (!voiceLoopEnabledRef.current || sessionId !== voiceSessionIdRef.current) {
              return;
            }

            window.setTimeout(() => {
              void beginVoiceListening(sessionId);
            }, 260);
          })
          .catch((error) => {
            if (!voiceLoopEnabledRef.current || sessionId !== voiceSessionIdRef.current) {
              return;
            }

            if (isAbortError(error)) {
              return;
            }

            setVoiceChatStatus("error");
            setVoiceChatError(getErrorMessage(error, text.voiceInputError));
          });
      };

      if (AudioContextClass) {
        const analyser = voiceAnalyserRef.current;

        if (!analyser) {
          recorder.start(240);
          return;
        }

        const samples = new Uint8Array(analyser.fftSize);

        const tick = () => {
        if (
          !voiceLoopEnabledRef.current ||
          sessionId !== voiceSessionIdRef.current ||
          voiceMediaRecorderRef.current !== recorder
        ) {
          stopVoiceAnalysis();
          return;
        }

          analyser.getByteTimeDomainData(samples);

          let sum = 0;
          for (let index = 0; index < samples.length; index += 1) {
            const normalized = (samples[index] - 128) / 128;
            sum += normalized * normalized;
          }

          const rms = Math.sqrt(sum / samples.length);
          setVoiceChatAudioLevel(Math.min(1, rms * 10));

          const now = Date.now();
          if (rms > VOICE_ACTIVITY_THRESHOLD) {
            voiceSpeechDetectedRef.current = true;
            voiceLastSpeechAtRef.current = now;
          }

          const hasMinimumSpeech =
            voiceSpeechDetectedRef.current &&
            now - voiceStartedAtRef.current >= VOICE_MIN_RECORDING_MS;
          const silenceReached =
            voiceSpeechDetectedRef.current &&
            now - voiceLastSpeechAtRef.current >= VOICE_SILENCE_MS;
          const reachedMaxLength = now - voiceStartedAtRef.current >= VOICE_MAX_RECORDING_MS;

          if ((hasMinimumSpeech && silenceReached) || reachedMaxLength) {
            stopVoiceRecording();
            return;
          }
        };

        tick();
        voiceAnimationFrameRef.current = window.setInterval(tick, VOICE_ANALYSIS_INTERVAL_MS);
      }

      recorder.start(240);
    } catch (error) {
      releaseVoiceCapture();
      setVoiceChatStatus("error");
      setVoiceChatError(getErrorMessage(error, text.microphoneAccessFailed));
    }
  }

  function startVoiceAssistant(surface: "overlay" | "screen" = "overlay") {
    const targetSurface = isLiveScreenOpen ? "screen" : surface;

    if (targetSurface === "screen") {
      setVoiceAssistantSurface("screen");
      setIsVoiceChatOpen(false);
      setVoiceChatStatus("ready");
      setVoiceChatError(null);
      setVoiceChatTranscript("");
      setVoiceChatReply("");
      setVoiceChatAudioLevel(0);
      voiceLoopEnabledRef.current = true;
      voiceSessionIdRef.current += 1;
      resetVoiceSpeechPipeline();

      window.setTimeout(() => {
        void beginVoiceListening(voiceSessionIdRef.current);
      }, 120);
      return;
    }

    const conversationId = activeConversation?.id ?? selectedConversationId;
    if (!conversationId) {
      return;
    }

    if (surface === "overlay") {
      setScreenAssistant(createScreenAssistantState());
    }
    setSelectedConversationId(conversationId);
    setVoiceAssistantSurface(surface);
    setIsVoiceChatOpen(surface === "overlay");
    setVoiceChatStatus("ready");
    setVoiceChatError(null);
    setVoiceChatTranscript("");
    setVoiceChatReply("");
    setVoiceChatAudioLevel(0);
    voiceLoopEnabledRef.current = true;
    voiceSessionIdRef.current += 1;
    resetVoiceSpeechPipeline();

    window.setTimeout(() => {
      void beginVoiceListening(voiceSessionIdRef.current);
    }, 120);
  }

  function renderModelPicker() {
    if (!isModelMenuOpen || typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <div className="pointer-events-none fixed inset-0 z-[140]">
        <div
          ref={modelMenuRef}
          className="pointer-events-auto fixed overflow-hidden rounded-[30px] border border-border/80 bg-card/95 shadow-[0_28px_80px_rgba(15,23,42,0.58)] backdrop-blur-xl"
          style={{
            top: modelMenuPosition.top,
            left: modelMenuPosition.left,
            width: modelMenuPosition.width
          }}
        >
          <div className="border-b border-border/80 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {text.modelPickerTitle}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {text.modelPickerDescription}
            </div>
          </div>

          <div className="max-h-[420px] space-y-4 overflow-y-auto px-4 py-4">
            {chatModelGroups.map((group) => (
              <div key={group.id}>
                <div className="text-[10px] uppercase tracking-[0.24em] text-primary/80">
                  {group.label}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{group.description}</div>
                <div className="mt-3 space-y-2">
                  {group.options.map((model) => {
                    const active = settings.defaultModel === model.id;

                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSettings((current) => ({
                            ...current,
                            defaultModel: model.id
                          }));
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full rounded-[22px] border px-3 py-3 text-left transition ${
                          active
                            ? "border-primary/30 bg-primary/10"
                            : "border-border/80 bg-card/60 hover:border-border hover:bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">{model.label}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{model.id}</div>
                            <div className="mt-2 text-xs leading-6 text-muted-foreground">
                              {model.description}
                            </div>
                            {model.note ? (
                              <div className="mt-2 text-[11px] text-amber-500">
                                {model.note}
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-0.5 shrink-0">
                            {active ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/80 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {text.customModelId}
            </div>
            <Input
              value={settings.defaultModel}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  defaultModel: event.target.value
                }))
              }
              placeholder={text.enterAnotherModelId}
              className="mt-3"
            />
          </div>
        </div>
      </div>,
      document.body
    );
  }

  async function speakMessage(messageId: string, text: string) {
    if (!text.trim()) return;

    setSpeakingMessageId(messageId);

    try {
      const blob = await requestSpeechBlob(
        settings.apiBaseUrl,
        text,
        settings.voiceName,
        settings.openAiApiKey
      );
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await applySelectedOutputDevice(audio);
      await audio.play();
      audio.addEventListener(
        "ended",
        () => {
          setSpeakingMessageId((current) => (current === messageId ? null : current));
          URL.revokeObjectURL(url);
        },
        { once: true }
      );
    } catch {
      setSpeakingMessageId(null);
    }
  }

  async function sendLiveScreenMessage(rawInput: string, options?: SendMessageOptions) {
    const conversation = activeConversation;
    if (!conversation) {
      return false;
    }

    const parsed = parseSmartCommand(rawInput);
    const content = parsed.content.trim();
    const promptText = content || rawInput.trim();

    if (!promptText) {
      return false;
    }

    const frame =
      options?.imageDataUrl ??
      (await getLatestLiveScreenFrame(options?.forceFreshScreenFrame ?? true));
    if (!frame) {
      const message = text.liveScreenWaitingFrame;
      setLiveScreenError(message);
      options?.onError?.(message);
      return false;
    }

    setLiveScreenLatestQuestion(promptText);
    setLiveScreenLatestAnswer("");
    setLiveScreenError(null);
    setIsLiveScreenAnswering(true);

    try {
      return await sendMessageThroughConversation(conversation, promptText, {
        ...options,
        attachments: [],
        source: "screen",
        imageDataUrl: frame,
        onDelta: (partial) => {
          setLiveScreenLatestAnswer(partial);
          options?.onDelta?.(partial);
        },
        onResolved: (reply) => {
          setLiveScreenLatestAnswer(reply);
          options?.onResolved?.(reply);
        },
        onError: (errorText) => {
          setLiveScreenError(errorText);
          options?.onError?.(errorText);
        }
      });
    } finally {
      setIsLiveScreenAnswering(false);
    }
  }

  async function sendMessageThroughConversation(
    conversation: Conversation,
    rawInput: string,
    options?: SendMessageOptions
  ) {
    const parsed = parseSmartCommand(rawInput);
    const content = parsed.content.trim();
    const source = options?.source ?? "chat";
    const inputMethod = options?.inputMethod ?? "text";
    const attachments = options?.attachments ?? pendingAttachments;
    const speechSessionId = voiceLoopEnabledRef.current ? voiceSessionIdRef.current : Date.now();
    const inheritedScreenImage =
      isLiveScreenOpen && (source === "screen" || inputMethod === "voice")
        ? await getLatestLiveScreenFrame(options?.forceFreshScreenFrame ?? inputMethod === "voice")
        : null;
    const resolvedImageDataUrl = options?.imageDataUrl ?? inheritedScreenImage ?? undefined;

    if (!content && attachments.length === 0) {
      return false;
    }

    const timestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content || text.readyForQuestions,
      createdAt: timestamp,
      meta: {
        command: parsed.command,
        source,
        attachments
      }
    };
    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: timestamp,
      meta: {
        source
      }
    };

    updateConversation(conversation.id, (current) => ({
      ...current,
      title:
        current.messages.length === 0
          ? makeConversationTitle(content || attachments[0]?.name || text.newSession)
          : current.title,
      updatedAt: timestamp,
      messages: [...current.messages, userMessage, assistantMessage]
    }));

    if (options?.attachments === undefined) {
      setPendingAttachments([]);
    }
    setComposerError(null);
    setPendingConversationId(conversation.id);
    if (options?.autoSpeakReply) {
      resetVoiceSpeechPipeline();
    }
    let aggregated = "";
    const payloadMessages = [...conversation.messages, userMessage].map((message) => ({
      role: message.role,
      content:
        message.id === userMessage.id
          ? `${buildMessageContentForModel(message.content, attachments)}${
              resolvedImageDataUrl
                ? "\n\nA live screen image is attached to this message. Use what you see on the screen to answer."
                : ""
            }`
          : message.content
    }));

    logMessageDispatch("payload-ready", {
      inputMethod,
      source,
      hasScreenContext: Boolean(resolvedImageDataUrl),
      messageCount: payloadMessages.length,
      latestMessagePreview: payloadMessages.at(-1)?.content.slice(0, 160)
    });

    try {
      await streamChatResponse({
        baseUrl: settings.apiBaseUrl,
        mode: "chat",
        model: settings.defaultModel,
        temperature: settings.temperature,
        systemPrompt: createRuntimeSystemPrompt(),
        apiKey: settings.openAiApiKey,
        command: parsed.command,
        signal: options?.signal,
        imageDataUrl: resolvedImageDataUrl,
        webSearch: !resolvedImageDataUrl,
        inputMethod,
        messages: payloadMessages,
        onDelta(chunk) {
          aggregated += chunk;
          options?.onDelta?.(aggregated);
          if (options?.autoSpeakReply) {
            queueVoiceSpeech(chunk, speechSessionId);
          }
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
      options?.onResolved?.(finalText);

      updateConversation(conversation.id, (current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        messages: current.messages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: finalText
              }
            : message
        )
      }));

      if (options?.autoSpeakReply) {
        queueVoiceSpeech("", speechSessionId, true);
        void pumpVoiceSpeechQueue(speechSessionId);
      }
    } catch (error) {
      if (isAbortError(error)) {
        const partialText = aggregated.trim();

        updateConversation(conversation.id, (current) => ({
          ...current,
          updatedAt: new Date().toISOString(),
          messages: partialText
            ? current.messages.map((message) =>
                message.id === assistantId ? { ...message, content: partialText } : message
              )
            : current.messages.filter((message) => message.id !== assistantId)
        }));

        return true;
      }

      const errorText = error instanceof Error ? error.message : "The request failed.";
      options?.onError?.(getErrorMessage(error, errorText));
      updateConversation(conversation.id, (current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        messages: current.messages.map((message) =>
          message.id === assistantId
            ? { ...message, content: `Error: ${getErrorMessage(error, errorText)}` }
            : message
        )
      }));
    } finally {
      setPendingConversationId(null);
    }

    return true;
  }

  async function sendConversationMessage(
    rawInput: string,
    options?: SendMessageOptions
  ) {
    const shouldRouteToScreen =
      options?.source === "screen" || (options?.inputMethod === "voice" && isLiveScreenOpen);

    if (shouldRouteToScreen) {
      return sendLiveScreenMessage(rawInput, {
        ...options,
        source: "screen"
      });
    }

    const conversation = activeConversation;
    if (!conversation) {
      return false;
    }

    return sendMessageThroughConversation(conversation, rawInput, options);
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
    if (!file) return;

    setIsUploadingFile(true);
    setComposerError(null);
    setBusyLabel(`${text.uploadFile}: ${file.name}...`);

    try {
      const attachment = await prepareDocumentAttachment(settings.apiBaseUrl, file);
      setPendingAttachments((current) => [...current, attachment]);
    } catch (error) {
      setComposerError(getErrorMessage(error, text.supportedFileError));
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

  function stopLiveScreenFrameLoop() {
    if (liveScreenFrameIntervalRef.current !== null) {
      window.clearInterval(liveScreenFrameIntervalRef.current);
      liveScreenFrameIntervalRef.current = null;
    }

    liveScreenLatestFrameRef.current = null;
    setIsLiveScreenWatching(false);

    const previewVideo = liveScreenPreviewVideoRef.current;
    if (previewVideo) {
      previewVideo.pause();
      previewVideo.srcObject = null;
      liveScreenPreviewVideoRef.current = null;
    }
  }

  function stopLiveScreenShare() {
    if (voiceAssistantSurface === "screen") {
      closeVoiceChat();
    }

    stopLiveScreenFrameLoop();

    if (liveScreenStreamRef.current) {
      liveScreenStreamRef.current.getTracks().forEach((track) => track.stop());
      liveScreenStreamRef.current = null;
    }

    setLiveScreenStream(null);
    setIsLiveScreenOpen(false);
    setIsLiveScreenStarting(false);
    setIsLiveScreenAnswering(false);
    resetLiveScreenSession();
  }

  function captureFreshLiveScreenFrame() {
    if (!liveScreenPreviewVideoRef.current) {
      return null;
    }

    try {
      const frame = captureVideoFrame(liveScreenPreviewVideoRef.current);
      liveScreenLatestFrameRef.current = frame;
      setIsLiveScreenWatching(true);
      return frame;
    } catch {
      return null;
    }
  }

  async function getLatestLiveScreenFrame(forceFresh = false) {
    if (forceFresh) {
      const freshFrame = captureFreshLiveScreenFrame();
      if (freshFrame) {
        return freshFrame;
      }
    }

    if (liveScreenLatestFrameRef.current) {
      return liveScreenLatestFrameRef.current;
    }

    return captureFreshLiveScreenFrame();
  }

  async function startLiveScreenShare() {
    if (isVoiceChatOpen) {
      closeVoiceChat();
    }

    stopLiveScreenShare();
    setIsLiveScreenOpen(true);
    setIsLiveScreenStarting(true);
    resetLiveScreenSession();

    try {
      const stream = await openLiveScreenStream();
      const previewVideo = await createPreviewVideoFromStream(stream);
      const [track] = stream.getVideoTracks();

      track?.addEventListener(
        "ended",
        () => {
          stopLiveScreenShare();
        },
        { once: true }
      );

      liveScreenStreamRef.current = stream;
      liveScreenPreviewVideoRef.current = previewVideo;
      setLiveScreenStream(stream);

      try {
        liveScreenLatestFrameRef.current = captureVideoFrame(previewVideo);
        setIsLiveScreenWatching(true);
      } catch {
        liveScreenLatestFrameRef.current = null;
      }

      liveScreenFrameIntervalRef.current = window.setInterval(() => {
        if (!liveScreenPreviewVideoRef.current) {
          return;
        }

        try {
          liveScreenLatestFrameRef.current = captureVideoFrame(liveScreenPreviewVideoRef.current);
          setIsLiveScreenWatching(true);
        } catch {
          setIsLiveScreenWatching(false);
        }
      }, LIVE_SCREEN_FRAME_INTERVAL_MS);
    } catch (error) {
      setLiveScreenError(getErrorMessage(error, "Live screen sharing failed."));
    } finally {
      setIsLiveScreenStarting(false);
    }
  }

  async function sendLiveScreenQuestion(question: string, options?: SendMessageOptions) {
    let frame = await getLatestLiveScreenFrame(true);

    if (!frame) {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      frame = await getLatestLiveScreenFrame(true);
    }

    if (!frame) {
      setLiveScreenError(text.liveScreenWaitingFrame);
      return false;
    }

    setLiveScreenError(null);
    setLiveScreenLatestQuestion(question);
    setIsLiveScreenAnswering(true);
    logMessageDispatch("screen-context-captured", {
      inputMethod: options?.inputMethod ?? "text",
      source: "screen",
      hasScreenContext: Boolean(frame),
      latestMessagePreview: question.slice(0, 160)
    });

    try {
      return await sendConversationMessage(question, {
        imageDataUrl: frame,
        source: "screen",
        inputMethod: options?.inputMethod ?? "text",
        autoSpeakReply: options?.autoSpeakReply ?? liveScreenVoiceReplies,
        signal: options?.signal,
        forceFreshScreenFrame: true,
        onDelta: (partial) => {
          setLiveScreenLatestAnswer(partial);
          options?.onDelta?.(partial);
        },
        onResolved: (reply) => {
          setLiveScreenLatestAnswer(reply);
          options?.onResolved?.(reply);
        },
        onError: (errorText) => {
          setLiveScreenError(errorText);
          options?.onError?.(errorText);
        }
      });
    } finally {
      setIsLiveScreenAnswering(false);
    }
  }

  function toggleLiveScreenVoiceAssistant() {
    if (voiceAssistantSurface === "screen") {
      closeVoiceChat();
      return;
    }

    startVoiceAssistant("screen");
  }

  function openScreenAssistant() {
    void startLiveScreenShare();
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
        settings.defaultModel,
        settings.openAiApiKey
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
        error: getErrorMessage(error, "Screen analysis failed.")
      }));
    } finally {
      setBusyLabel(null);
    }
  }

  return (
    <div className="app-shell relative min-h-screen overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-50" />

      <div className="relative mx-auto flex h-screen w-full max-w-[1080px] flex-col px-3 py-3 sm:px-5 sm:py-4">
        <header className="glass-panel relative z-20 flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={logoUrl}
              alt="NovaMind AI logo"
              className="h-11 w-11 shrink-0 rounded-2xl border border-border/80 object-cover sm:h-12 sm:w-12"
            />
            <div className="min-w-0">
              <div className="truncate text-[10px] uppercase tracking-[0.24em] text-primary/80 sm:text-xs sm:tracking-[0.28em]">
                {text.compactDesktop}
              </div>
              <h1 className="truncate font-heading text-lg font-semibold text-foreground sm:text-xl">
                NovaMind AI
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <button
              ref={modelTriggerRef}
              type="button"
              onClick={() => setIsModelMenuOpen((current) => !current)}
              className="w-full min-w-0 rounded-[22px] border border-border/80 bg-card/75 px-3 py-2 text-left transition hover:border-border hover:bg-card sm:min-w-[220px] sm:max-w-[340px]"
            >
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {text.model}
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {selectedModel?.label ?? settings.defaultModel}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {selectedModel?.description ?? "Custom model ID"}
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition ${
                    isModelMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
            <Button variant="secondary" onClick={handleNewConversation} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              {text.newChat}
            </Button>
          </div>
        </header>

        <div className="mt-3 grid min-h-0 flex-1 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="glass-panel hidden min-h-0 flex-col overflow-hidden p-4 lg:flex">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-heading text-lg font-semibold text-foreground">
                {text.recentChats}
              </div>
              <Badge>{conversations.length}</Badge>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {recentConversations.map((conversation) => {
                const active = conversation.id === activeConversation?.id;

                return (
                  <div
                    key={conversation.id}
                    className={`rounded-[24px] border px-3 py-3 transition ${
                      active
                        ? "border-primary/25 bg-primary/10"
                        : "border-border/80 bg-card/70 hover:border-border hover:bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="font-medium text-foreground">
                          {truncate(conversation.title, 26)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {conversation.messages.length} {text.messages} -{" "}
                          {formatRelativeTime(conversation.updatedAt, settings.language)}
                        </div>
                      </button>

                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl"
                          onClick={() => handleSidebarRename(conversation.id)}
                          aria-label={text.renameChat}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl"
                          onClick={() => handleSidebarDelete(conversation.id)}
                          aria-label={text.deleteChat}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen((current) => !current)}
              className="mt-4 flex items-center gap-2 self-start rounded-full border border-border/80 bg-card/75 px-3 py-2 text-sm text-foreground transition hover:border-border hover:bg-card"
            >
              <Settings2 className="h-4 w-4" />
              {text.settings}
            </button>
          </aside>

          <main className="glass-panel flex min-h-0 flex-col overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border/80 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="min-w-0 flex-1">
                {isRenamingConversation ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={draftConversationTitle}
                      onChange={(event) => setDraftConversationTitle(event.target.value)}
                      className="h-11 w-full min-w-0 sm:min-w-[240px]"
                    />
                    <div className="flex items-center gap-2">
                    <Button variant="secondary" size="icon" onClick={saveConversationTitle}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsRenamingConversation(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="min-w-0 break-words font-heading text-xl font-semibold text-foreground sm:text-2xl">
                      {activeConversation?.title ?? "NovaMind"}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startRenamingConversation}
                      className="shrink-0"
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="mt-1 text-sm text-muted-foreground">{text.writeMessage}</div>
              </div>

              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                <Badge>
                  {activeConversation?.messages.length ?? 0} {text.messages}
                </Badge>
                <Button
                  variant="secondary"
                  onClick={() => activeConversation && handleDeleteConversation(activeConversation.id)}
                  disabled={!activeConversation}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  {text.deleteChat}
                </Button>
              </div>
            </div>

            {needsDesktopApiKey ? (
              <div className="border-b border-border/80 px-4 py-4 sm:px-5">
                <div className="rounded-[24px] border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-foreground">
                  {text.addApiKeyPrompt}
                </div>
              </div>
            ) : null}

            <ChatWindow
              messages={activeConversation?.messages ?? []}
              emptyTitle={text.emptyChatTitle}
              emptyDescription={text.emptyChatDescription}
              speakingMessageId={speakingMessageId}
              onSpeak={speakMessage}
              language={settings.language}
              onOpenAttachment={openAttachmentPreview}
            />

            <div className="border-t border-border/80 p-4 sm:p-5">
              <div className="mx-auto w-full max-w-[840px]">
                <CompactComposer
                  apiBaseUrl={settings.apiBaseUrl}
                  openAiApiKey={settings.openAiApiKey}
                  language={settings.language}
                  pendingAttachments={pendingAttachments}
                  isSending={pendingConversationId === activeConversation?.id}
                  isUploadingFile={isUploadingFile}
                  onSend={sendConversationMessage}
                  onOpenScreenAssistant={openScreenAssistant}
                  onOpenVoiceChat={() => startVoiceAssistant("overlay")}
                  onFilesSelected={handleFilesSelected}
                  onRemoveAttachment={(attachmentId) =>
                    setPendingAttachments((current) =>
                      current.filter((attachment) => attachment.id !== attachmentId)
                    )
                  }
                />

                {busyLabel ? (
                  <div className="mt-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
                    <GlowLoader size="sm" />
                    {busyLabel}
                  </div>
                ) : null}

                {composerError ? (
                  <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                    {composerError}
                  </div>
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsSettingsOpen((current) => !current)}
        className="fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-2 text-sm text-foreground shadow-[0_18px_44px_rgba(15,23,42,0.45)] backdrop-blur-xl transition hover:border-border hover:bg-card lg:hidden"
      >
        <Settings2 className="h-4 w-4" />
        {text.settings}
      </button>

      {renderModelPicker()}

      <FilePreviewModal
        attachment={previewAttachment}
        preview={previewData}
        isLoading={isPreviewLoading}
        error={previewError}
        language={settings.language}
        onClose={() => {
          setPreviewAttachment(null);
          setPreviewData(null);
          setPreviewError(null);
        }}
      />

      <LiveScreenShareOverlay
        isOpen={isLiveScreenOpen}
        stream={liveScreenStream}
        isStarting={isLiveScreenStarting}
        isWatching={isLiveScreenWatching}
        isAnswering={isLiveScreenAnswering}
        latestQuestion={liveScreenLatestQuestion}
        latestAnswer={liveScreenLatestAnswer}
        voiceReply={voiceChatReply}
        sessionTurns={liveScreenSessionTurns}
        voiceTranscript={voiceChatTranscript}
        error={liveScreenError}
        voiceRepliesEnabled={liveScreenVoiceReplies}
        voiceAssistantActive={voiceAssistantSurface === "screen"}
        voiceAssistantStatus={voiceChatStatus}
        voiceAssistantAudioLevel={voiceChatAudioLevel}
        language={settings.language}
        onToggleVoiceReplies={() => setLiveScreenVoiceReplies((current) => !current)}
        onToggleVoiceAssistant={toggleLiveScreenVoiceAssistant}
        onClose={stopLiveScreenShare}
        onSubmitQuestion={sendLiveScreenQuestion}
      />

      {voiceAssistantSurface === "overlay" ? (
        <VoiceChatOverlay
          isOpen={isVoiceChatOpen}
          language={settings.language}
          status={voiceChatStatus}
          audioLevel={voiceChatAudioLevel}
          error={voiceChatError}
          transcript={voiceChatTranscript}
          reply={voiceChatReply}
          turns={voiceOverlayTurns}
          onResume={() => void beginVoiceListening(voiceSessionIdRef.current)}
          onClose={closeVoiceChat}
        />
      ) : null}

      {isSettingsOpen ? (
        <div className="fixed bottom-4 left-4 z-[130] flex max-h-[calc(100vh-32px)] w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-[30px] border border-border/80 bg-card/95 shadow-[0_28px_80px_rgba(15,23,42,0.58)] backdrop-blur-xl">
          <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {text.settings}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{text.compactSettings}</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(false)}>
              {text.close}
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.language}
              </label>
              <select
                value={settings.language}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    language: event.target.value as AppSettings["language"]
                  }))
                }
                className="field-shell flex h-11 w-full rounded-2xl px-4 text-sm text-foreground outline-none focus:ring-0"
              >
                <option value="en">English</option>
                <option value="tr">Turkce</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.theme}
              </label>
              <div className="grid gap-2">
                {themeOptions.map((theme) => {
                  const Icon = theme.icon;
                  const active = settings.theme === theme.id;

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          theme: theme.id
                        }))
                      }
                      className={`flex items-start gap-3 rounded-[24px] border px-4 py-3 text-left transition ${
                        active
                          ? "border-primary/30 bg-primary/10"
                          : "border-border/80 bg-card/70 hover:border-border hover:bg-card"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-background/60 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {theme.id === "ai"
                            ? text.aiTheme
                            : theme.id === "dark"
                              ? text.dark
                              : text.light}
                        </div>
                        <div className="mt-1 text-xs leading-6 text-muted-foreground">
                          {theme.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.openAiApiKey}
              </label>
              <Input
                type="password"
                value={settings.openAiApiKey}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    openAiApiKey: event.target.value
                  }))
                }
                placeholder={text.pasteOpenAiApiKey}
              />
              <div className="mt-2 text-xs leading-6 text-muted-foreground">
                {text.builtInDesktopAiDescription}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.customApiUrl}
              </label>
              <Input
                value={settings.apiBaseUrl}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    apiBaseUrl: event.target.value
                  }))
                }
                placeholder={text.builtInDesktopAiActive}
              />
              <div className="mt-2 text-xs leading-6 text-muted-foreground">
                {isUsingDesktopAi
                  ? text.builtInDesktopAiActive
                  : text.customApiUrlDescription}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.temperature}: {settings.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    temperature: Number(event.target.value)
                  }))
                }
                className="w-full accent-teal-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.voice}
              </label>
              <select
                value={settings.voiceName}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    voiceName: event.target.value as AppSettings["voiceName"]
                  }))
                }
                className="field-shell flex h-11 w-full rounded-2xl px-4 text-sm text-foreground outline-none focus:ring-0"
              >
                <option value="alloy">alloy</option>
                <option value="echo">echo</option>
                <option value="fable">fable</option>
                <option value="onyx">onyx</option>
                <option value="nova">nova</option>
                <option value="shimmer">shimmer</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.inputDevice}
              </label>
              <select
                value={settings.preferredInputDeviceId}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    preferredInputDeviceId: event.target.value
                  }))
                }
                className="field-shell flex h-11 w-full rounded-2xl px-4 text-sm text-foreground outline-none focus:ring-0"
              >
                <option value="">{text.defaultDevice}</option>
                {inputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.outputDevice}
              </label>
              <select
                value={settings.preferredOutputDeviceId}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    preferredOutputDeviceId: event.target.value
                  }))
                }
                disabled={!audioOutputSelectionSupported}
                className="field-shell flex h-11 w-full rounded-2xl px-4 text-sm text-foreground outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">{text.defaultDevice}</option>
                {outputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
              {!audioOutputSelectionSupported ? (
                <div className="mt-2 text-xs leading-6 text-muted-foreground">
                  {text.outputDeviceUnsupported}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.inputVolume}: {settings.inputGain.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.4"
                max="2"
                step="0.1"
                value={settings.inputGain}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    inputGain: Number(event.target.value)
                  }))
                }
                className="w-full accent-teal-400"
              />
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3">
              <span>
                <div className="text-sm font-medium text-foreground">{text.autoSpeak}</div>
                <div className="text-xs text-muted-foreground">
                  {text.voiceHelp}
                </div>
              </span>
              <input
                type="checkbox"
                checked={settings.voiceAutoSpeak}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    voiceAutoSpeak: event.target.checked
                  }))
                }
                className="h-5 w-5 accent-teal-400"
              />
            </label>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {text.systemPrompt}
              </label>
              <Textarea
                value={settings.systemPrompt}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    systemPrompt: event.target.value
                  }))
                }
                placeholder={text.optionalSystemPrompt}
                className="min-h-[120px]"
              />
            </div>
          </div>
        </div>
      ) : null}

      {screenAssistant.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-md">
          <div className="glass-panel flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
              <div>
                <div className="font-heading text-2xl font-semibold text-foreground">
                  {text.screenAssistant}
                </div>
                <div className="text-sm text-muted-foreground">
                  {text.screenAssistantDescription}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setScreenAssistant(createScreenAssistantState())}>
                  {text.close}
                </Button>
                <Button
                  onClick={() => void handleAnalyzeScreen()}
                  disabled={!screenAssistant.imageDataUrl || screenAssistant.status !== "idle"}
                >
                  {screenAssistant.status === "analyzing" ? (
                    <GlowLoader size="sm" />
                  ) : (
                    <MonitorSmartphone className="h-4 w-4" />
                  )}
                  {text.analyze}
                </Button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-h-0 overflow-hidden rounded-[30px] border border-border/80 bg-card/70 p-4">
                <ScreenCapture
                  imageDataUrl={screenAssistant.imageDataUrl}
                  selection={screenAssistant.selection}
                  isCapturing={screenAssistant.status === "capturing"}
                  onCapture={captureForScreenAssistant}
                  onSelectionChange={(selection) =>
                    setScreenAssistant((current) => ({ ...current, selection }))
                  }
                  language={settings.language}
                />
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-border/80 bg-card/70 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Upload className="h-4 w-4 text-primary" />
                    {text.whatShouldFocus}
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

                <div className="rounded-[28px] border border-border/80 bg-card/70 p-4 text-sm text-muted-foreground">
                  <div className="mb-2 font-medium text-foreground">What this mode does</div>
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
