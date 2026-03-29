import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./ui/button";

interface FeedbackButtonProps extends Omit<ButtonProps, "onClick"> {
  icon?: ComponentType<{ className?: string }>;
  idleLabel: ReactNode;
  successLabel?: ReactNode;
  successClassName?: string;
  successMs?: number;
  onClick: () => void | Promise<void>;
}

export function FeedbackButton({
  icon: Icon,
  idleLabel,
  successLabel = "Done",
  successClassName = "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20",
  successMs = 1500,
  className,
  onClick,
  ...props
}: FeedbackButtonProps) {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");

  useEffect(() => {
    if (state !== "done") {
      return;
    }

    const timeout = window.setTimeout(() => setState("idle"), successMs);
    return () => window.clearTimeout(timeout);
  }, [state, successMs]);

  return (
    <Button
      {...props}
      type={props.type ?? "button"}
      className={cn(className, state === "done" ? successClassName : undefined)}
      onClick={async () => {
        setState("working");
        try {
          await onClick();
          setState("done");
        } catch {
          setState("idle");
        }
      }}
    >
      {state === "done" ? (
        <Check className="h-4 w-4" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {state === "done" ? successLabel : idleLabel}
    </Button>
  );
}
