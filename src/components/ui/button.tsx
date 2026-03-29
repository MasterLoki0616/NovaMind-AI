import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "button-shell inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50 motion-safe:transform-gpu motion-safe:hover:-translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-glow hover:brightness-[1.08] hover:shadow-[0_0_0_1px_rgba(125,211,252,0.16),0_22px_60px_rgba(2,6,23,0.48)]",
        secondary:
          "border border-border bg-card/75 text-foreground hover:border-primary/20 hover:bg-card/90 hover:shadow-[0_16px_38px_rgba(2,6,23,0.26)]",
        ghost:
          "text-muted-foreground hover:bg-card/80 hover:text-foreground hover:shadow-[0_12px_28px_rgba(2,6,23,0.2)]",
        outline:
          "border border-border bg-transparent text-foreground hover:border-primary/25 hover:bg-card/70 hover:shadow-[0_14px_32px_rgba(2,6,23,0.22)]"
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-12 rounded-2xl px-5",
        icon: "h-11 w-11 rounded-2xl"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
