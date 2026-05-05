import {
  AudioLines,
  ChevronDown,
  FileText,
  FileUp,
  Globe2,
  ImagePlus,
  MonitorSmartphone,
  Plus,
  SendHorizonal,
  Square,
  Sparkles,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getAppText } from "../lib/i18n";
import { chatModelGroups, getChatModelOption } from "../lib/models";
import { cn } from "../lib/utils";
import type { AppLanguage, AttachmentRecord } from "../types/app";
import { VoiceButton, type VoiceButtonHandle, type VoiceButtonState } from "./VoiceButton";
import { Button } from "./ui/button";

export type ComposerQuickAction = "image" | "web-search";

type ToolMenuItem = {
  id: string;
  icon: typeof MonitorSmartphone;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
};

interface CompactComposerProps {
  apiBaseUrl: string;
  language?: AppLanguage;
  pendingAttachments?: AttachmentRecord[];
  disabled?: boolean;
  isSending: boolean;
  isUploadingFile?: boolean;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onSend: (value: string, options?: { quickAction?: ComposerQuickAction | null }) => Promise<boolean>;
  onStopGenerating?: () => void;
  onOpenScreenAssistant: () => void;
  onOpenVoiceChat: () => void;
  onFilesSelected: (files: FileList | File[]) => void | Promise<void>;
  onRemoveAttachment?: (attachmentId: string) => void;
}

function quickActionLabel(language: AppLanguage, action: ComposerQuickAction) {
  const text = getAppText(language);
  return action === "image" ? text.createImage : text.webSearch;
}

export function CompactComposer({
  apiBaseUrl,
  language = "en",
  pendingAttachments = [],
  disabled = false,
  isSending,
  isUploadingFile = false,
  selectedModelId,
  onSelectModel,
  onSend,
  onStopGenerating,
  onOpenScreenAssistant,
  onOpenVoiceChat,
  onFilesSelected,
  onRemoveAttachment
}: CompactComposerProps) {
  const text = getAppText(language);
  const [value, setValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<ComposerQuickAction | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechState, setSpeechState] = useState<VoiceButtonState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const voiceButtonRef = useRef<VoiceButtonHandle | null>(null);
  const speechBaseValueRef = useRef("");
  const selectedModel = getChatModelOption(selectedModelId);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [value]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        textareaRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!actionMenuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  async function handleSubmit() {
    const normalized = value.trim();
    if (!normalized || disabled || isSending) return;

    const sent = await onSend(normalized, { quickAction });
    if (sent) {
      setValue("");
      setQuickAction(null);
    }
  }

  async function handleSpeechToText() {
    setIsMenuOpen(false);
    speechBaseValueRef.current = value.trim();
    setSpeechError(null);
    await voiceButtonRef.current?.startRecording();
  }

  function mergeTranscript(base: string, transcript: string) {
    const normalizedTranscript = transcript.trim();
    if (!normalizedTranscript) {
      return base;
    }

    return [base, normalizedTranscript].filter(Boolean).join(base ? " " : "");
  }

  const toolMenuItems: ToolMenuItem[] = [
    {
      id: "screen",
      icon: MonitorSmartphone,
      label: text.liveScreenShare,
      onSelect: () => {
        setIsMenuOpen(false);
        onOpenScreenAssistant();
      }
    },
    {
      id: "file",
      icon: FileUp,
      label: text.uploadAFile,
      disabled: isUploadingFile,
      onSelect: () => {
        setIsMenuOpen(false);
        fileInputRef.current?.click();
      }
    },
    {
      id: "voice",
      icon: AudioLines,
      label: text.voiceChatStart,
      disabled: false,
      onSelect: () => {
        setIsMenuOpen(false);
        onOpenVoiceChat();
      }
    },
    {
      id: "speech",
      icon: Sparkles,
      label: text.voiceToText,
      disabled: false,
      onSelect: () => {
        void handleSpeechToText();
      }
    },
    {
      id: "image",
      icon: ImagePlus,
      label: text.createImage,
      disabled: false,
      onSelect: () => {
        setQuickAction("image");
        setIsMenuOpen(false);
      }
    },
    {
      id: "web-search",
      icon: Globe2,
      label: text.webSearch,
      disabled: false,
      onSelect: () => {
        setQuickAction("web-search");
        setIsMenuOpen(false);
      }
    }
  ] as const;

  return (
    <div className="composer-shell motion-fade-up relative overflow-visible rounded-[24px] border border-border bg-card/75 p-3 shadow-[0_24px_90px_rgba(2,6,23,0.38)] sm:rounded-[30px] sm:p-4">
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

      {quickAction ? (
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setQuickAction(null)}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary transition hover:border-primary/40 hover:bg-primary/18"
          >
            <span>{quickActionLabel(language, quickAction)}</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="composer-row flex min-w-0 items-center gap-2">
        <div ref={actionMenuRef} className="relative shrink-0">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            disabled={disabled || isSending}
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label={text.tools}
            className="h-11 w-11 rounded-[16px]"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <div
            className={cn(
              "absolute bottom-[calc(100%+0.85rem)] left-0 z-30 w-[min(320px,calc(100vw-3rem))] origin-bottom-left rounded-[28px] border border-border/80 bg-card/95 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.48)] backdrop-blur-2xl transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isMenuOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-2 scale-[0.96] opacity-0"
            )}
          >
            <div className="mb-2 px-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {text.tools}
            </div>
            <div className="grid gap-2">
              {toolMenuItems.map((item) => {
                const Icon = item.icon;
                const active =
                  (item.id === "image" && quickAction === "image") ||
                  (item.id === "web-search" && quickAction === "web-search");

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onSelect}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition",
                      active
                        ? "border-primary/25 bg-primary/12"
                        : "border-border/80 bg-background/55 hover:border-border hover:bg-card",
                      item.disabled && "cursor-not-allowed opacity-60 hover:border-border/80 hover:bg-background/55"
                    )}
                    disabled={item.disabled}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-background/70 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                    </div>
                    {active ? <div className="h-2 w-2 rounded-full bg-primary" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-border/70 pt-3">
              <button
                type="button"
                onClick={() => setIsMoreToolsOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-background/50 hover:text-foreground"
              >
                <span>{text.additionalTools}</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition duration-200", isMoreToolsOpen && "rotate-180")}
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isMoreToolsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="mt-2 grid gap-2 px-1">
                    <div className="rounded-2xl border border-dashed border-border bg-background/45 px-3 py-3 text-sm text-muted-foreground">
                      {text.moreToolsSoon}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden">
            <VoiceButton
              ref={voiceButtonRef}
              apiBaseUrl={apiBaseUrl}
              language={language}
              disabled={disabled || isSending}
              onTranscriptPreview={(transcript) => {
                setValue(mergeTranscript(speechBaseValueRef.current, transcript));
              }}
              onTranscript={(transcript) => {
                const merged = mergeTranscript(speechBaseValueRef.current, transcript);
                speechBaseValueRef.current = merged;
                setValue(merged);
                textareaRef.current?.focus();
              }}
              onStateChange={setSpeechState}
              onErrorMessage={setSpeechError}
              compactLabel={text.voiceToText}
              showInlineError={false}
              title={text.voiceToText}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            disabled={disabled}
            onChange={(event) => {
              speechBaseValueRef.current = event.target.value.trim();
              setValue(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={text.startByTyping}
            className={cn(
              "composer-textarea field-shell max-h-[120px] min-h-11 w-full resize-none rounded-[16px] px-4 py-2.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:ring-0",
              speechState !== "idle" && "ring-1 ring-primary/40"
            )}
          />
        </div>

        <label
          className="model-select-shell h-11 w-[168px] shrink-0 rounded-[16px]"
          title={selectedModel?.description ?? selectedModelId}
        >
          <span className="model-select-label">{text.selectModel}</span>
          <select
            value={selectedModelId}
            onChange={(event) => onSelectModel(event.target.value)}
            className="model-select-control"
            aria-label={text.selectModel}
          >
            {chatModelGroups.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/80" />
        </label>

        <Button
          type="button"
          className={cn(
            "h-11 shrink-0 rounded-[16px] px-4 sm:px-5",
            isSending && "border-red-400/25 bg-red-500/15 text-red-100 hover:bg-red-500/20"
          )}
          onClick={() => (isSending ? onStopGenerating?.() : void handleSubmit())}
          disabled={disabled || (!isSending && !value.trim())}
          aria-label={isSending ? text.stopGenerating : text.send}
        >
          {isSending ? <Square className="h-3.5 w-3.5 fill-current" /> : <SendHorizonal className="h-4 w-4" />}
          <span className="hidden sm:inline">{isSending ? text.stopGenerating : text.send}</span>
        </Button>
      </div>

      {speechError ? (
        <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {speechError}
        </div>
      ) : null}

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
