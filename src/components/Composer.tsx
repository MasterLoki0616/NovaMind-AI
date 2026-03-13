import { CornerDownLeft, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SMART_COMMANDS } from "../lib/smartCommands";
import { VoiceButton } from "./VoiceButton";
import { Button } from "./ui/button";

interface ComposerProps {
  apiBaseUrl: string;
  isSending: boolean;
  placeholder: string;
  showVoiceButton?: boolean;
  onSend: (value: string) => Promise<boolean>;
}

export function Composer({
  apiBaseUrl,
  isSending,
  placeholder,
  showVoiceButton = false,
  onSend
}: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
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
    if (!normalized || isSending) return;

    const sent = await onSend(normalized);
    if (sent) {
      setValue("");
    }
  }

  function insertCommand(command: string) {
    setValue((current) => {
      if (!current.trim()) return `/${command} `;
      if (current.trimStart().startsWith(`/${command}`)) return current;
      return `/${command} ${current.trimStart()}`;
    });

    textareaRef.current?.focus();
  }

  function appendTranscript(text: string) {
    setValue((current) => (current ? `${current} ${text}` : text));
    textareaRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SMART_COMMANDS.map((command) => (
          <button
            key={command.id}
            type="button"
            onClick={() => insertCommand(command.id)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/20 hover:bg-primary/8 hover:text-primary"
          >
            {command.label}
          </button>
        ))}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/25 p-3 shadow-[0_18px_60px_rgba(2,6,23,0.22)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          rows={1}
          className="max-h-[220px] min-h-[72px] w-full resize-none border-none bg-transparent px-1 py-2 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            {showVoiceButton ? (
              <VoiceButton apiBaseUrl={apiBaseUrl} onTranscript={appendTranscript} />
            ) : null}
            <div className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Use </span>
              <span className="font-medium text-foreground">Ctrl/Cmd + Enter</span> to send
            </div>
          </div>

          <Button onClick={() => void handleSubmit()} disabled={isSending || !value.trim()}>
            {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CornerDownLeft className="h-4 w-4" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
