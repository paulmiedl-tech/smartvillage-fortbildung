import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[52px] w-full resize-none rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-3 text-base leading-relaxed text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-muted-foreground)] transition-colors focus:outline-none focus:border-[color:var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
