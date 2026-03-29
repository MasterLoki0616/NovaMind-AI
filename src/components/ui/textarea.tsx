import * as React from "react";
import { cn } from "../../lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "field-shell min-h-[120px] w-full rounded-3xl px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-0",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export { Textarea };
