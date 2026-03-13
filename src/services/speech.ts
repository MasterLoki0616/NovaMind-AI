import type { TtsVoice } from "../types/app";
import { fetchBlob, fetchFormData, fetchJson } from "./api";

export async function transcribeAudio(baseUrl: string, audio: Blob) {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");

  return fetchFormData<{ text: string }>(baseUrl, "/api/speech/transcribe", formData);
}

export async function requestSpeechBlob(baseUrl: string, text: string, voice: TtsVoice) {
  return fetchBlob(baseUrl, "/api/speech/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, voice })
  });
}

export async function playSpeech(baseUrl: string, text: string, voice: TtsVoice) {
  const blob = await requestSpeechBlob(baseUrl, text, voice);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  await audio.play();

  audio.addEventListener(
    "ended",
    () => {
      URL.revokeObjectURL(url);
    },
    { once: true }
  );

  return audio;
}

export async function getHealth(baseUrl: string) {
  return fetchJson<{
    ok: boolean;
    name: string;
    hasOpenAIKey: boolean;
    supportedDocumentTypes: string[];
  }>(baseUrl, "/api/health");
}
