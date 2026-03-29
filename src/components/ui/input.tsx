import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "field-shell flex h-11 w-full rounded-2xl px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-0",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export { Input };
