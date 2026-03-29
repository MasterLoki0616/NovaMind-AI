import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getAppText } from "../lib/i18n";
import { transcribeAudio } from "../services/speech";
import type { AppLanguage } from "../types/app";
import { Button } from "./ui/button";
import { GlowLoader } from "./ui/glow-loader";
import { cn } from "../lib/utils";

interface VoiceButtonProps {
  apiBaseUrl: string;
  openAiApiKey?: string;
  language?: AppLanguage;
  onTranscript: (text: string) => void | Promise<void>;
  disabled?: boolean;
  variant?: "compact" | "hero";
  compactLabel?: string;
  showInlineError?: boolean;
  title?: string;
}

export function VoiceButton({
  apiBaseUrl,
  openAiApiKey = "",
  language = "en",
  onTranscript,
  disabled = false,
  variant = "compact",
  compactLabel,
  showInlineError = true,
  title
}: VoiceButtonProps) {
  const text = getAppText(language);
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setState("transcribing");
        try {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          const transcription = await transcribeAudio(apiBaseUrl, audioBlob, openAiApiKey);
          if (transcription.text.trim()) {
            await onTranscript(transcription.text.trim());
          }
        } catch (innerError) {
          setError(innerError instanceof Error ? innerError.message : text.voiceInputError);
        } finally {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setState("idle");
        }
      };

      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
      setState("recording");
    } catch (innerError) {
      setError(innerError instanceof Error ? innerError.message : text.microphoneAccessFailed);
      setState("idle");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  const hero = variant === "hero";
  const showCompactLabel = !hero && Boolean(compactLabel);

  return (
    <div className={cn("space-y-2", hero && "flex flex-col items-start")}>
      <Button
        type="button"
        size={hero ? "lg" : showCompactLabel ? "sm" : "icon"}
        variant={state === "recording" ? "default" : "secondary"}
        onClick={state === "recording" ? stopRecording : startRecording}
        disabled={disabled || state === "transcribing"}
        title={title ?? (hero ? text.voiceToText : compactLabel ?? text.voiceToText)}
        aria-label={title ?? (hero ? text.voiceToText : compactLabel ?? text.voiceToText)}
        className={cn(
          hero && "h-14 rounded-2xl px-5",
          showCompactLabel && "h-10 w-10 px-0 md:h-10 md:w-auto md:px-3",
          state === "recording" && "bg-red-500 text-white shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_24px_64px_rgba(127,29,29,0.35)]"
        )}
      >
        {state === "transcribing" ? (
          <GlowLoader size="sm" />
        ) : state === "recording" ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {hero ? (
          <span>
            {state === "recording"
              ? text.stopRecording
              : state === "transcribing"
                ? text.transcribing
                : text.voiceToText}
          </span>
        ) : showCompactLabel ? (
          <span className="hidden md:inline">
            {state === "recording"
              ? text.stopRecording
              : state === "transcribing"
                ? text.transcribing
                : compactLabel}
          </span>
        ) : null}
      </Button>
      {showInlineError && error ? <p className="text-xs text-red-300">{error}</p> : null}
      {hero ? (
        <p className="text-sm text-muted-foreground">
          {text.voiceHelp}
        </p>
      ) : null}
    </div>
  );
}
