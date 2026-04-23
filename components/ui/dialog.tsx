"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Minimal accessible confirmation dialog.
 *
 * Handles ESC-to-close, backdrop click, body-scroll lock, and restores focus
 * on close. Uses Framer Motion for enter/exit. Focus lands on the first
 * focusable button inside on open.
 */
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first focusable element in the dialog (usually the primary button).
    const focusTimer = window.setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;
      const focusable = el.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }, 10);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-[color:var(--color-foreground)]/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sv-dialog-title"
            aria-describedby={description ? "sv-dialog-desc" : undefined}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 shadow-[var(--shadow-lift)]"
          >
            <h2
              id="sv-dialog-title"
              className="text-lg font-semibold tracking-tight text-[color:var(--color-foreground)]"
            >
              {title}
            </h2>
            {description && (
              <p
                id="sv-dialog-desc"
                className="mt-2 text-sm leading-relaxed text-[color:var(--color-muted-foreground)]"
              >
                {description}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
