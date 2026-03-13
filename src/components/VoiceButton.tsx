import { LoaderCircle, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../services/speech";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface VoiceButtonProps {
  apiBaseUrl: string;
  onTranscript: (text: string) => void | Promise<void>;
  disabled?: boolean;
  variant?: "compact" | "hero";
}

export function VoiceButton({
  apiBaseUrl,
  onTranscript,
  disabled = false,
  variant = "compact"
}: VoiceButtonProps) {
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
          const transcription = await transcribeAudio(apiBaseUrl, audioBlob);
          if (transcription.text.trim()) {
            await onTranscript(transcription.text.trim());
          }
        } catch (innerError) {
          setError(innerError instanceof Error ? innerError.message : "Voice transcription failed.");
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
      setError(innerError instanceof Error ? innerError.message : "Microphone access failed.");
      setState("idle");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  const hero = variant === "hero";

  return (
    <div className={cn("space-y-2", hero && "flex flex-col items-start")}>
      <Button
        type="button"
        size={hero ? "lg" : "icon"}
        variant={state === "recording" ? "default" : "secondary"}
        onClick={state === "recording" ? stopRecording : startRecording}
        disabled={disabled || state === "transcribing"}
        className={cn(
          hero && "h-14 rounded-2xl px-5",
          state === "recording" && "bg-red-500 text-white shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_24px_64px_rgba(127,29,29,0.35)]"
        )}
      >
        {state === "transcribing" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : state === "recording" ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {hero ? (
          <span>
            {state === "recording"
              ? "Stop Recording"
              : state === "transcribing"
                ? "Transcribing..."
                : "Talk to NovaMind"}
          </span>
        ) : null}
      </Button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      {hero ? (
        <p className="text-sm text-muted-foreground">
          Record a prompt, transcribe it, and send it straight into the assistant.
        </p>
      ) : null}
    </div>
  );
}
