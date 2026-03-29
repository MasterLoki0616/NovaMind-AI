import {
  Bot,
  Mic,
  MonitorUp,
  Radio,
  SendHorizonal,
  Sparkles,
  Volume2,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getAppText } from "../lib/i18n";
import { cn } from "../lib/utils";
import type { AppLanguage } from "../types/app";
import type { VoiceChatStatus, VoiceChatTurn } from "./VoiceChatOverlay";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { GlowLoader } from "./ui/glow-loader";

interface LiveScreenShareOverlayProps {
  isOpen: boolean;
  stream: MediaStream | null;
  isStarting: boolean;
  isWatching: boolean;
  isAnswering: boolean;
  latestQuestion: string;
  latestAnswer: string;
  voiceReply: string;
  sessionTurns: VoiceChatTurn[];
  voiceTranscript: string;
  error?: string | null;
  voiceRepliesEnabled: boolean;
  voiceAssistantActive: boolean;
  voiceAssistantStatus: VoiceChatStatus;
  voiceAssistantAudioLevel: number;
  language?: AppLanguage;
  onToggleVoiceReplies: () => void;
  onToggleVoiceAssistant: () => void;
  onClose: () => void;
  onSubmitQuestion: (question: string) => Promise<boolean>;
}

export function LiveScreenShareOverlay({
  isOpen,
  stream,
  isStarting,
  isWatching,
  isAnswering,
  latestQuestion,
  latestAnswer,
  voiceReply,
  sessionTurns,
  voiceTranscript,
  error = null,
  voiceRepliesEnabled,
  voiceAssistantActive,
  voiceAssistantStatus,
  voiceAssistantAudioLevel,
  language = "en",
  onToggleVoiceReplies,
  onToggleVoiceAssistant,
  onClose,
  onSubmitQuestion
}: LiveScreenShareOverlayProps) {
  const text = getAppText(language);
  const [value, setValue] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const voiceStatusLabel =
    voiceAssistantStatus === "speaking"
      ? text.voiceChatSpeaking
      : voiceAssistantStatus === "listening"
        ? text.voiceChatListening
        : voiceAssistantStatus === "error"
          ? text.voiceChatError
          : voiceAssistantStatus === "ready"
            ? text.voiceChatReady
            : text.voiceChatThinking;
  const displayedQuestion =
    voiceTranscript.trim() ||
    latestQuestion.trim() ||
    [...sessionTurns].reverse().find((turn) => turn.role === "user")?.text ||
    "";
  const displayedAnswer =
    voiceReply.trim() ||
    latestAnswer.trim() ||
    [...sessionTurns].reverse().find((turn) => turn.role === "assistant")?.text ||
    "";

  useEffect(() => {
    if (!isOpen || !videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => undefined);

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen, stream]);

  useEffect(() => {
    if (!isOpen) {
      setValue("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit() {
    const question = value.trim();
    if (!question || isAnswering) {
      return;
    }

    const sent = await onSubmitQuestion(question);
    if (sent) {
      setValue("");
    }
  }

  return (
    <div className="fixed inset-0 z-[145] flex items-center justify-center bg-background/88 p-3 backdrop-blur-xl sm:p-4">
      <div className="glass-panel relative flex h-full max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.1),transparent_28%),rgba(7,10,20,0.94)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.24em] text-primary/80">
              {text.liveScreenShare}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {text.liveScreenShareDescription}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onToggleVoiceAssistant}
              className={cn(
                voiceAssistantActive && "border-cyan-400/30 bg-cyan-500/12 text-cyan-100"
              )}
            >
              <Bot className="h-4 w-4" />
              {voiceAssistantActive ? text.endVoiceChat : text.voiceChatStart}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onToggleVoiceReplies}
              className={cn(
                voiceRepliesEnabled && "border-primary/30 bg-primary/12 text-primary"
              )}
            >
              <Volume2 className="h-4 w-4" />
              {text.liveScreenVoiceReplies}
            </Button>
            <Button type="button" variant="secondary" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative z-10 grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)] sm:p-5">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-400/20 bg-emerald-500/12 text-emerald-100">
                <MonitorUp className="mr-2 h-3.5 w-3.5" />
                {text.liveScreenActive}
              </Badge>
              <Badge
                className={cn(
                  "border-cyan-400/20 bg-cyan-500/12 text-cyan-100",
                  !isWatching && "border-white/10 bg-white/5 text-slate-200"
                )}
              >
                <Radio className="mr-2 h-3.5 w-3.5" />
                {text.liveScreenWatching}
              </Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-200">
                <Mic className="mr-2 h-3.5 w-3.5" />
                {voiceAssistantActive ? text.voiceChatListening : text.liveScreenMicQuestion}
              </Badge>
              <Badge
                className={cn(
                  "border-white/10 bg-white/5 text-slate-200",
                  voiceAssistantActive && "border-fuchsia-400/20 bg-fuchsia-500/12 text-fuchsia-100"
                )}
              >
                <Volume2 className="mr-2 h-3.5 w-3.5" />
                {voiceAssistantStatus === "speaking" ? text.voiceChatSpeaking : text.voiceChatReady}
              </Badge>
            </div>

            <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-black/35">
              {stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {isStarting ? (
                      <GlowLoader size="lg" />
                    ) : (
                      <Sparkles className="h-8 w-8" />
                    )}
                  </div>
                  <div className="max-w-md text-sm leading-7 text-muted-foreground">
                    {isStarting ? text.liveScreenShareDescription : text.liveScreenWaitingFrame}
                  </div>
                </div>
              )}

              {voiceAssistantActive ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                  <div className="mx-auto max-w-md rounded-full border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl">
                    <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-300">
                      <span>{text.voiceChatLive}</span>
                      <span>{voiceStatusLabel}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-fuchsia-300 transition-[width] duration-150"
                        style={{ width: `${Math.max(8, Math.min(100, voiceAssistantAudioLevel * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
              <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {text.liveScreenSession}
              </div>

              <div className="space-y-3">
                <textarea
                  value={value}
                  rows={3}
                  disabled={isAnswering}
                  onChange={(event) => setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  placeholder={text.liveScreenAskPlaceholder}
                  className="field-shell min-h-[96px] w-full resize-none rounded-[24px] px-4 py-3 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {voiceAssistantActive ? text.voiceChatHint : text.liveScreenSessionOnly}
                  </div>

                  <Button type="button" onClick={() => void handleSubmit()} disabled={isAnswering || !value.trim()}>
                    {isAnswering ? (
                      <GlowLoader size="sm" />
                    ) : (
                      <SendHorizonal className="h-4 w-4" />
                    )}
                    {text.send}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              {voiceAssistantActive &&
              voiceTranscript.trim() &&
              voiceTranscript.trim() !== displayedQuestion.trim() ? (
                <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-cyan-100">
                    {text.voiceChatHeard}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {voiceTranscript}
                  </div>
                </div>
              ) : null}

              {displayedQuestion ? (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {text.liveScreenLatestQuestion}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {displayedQuestion}
                  </div>
                </div>
              ) : null}

              <div className="flex min-h-[220px] flex-1 flex-col rounded-[28px] border border-primary/20 bg-primary/10 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-primary/80">
                  {text.liveScreenLatestAnswer}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {displayedAnswer ? (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {displayedAnswer}
                    </div>
                  ) : (
                    <div className="text-sm leading-7 text-muted-foreground">
                      {isAnswering ? text.voiceChatThinking : text.liveScreenAnswerPlaceholder}
                    </div>
                  )}
                </div>
              </div>

              {error ? (
                <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
