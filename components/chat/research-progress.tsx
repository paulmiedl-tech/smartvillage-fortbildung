"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface ResearchProgressProps {
  label?: string;
  className?: string;
}

export function ResearchProgress({
  label = "Einen Augenblick",
  className,
}: ResearchProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full bg-[color:var(--color-muted)] px-3.5 py-1.5 text-xs text-[color:var(--color-muted-foreground)]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        <Dot delay={0} />
        <Dot delay={0.2} />
        <Dot delay={0.4} />
      </span>
      <span>{label}…</span>
    </motion.div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block size-1.5 rounded-full bg-[color:var(--color-accent)]"
      animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }}
      transition={{ duration: 1.5, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}
