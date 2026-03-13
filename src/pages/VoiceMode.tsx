import { AudioLines, Mic2, Volume2 } from "lucide-react";
import { ChatWorkspace } from "../components/ChatWorkspace";
import { VoiceButton } from "../components/VoiceButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import type { AppSettings, Conversation } from "../types/app";

interface VoiceModePageProps {
  conversation: Conversation | null;
  settings: AppSettings;
  isSending: boolean;
  speakingMessageId: string | null;
  onSend: (value: string) => Promise<boolean>;
  onNewConversation: () => void;
  onSpeak: (messageId: string, text: string) => void;
  onTranscriptSend: (text: string) => Promise<void>;
}

export function VoiceModePage({
  onTranscriptSend,
  ...props
}: VoiceModePageProps) {
  return (
    <ChatWorkspace
      {...props}
      title="Voice-first interaction with transcription and spoken replies."
      subtitle="Talk to NovaMind, transcribe speech into prompts, and play back assistant responses with OpenAI text-to-speech. This mode is tuned for natural spoken phrasing."
      insights={[
        { label: "Input", value: "Record from the microphone and transcribe with Whisper." },
        { label: "Output", value: `TTS voice: ${props.settings.voiceName}. Auto-speak is ${props.settings.voiceAutoSpeak ? "on" : "off"}.` },
        { label: "Use Cases", value: "Hands-free brainstorming, summarizing, and code explanation." }
      ]}
      emptyTitle="Start a voice-driven session"
      emptyDescription="Record a question, have NovaMind transcribe it, and keep the transcript in your local conversation history."
      showVoiceButton
      hero={
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AudioLines className="h-5 w-5 text-primary" />
                Live voice handoff
              </CardTitle>
              <CardDescription>
                Record a prompt and send it directly into the current conversation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <VoiceButton
                apiBaseUrl={props.settings.apiBaseUrl}
                variant="hero"
                onTranscript={(text) => onTranscriptSend(text)}
              />
              <div className="text-sm leading-7 text-muted-foreground">
                Try: "NovaMind summarize this document", "NovaMind explain this code", or "NovaMind tell me what's happening on this screen."
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mic2 className="h-5 w-5 text-primary" />
                Voice Flow
              </CardTitle>
              <CardDescription>Microphone in, model out, speech back.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                1. Capture audio from the microphone.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                2. Transcribe with OpenAI speech-to-text.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  3. Speak the assistant answer with text-to-speech.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
