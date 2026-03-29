import { cn } from "../../lib/utils";

interface GlowLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function GlowLoader({ className, size = "sm" }: GlowLoaderProps) {
  return (
    <span className={cn("ai-loader", className)} data-size={size} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
