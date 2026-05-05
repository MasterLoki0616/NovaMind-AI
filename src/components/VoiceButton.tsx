import { Mic, Square } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { getAppText } from "../lib/i18n";
import { transcribeAudio } from "../services/speech";
import type { AppLanguage } from "../types/app";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { GlowLoader } from "./ui/glow-loader";

export type VoiceButtonState = "idle" | "recording" | "transcribing";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface VoiceButtonProps {
  apiBaseUrl: string;
  language?: AppLanguage;
  onTranscript: (text: string) => void | Promise<void>;
  onTranscriptPreview?: (text: string) => void;
  onErrorMessage?: (message: string | null) => void;
  onStateChange?: (state: VoiceButtonState) => void;
  disabled?: boolean;
  variant?: "compact" | "hero";
  compactLabel?: string;
  showInlineError?: boolean;
  title?: string;
}

export interface VoiceButtonHandle {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

const FALLBACK_SILENCE_MS = 1_200;
const FALLBACK_MAX_RECORDING_MS = 15_000;
const FALLBACK_MIN_RECORDING_MS = 700;
const FALLBACK_ACTIVITY_THRESHOLD = 0.018;
const ANALYSIS_INTERVAL_MS = 120;

function getSpeechRecognitionConstructor() {
  const browserWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

export const VoiceButton = forwardRef<VoiceButtonHandle, VoiceButtonProps>(function VoiceButton({
  apiBaseUrl,
  language = "en",
  onTranscript,
  onTranscriptPreview,
  onErrorMessage,
  onStateChange,
  disabled = false,
  variant = "compact",
  compactLabel,
  showInlineError = true,
  title
}, ref) {
  const text = getAppText(language);
  const [state, setState] = useState<VoiceButtonState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);
  const lastDetectedAtRef = useRef(0);
  const startedAtRef = useRef(0);

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    onErrorMessage?.(error);
  }, [error, onErrorMessage]);

  useEffect(() => {
    return () => {
      stopRecording();
      stopFallbackAnalysis();
      stopRecognitionSession();
      releaseStream();
    };
  }, []);

  function stopFallbackAnalysis() {
    if (analysisIntervalRef.current !== null) {
      window.clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    try {
      sourceRef.current?.disconnect();
    } catch {
      // Ignore audio graph teardown races.
    }

    sourceRef.current = null;
    analyserRef.current = null;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext) {
      void audioContext.close().catch(() => undefined);
    }
  }

  function stopRecognitionSession() {
    const recognition = speechRecognitionRef.current;
    speechRecognitionRef.current = null;

    if (!recognition) {
      return;
    }

    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;

    try {
      recognition.abort();
    } catch {
      // Ignore recognition shutdown races.
    }
  }

  function releaseStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    lastDetectedAtRef.current = 0;
    startedAtRef.current = 0;
  }

  function setVoiceError(message: string) {
    setError(message);
  }

  async function finalizeRecordedAudio() {
    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];

    if (audioBlob.size === 0) {
      setState("idle");
      return;
    }

    setState("transcribing");

    try {
      const transcription = await transcribeAudio(apiBaseUrl, audioBlob);
      const transcript = transcription.text.trim();
      if (transcript) {
        await onTranscript(transcript);
        onTranscriptPreview?.(transcript);
      }
      setError(null);
    } catch (innerError) {
      setVoiceError(innerError instanceof Error ? innerError.message : text.voiceInputError);
    } finally {
      setState("idle");
      releaseStream();
    }
  }

  function startFallbackAnalysis(stream: MediaStream) {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      sourceRef.current = source;
      analyserRef.current = analyser;
      lastDetectedAtRef.current = Date.now();
      startedAtRef.current = Date.now();

      analysisIntervalRef.current = window.setInterval(() => {
        const currentAnalyser = analyserRef.current;
        if (!currentAnalyser) {
          return;
        }

        const data = new Uint8Array(currentAnalyser.fftSize);
        currentAnalyser.getByteTimeDomainData(data);

        let sum = 0;
        for (const value of data) {
          const normalized = value / 128 - 1;
          sum += normalized * normalized;
        }

        const rms = Math.sqrt(sum / data.length);
        const now = Date.now();

        if (rms > FALLBACK_ACTIVITY_THRESHOLD) {
          lastDetectedAtRef.current = now;
        }

        const hasReachedMinimum = now - startedAtRef.current > FALLBACK_MIN_RECORDING_MS;
        const silenceElapsed = now - lastDetectedAtRef.current;
        const maxDurationReached = now - startedAtRef.current > FALLBACK_MAX_RECORDING_MS;

        if ((hasReachedMinimum && silenceElapsed >= FALLBACK_SILENCE_MS) || maxDurationReached) {
          stopRecording();
        }
      }, ANALYSIS_INTERVAL_MS);
    } catch {
      // If audio analysis fails, fallback recording still works and can be stopped manually.
    }
  }

  async function startRecognitionSession() {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      return false;
    }

    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((track) => track.stop());
    } catch (innerError) {
      setVoiceError(
        innerError instanceof Error ? innerError.message : text.microphoneAccessFailed
      );
      setState("idle");
      return true;
    }

    let finalTranscript = "";
    const recognition = new Recognition();
    speechRecognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === "tr" ? "tr-TR" : "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim() ?? "";

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript = [finalTranscript, transcript].filter(Boolean).join(" ").trim();
        } else {
          interimTranscript = [interimTranscript, transcript].filter(Boolean).join(" ").trim();
        }
      }

      const previewTranscript = [finalTranscript, interimTranscript].filter(Boolean).join(" ").trim();
      if (previewTranscript) {
        onTranscriptPreview?.(previewTranscript);
      }
    };

    recognition.onerror = (event) => {
      const rawError = event?.error ?? "";

      if (rawError === "no-speech") {
        onTranscriptPreview?.("");
        setState("idle");
        return;
      }

      setVoiceError(text.voiceInputError);
      setState("idle");
    };

    recognition.onend = () => {
      speechRecognitionRef.current = null;
      const transcript = finalTranscript.trim();

      if (transcript) {
        void onTranscript(transcript);
        onTranscriptPreview?.(transcript);
      } else {
        onTranscriptPreview?.("");
      }

      setState("idle");
    };

    recognition.start();
    setState("recording");
    setError(null);
    return true;
  }

  async function startFallbackRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: preferredMimeType });

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopFallbackAnalysis();
        await finalizeRecordedAudio();
      };

      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start(250);
      startFallbackAnalysis(stream);
      setError(null);
      setState("recording");
    } catch (innerError) {
      setVoiceError(innerError instanceof Error ? innerError.message : text.microphoneAccessFailed);
      setState("idle");
    }
  }

  async function startRecording() {
    if (disabled || state === "recording" || state === "transcribing") {
      return;
    }

    setError(null);
    onTranscriptPreview?.("");

    const usedBrowserSpeech = await startRecognitionSession();
    if (usedBrowserSpeech) {
      return;
    }

    await startFallbackRecorder();
  }

  function stopRecording() {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      return;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    stopFallbackAnalysis();
    releaseStream();
    setState("idle");
  }

  useImperativeHandle(
    ref,
    () => ({
      startRecording,
      stopRecording
    }),
    [disabled, state, language, apiBaseUrl, onTranscript, onTranscriptPreview]
  );

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
      {hero ? <p className="text-sm text-muted-foreground">{text.voiceHelp}</p> : null}
    </div>
  );
});

VoiceButton.displayName = "VoiceButton";
