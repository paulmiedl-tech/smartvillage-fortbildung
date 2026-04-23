"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder = "Frag mich nach einer Fortbildung…",
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!disabled && value.trim().length > 0) onSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="relative w-full"
    >
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-2 shadow-[var(--shadow-soft)] transition-colors focus-within:border-[color:var(--color-foreground)]",
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled && !isStreaming}
          className="max-h-[220px] min-h-[44px] border-0 bg-transparent px-2.5 py-2.5 shadow-none focus:border-0 focus:ring-0 scrollbar-thin"
          aria-label="Nachricht"
        />
        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={onStop}
            aria-label="Antwort stoppen"
          >
            <Square className="fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            variant="primary"
            disabled={!canSend}
            aria-label="Nachricht senden"
          >
            <ArrowUp />
          </Button>
        )}
      </div>
      <p className="mt-2 hidden px-2 text-center text-xs text-[color:var(--color-muted-foreground)] sm:block">
        Shift + Enter für eine neue Zeile · Enter zum Senden
      </p>
    </form>
  );
}
