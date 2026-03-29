import {
  AudioLines,
  Mic,
  Volume2,
  Waves,
  X
} from "lucide-react";
import { getAppText } from "../lib/i18n";
import { cn } from "../lib/utils";
import type { AppLanguage } from "../types/app";
import { Button } from "./ui/button";
import { GlowLoader } from "./ui/glow-loader";

export type VoiceChatStatus =
  | "ready"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "error";

export interface VoiceChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface VoiceChatOverlayProps {
  isOpen: boolean;
  language?: AppLanguage;
  status: VoiceChatStatus;
  audioLevel: number;
  error?: string | null;
  transcript: string;
  reply: string;
  turns: VoiceChatTurn[];
  onResume: () => void;
  onClose: () => void;
}

function statusLabel(language: AppLanguage, status: VoiceChatStatus) {
  const text = getAppText(language);

  switch (status) {
    case "listening":
      return text.voiceChatListening;
    case "transcribing":
      return text.voiceChatTranscribing;
    case "thinking":
      return text.voiceChatThinking;
    case "speaking":
      return text.voiceChatSpeaking;
    case "error":
      return text.voiceChatError;
    default:
      return text.voiceChatReady;
  }
}

function statusTone(status: VoiceChatStatus) {
  switch (status) {
    case "listening":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
    case "transcribing":
      return "border-sky-400/30 bg-sky-500/15 text-sky-100";
    case "thinking":
      return "border-cyan-400/30 bg-cyan-500/15 text-cyan-100";
    case "speaking":
      return "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100";
    case "error":
      return "border-red-400/30 bg-red-500/15 text-red-100";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

export function VoiceChatOverlay({
  isOpen,
  language = "en",
  status,
  audioLevel,
  error = null,
  transcript,
  reply,
  turns,
  onResume,
  onClose
}: VoiceChatOverlayProps) {
  if (!isOpen) {
    return null;
  }

  const text = getAppText(language);
  const canResume = status === "ready" || status === "error";
  const normalizedLevel = Math.min(audioLevel, 1);
  const pulseScale = 1 + normalizedLevel * 0.22;
  const glowScale = 1.06 + normalizedLevel * 0.26;
  const hasDetails = Boolean(error || transcript || reply || turns.length > 0);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/88 p-3 backdrop-blur-xl sm:p-4">
      <div className="glass-panel relative flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(192,132,252,0.1),transparent_28%),rgba(7,10,20,0.94)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />

        <div className="absolute right-3 top-3 z-20 flex items-center gap-2 sm:right-4 sm:top-4">
          {canResume ? (
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full border-white/10 bg-white/8 text-slate-100 hover:bg-white/12"
              onClick={onResume}
              aria-label={text.voiceChatResume}
              title={text.voiceChatResume}
            >
              <Mic className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full border-white/10 bg-white/8 text-slate-100 hover:bg-white/12"
            onClick={onClose}
            aria-label={text.endVoiceChat}
            title={text.endVoiceChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
          <div
            className={cn(
              "mb-5 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] sm:mb-6",
              statusTone(status)
            )}
          >
            {statusLabel(language, status)}
          </div>

          <div className="relative flex h-[min(54vw,18rem)] w-[min(54vw,18rem)] items-center justify-center sm:h-[min(42vw,22rem)] sm:w-[min(42vw,22rem)]">
            <div
              className="absolute inset-[10%] rounded-full bg-cyan-400/10 blur-3xl transition-transform duration-200"
              style={{ transform: `scale(${glowScale})` }}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-full border transition-transform duration-200",
                status === "speaking"
                  ? "border-fuchsia-300/25 bg-fuchsia-400/10"
                  : "border-cyan-300/20 bg-cyan-400/10"
              )}
              style={{ transform: `scale(${pulseScale})` }}
            />
            <div
              className={cn(
                "absolute inset-[12%] rounded-full border",
                status === "speaking"
                  ? "border-fuchsia-300/20 bg-fuchsia-400/8"
                  : "border-cyan-300/15 bg-cyan-400/8"
              )}
              style={{ transform: `scale(${1 + normalizedLevel * 0.12})` }}
            />
            <div className="relative flex h-[58%] w-[58%] items-center justify-center rounded-full border border-white/10 bg-background/85 shadow-[0_24px_80px_rgba(3,7,18,0.55)]">
              {status === "transcribing" || status === "thinking" ? (
                <GlowLoader size="lg" className="scale-125" />
              ) : status === "speaking" ? (
                <Volume2 className="h-10 w-10 text-fuchsia-200 sm:h-12 sm:w-12" />
              ) : status === "error" ? (
                <X className="h-10 w-10 text-red-200 sm:h-12 sm:w-12" />
              ) : (
                <Waves className="h-10 w-10 text-cyan-200 sm:h-12 sm:w-12" />
              )}
            </div>
          </div>

          {hasDetails ? (
            <div className="mt-6 flex max-h-[32vh] w-full max-w-3xl flex-col gap-3 overflow-y-auto pr-1 sm:mt-8">
              {transcript ? (
                <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    <AudioLines className="h-3.5 w-3.5" />
                    {text.voiceChatHeard}
                  </div>
                  <div className="line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {transcript}
                  </div>
                </div>
              ) : null}

              {reply ? (
                <div className="rounded-[24px] border border-primary/15 bg-primary/10 px-4 py-3">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-primary/80">
                    NovaMind
                  </div>
                  <div className="line-clamp-5 whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {reply}
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
