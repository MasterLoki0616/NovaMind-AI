import * as React from "react";
import { cn } from "../../lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card/75 px-3 py-1 text-xs font-medium text-muted-foreground transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-primary/20 hover:shadow-[0_12px_28px_rgba(2,6,23,0.18)]",
        className
      )}
      {...props}
    />
  );
}
