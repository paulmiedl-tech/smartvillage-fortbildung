"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { Onboarding } from "@/components/chat/onboarding";
import { ResearchProgress } from "@/components/chat/research-progress";
import { CHAT_RESET_EVENT } from "@/components/site-header";

const STORAGE_KEY = "smartvillage:chat:v1";

/**
 * Keep the persisted history bounded. The API route already caps what's
 * sent to the model; this cap protects localStorage quota and mobile
 * parse/stringify cost on every turn.
 */
const MAX_STORED_MESSAGES = 50;

/** Pixels from the bottom within which we consider the user "at the bottom". */
const NEAR_BOTTOM_THRESHOLD = 120;

export function Chat() {
  const [input, setInput] = React.useState("");
  const [hydrated, setHydrated] = React.useState(false);
  const [initialMessages, setInitialMessages] = React.useState<UIMessage[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UIMessage[];
        if (Array.isArray(parsed)) setInitialMessages(parsed);
      }
    } catch {
      // corrupt storage — ignore, start fresh
    }
    setHydrated(true);
  }, []);

  if (!hydrated) return <ChatSkeleton />;

  return <ChatInner input={input} setInput={setInput} initialMessages={initialMessages} />;
}

function ChatInner({
  input,
  setInput,
  initialMessages,
}: {
  input: string;
  setInput: (v: string) => void;
  initialMessages: UIMessage[];
}) {
  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => {
      // Keep the toast friendly; developer details go to console, not UI.
      console.error("[chat] request failed", err);
      toast.error("Da ging was schief. Magst Du es nochmal probieren?");
    },
  });

  // Persist a bounded slice of messages to localStorage.
  React.useEffect(() => {
    try {
      if (messages.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const toStore = messages.slice(-MAX_STORED_MESSAGES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      }
    } catch {
      // quota exceeded / private mode — silent
    }
  }, [messages]);

  // --- Smart scroll -------------------------------------------------------
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const isNearBottomRef = React.useRef(true);
  const [showJumpButton, setShowJumpButton] = React.useState(false);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = distance < NEAR_BOTTOM_THRESHOLD;
      isNearBottomRef.current = near;
      setShowJumpButton(!near);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  // Auto-scroll only if the user is already near the bottom OR just sent a
  // message. Prevents yanking the viewport while they re-read history.
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const userJustSent = last?.role === "user";
    if (isNearBottomRef.current || userJustSent) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, status]);

  const scrollToBottom = () => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };
  // -----------------------------------------------------------------------

  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = (text?: string) => {
    if (isBusy) return; // defend against double submits
    const content = (text ?? input).trim();
    if (!content) return;
    sendMessage({ text: content });
    setInput("");
  };

  const handleReset = React.useCallback(() => {
    if (status === "streaming" || status === "submitted") {
      stop();
    }
    setMessages([]);
    setInput("");
  }, [status, stop, setMessages, setInput]);

  // Listen for the header's "new conversation" confirmation event.
  React.useEffect(() => {
    const handler = () => handleReset();
    window.addEventListener(CHAT_RESET_EVENT, handler);
    return () => window.removeEventListener(CHAT_RESET_EVENT, handler);
  }, [handleReset]);

  const isEmpty = messages.length === 0;
  const lastMessage = messages[messages.length - 1];
  const lastIsAssistantStreaming =
    status === "streaming" && lastMessage?.role === "assistant";
  const showThinkingBubble = status === "submitted" && !lastIsAssistantStreaming;

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
        aria-live="polite"
      >
        <div className="mx-auto w-full max-w-5xl px-4 pb-6 pt-4 md:px-6 md:pt-8">
          {isEmpty ? (
            <Onboarding onSubmit={handleSubmit} />
          ) : (
            <div className="flex flex-col gap-5">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const isLast = i === messages.length - 1;
                  const streaming =
                    isLast && lastIsAssistantStreaming && m.role === "assistant";
                  return (
                    <ChatMessage key={m.id} message={m} isStreaming={streaming} />
                  );
                })}
              </AnimatePresence>
              {showThinkingBubble && (
                <div className="flex w-full justify-start pl-11">
                  <ResearchProgress />
                </div>
              )}
              {error && !isBusy && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex w-full justify-start pl-11"
                >
                  <p className="text-xs text-[color:var(--color-destructive)]">
                    Fehler bei der Antwort. Bitte nochmal probieren.
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Jump-to-latest pill: appears only when user has scrolled up */}
      <AnimatePresence>
        {showJumpButton && !isEmpty && (
          <motion.button
            type="button"
            onClick={scrollToBottom}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[96px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-foreground)] shadow-[var(--shadow-lift)] transition-colors hover:bg-[color:var(--color-muted)]"
            aria-label="Zur aktuellen Nachricht springen"
          >
            <ArrowDown className="size-3.5" />
            Neueste Nachricht
          </motion.button>
        )}
      </AnimatePresence>

      <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-background)]/85 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
        <div className="mx-auto w-full max-w-5xl">
          {messages.length > 0 && (
            <div className="mb-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-[color:var(--color-muted-foreground)]"
              >
                <RefreshCcw className="size-3.5" />
                Neues Gespräch
              </Button>
            </div>
          )}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => handleSubmit()}
            onStop={stop}
            disabled={isBusy}
            isStreaming={isBusy}
          />
        </div>
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return <div className="h-full" />;
}
