"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface ResearchProgressProps {
  className?: string;
}

/**
 * Rotating status messages shown while the model is processing.
 *
 * The indicator is mounted only while `status === "submitted"` in
 * chat.tsx, i.e. after the user's send until the first token arrives.
 * Gemini + Google Search Grounding typically takes 5-30 seconds in
 * that window. We rotate through three user-facing stages that roughly
 * map to what the model is doing under the hood; the last stage is
 * sticky so long searches end on "preparing recommendations" rather
 * than looping back to "searching".
 */
const STAGES = [
  "Durchsuche Quellen",
  "Validiere Anbieter",
  "Stelle Empfehlungen zusammen",
] as const;

const STAGE_DURATION_MS = 3500;

export function ResearchProgress({ className }: ResearchProgressProps) {
  const [stageIndex, setStageIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, STAGE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  const label = STAGES[stageIndex];

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
      aria-atomic="true"
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        <Dot delay={0} />
        <Dot delay={0.2} />
        <Dot delay={0.4} />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={stageIndex}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          {label}…
        </motion.span>
      </AnimatePresence>
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
