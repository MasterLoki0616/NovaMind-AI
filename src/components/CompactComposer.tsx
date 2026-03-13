import { FileUp, LoaderCircle, MonitorSmartphone, SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VoiceButton } from "./VoiceButton";
import { Button } from "./ui/button";

interface CompactComposerProps {
  apiBaseUrl: string;
  disabled?: boolean;
  isSending: boolean;
  isUploadingFile?: boolean;
  onSend: (value: string) => Promise<boolean>;
  onOpenScreenAssistant: () => void;
  onFilesSelected: (files: FileList | File[]) => void | Promise<void>;
}

export function CompactComposer({
  apiBaseUrl,
  disabled = false,
  isSending,
  isUploadingFile = false,
  onSend,
  onOpenScreenAssistant,
  onFilesSelected
}: CompactComposerProps) {
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

  function appendTranscript(text: string) {
    setValue((current) => (current ? `${current} ${text}` : text));
    textareaRef.current?.focus();
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-black/30 p-3 shadow-[0_24px_90px_rgba(2,6,23,0.38)]">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            disabled={disabled || isSending}
            onClick={onOpenScreenAssistant}
            aria-label="Open screen assistant"
          >
            <MonitorSmartphone className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="secondary"
            disabled={disabled || isSending || isUploadingFile}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload a file"
          >
            {isUploadingFile ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
          </Button>

          <VoiceButton
            apiBaseUrl={apiBaseUrl}
            disabled={disabled || isSending}
            onTranscript={appendTranscript}
          />
        </div>

        <div className="min-w-[260px] flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="Message NovaMind... then continue with file, screen, or voice."
            className="max-h-[180px] min-h-[64px] w-full resize-none border-none bg-transparent px-2 py-2 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={disabled || isSending || !value.trim()}
          aria-label="Send message"
        >
          {isSending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
          Send
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-1 pt-3 text-xs text-muted-foreground">
        <span>Ctrl/Cmd + K focuses, Ctrl/Cmd + Enter sends.</span>
        <span>Text, screen, file, and voice stay in one panel.</span>
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
