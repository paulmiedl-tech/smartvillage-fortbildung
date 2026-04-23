"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The reset is broadcast as a window event so the Header stays decoupled
 * from the Chat component's internal state. Chat listens for `chat:reset`
 * and runs its own cleanup (stop stream, clear messages, clear storage).
 */
export const CHAT_RESET_EVENT = "chat:reset";

export function SiteHeader() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleConfirm = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CHAT_RESET_EVENT));
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
            aria-label="Neues Gespräch starten"
          >
            <Logo className="h-4 w-auto md:h-[18px]" />
            <span className="hidden text-xs font-medium text-[color:var(--color-muted-foreground)] sm:inline">
              · Fortbildungsempfehlungs-Bot
            </span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Neues Gespräch starten?"
        description="Dein aktuelles Gespräch wird beendet und der gesamte Verlauf gelöscht. Anschließend startest Du mit dem Onboarding von vorn."
      >
        <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
          Abbrechen
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Neues Gespräch starten
        </Button>
      </Dialog>
    </>
  );
}
