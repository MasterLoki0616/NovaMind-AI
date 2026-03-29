import { AudioLines, FileText, FileUp, MonitorSmartphone, SendHorizonal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getAppText } from "../lib/i18n";
import type { AppLanguage, AttachmentRecord } from "../types/app";
import { VoiceButton } from "./VoiceButton";
import { Button } from "./ui/button";
import { GlowLoader } from "./ui/glow-loader";

interface CompactComposerProps {
  apiBaseUrl: string;
  openAiApiKey?: string;
  language?: AppLanguage;
  pendingAttachments?: AttachmentRecord[];
  disabled?: boolean;
  isSending: boolean;
  isUploadingFile?: boolean;
  onSend: (value: string) => Promise<boolean>;
  onOpenScreenAssistant: () => void;
  onOpenVoiceChat: () => void;
  onFilesSelected: (files: FileList | File[]) => void | Promise<void>;
  onRemoveAttachment?: (attachmentId: string) => void;
}

export function CompactComposer({
  apiBaseUrl,
  openAiApiKey = "",
  language = "en",
  pendingAttachments = [],
  disabled = false,
  isSending,
  isUploadingFile = false,
  onSend,
  onOpenScreenAssistant,
  onOpenVoiceChat,
  onFilesSelected,
  onRemoveAttachment
}: CompactComposerProps) {
  const text = getAppText(language);
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [value]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        textareaRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  async function handleSubmit() {
    const normalized = value.trim();
    if (!normalized || disabled || isSending) return;

    const sent = await onSend(normalized);
    if (sent) {
      setValue("");
    }
  }

  return (
    <div className="motion-fade-up rounded-[24px] border border-border bg-card/75 p-3 shadow-[0_24px_90px_rgba(2,6,23,0.38)] sm:rounded-[30px] sm:p-4">
      {pendingAttachments.length > 0 ? (
        <div className="mb-3 grid gap-2">
          {pendingAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/60 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/70 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{attachment.name}</div>
                  <div className="text-xs text-muted-foreground">{text.fileReadyToSend}</div>
                </div>
              </div>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-xl"
                onClick={() => onRemoveAttachment?.(attachment.id)}
                aria-label={text.removeAttachment}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={text.startByTyping}
            className="field-shell max-h-[180px] min-h-[52px] w-full resize-none rounded-[22px] px-3 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:ring-0 sm:min-h-[56px] sm:text-sm sm:leading-7"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid w-full grid-cols-4 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled || isSending}
              onClick={onOpenScreenAssistant}
              aria-label={text.liveScreenShare}
              title={text.liveScreenShare}
              className="h-10 w-full px-0 sm:h-10 sm:w-auto sm:px-3"
            >
              <MonitorSmartphone className="h-4 w-4" />
              <span className="hidden md:inline">{text.liveScreenShare}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled || isSending || isUploadingFile}
              onClick={() => fileInputRef.current?.click()}
              aria-label={text.uploadAFile}
              title={text.uploadAFile}
              className="h-10 w-full px-0 sm:h-10 sm:w-auto sm:px-3"
            >
              {isUploadingFile ? (
                <GlowLoader size="sm" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              <span className="hidden md:inline">{text.uploadAFile}</span>
            </Button>

            <VoiceButton
              apiBaseUrl={apiBaseUrl}
              openAiApiKey={openAiApiKey}
              language={language}
              disabled={disabled || isSending}
              onTranscript={(transcript) => {
                setValue((current) => (current ? `${current} ${transcript}` : transcript));
                textareaRef.current?.focus();
              }}
              compactLabel={text.voiceToText}
              showInlineError={false}
              title={text.voiceToText}
            />

            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled || isSending}
              onClick={onOpenVoiceChat}
              aria-label={text.voiceChatStart}
              title={text.voiceChatStart}
              className="h-10 w-full px-0 sm:h-10 sm:w-auto sm:px-3"
            >
              <AudioLines className="h-4 w-4" />
              <span className="hidden md:inline">{text.voiceChatStart}</span>
            </Button>
          </div>

          <Button
            type="button"
            className="h-10 w-full sm:w-auto sm:self-auto"
            onClick={() => void handleSubmit()}
            disabled={disabled || isSending || !value.trim()}
            aria-label={text.send}
          >
            {isSending ? (
              <GlowLoader size="sm" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
            {text.send}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx,.md"
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) {
            void onFilesSelected(event.target.files);
            event.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}
