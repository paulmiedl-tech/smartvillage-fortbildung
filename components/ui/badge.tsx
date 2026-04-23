import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
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
          "border-[color:var(--color-border)] text-[color:var(--color-foreground)] bg-transparent",
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
