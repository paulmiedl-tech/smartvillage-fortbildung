import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-[1.35] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]",
        accent:
          "border-transparent bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]",
        soft:
          "border-transparent bg-[color:var(--color-lavender)] text-[color:var(--color-primary)]",
        muted:
          "border-transparent bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)]",
        outline:
          "border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] bg-transparent",
        success:
          "border-transparent bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] dark:bg-[color:var(--color-success)]/20",
        tentative:
          "border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] bg-[color:var(--color-muted)]/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
