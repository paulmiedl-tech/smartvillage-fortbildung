"use client";

import * as React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UIMessage } from "ai";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { normalizeProviderUrl } from "@/lib/providers";

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  const textContent = message.parts
    .filter((part): part is Extract<UIMessage["parts"][number], { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("");

  // Grounding sources intentionally ignored: we derive all user-facing
  // links from markdown links inside the assistant text, normalized via
  // the provider allowlist in lib/providers.ts. Raw Vertex redirect URLs
  // from source-url parts would leak ugly redirect hosts.

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex w-full gap-3 md:gap-4", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div
          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-muted)]"
          aria-hidden="true"
        >
          <Logo mark className="size-5" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%]",
          isUser
            ? "rounded-2xl rounded-tr-md bg-[color:var(--color-primary)] px-4 py-3 text-[color:var(--color-primary-foreground)]"
            : "rounded-2xl rounded-tl-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] px-4 py-3 text-[color:var(--color-foreground)] shadow-[var(--shadow-soft)]",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{textContent}</p>
        ) : (
          <div className="prose-chat text-[15px] leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {textContent}
            </ReactMarkdown>
            {isStreaming && textContent.length > 0 && (
              <span className="ml-0.5 inline-block h-[1.1em] w-[2px] -translate-y-[-2px] animate-pulse bg-[color:var(--color-accent)] align-middle" aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const markdownComponents = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-3 last:mb-0" {...props} />
  ),
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-2 mt-4 text-lg font-semibold first:mt-0" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-3 ml-4 list-disc space-y-1 marker:text-[color:var(--color-accent)]" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1 marker:text-[color:var(--color-accent)]" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props} />
  ),
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    // Normalize every URL the LLM emits through the provider allowlist
    // (lib/providers.ts). Trusted domains become clickable links to the
    // provider homepage (no deep-link 404 risk). Untrusted or invalid
    // URLs render as styled plaintext so the recommendation still reads
    // cleanly without a broken link.
    const normalized = normalizeProviderUrl(href);
    if (!normalized) {
      return (
        <span className="font-medium text-[color:var(--color-muted-foreground)]">
          {children}
        </span>
      );
    }
    return (
      <a
        {...props}
        href={normalized}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[color:var(--color-accent)] underline decoration-[color:var(--color-accent)]/30 underline-offset-2 transition-colors hover:decoration-[color:var(--color-accent)]"
      >
        {children}
      </a>
    );
  },
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-[color:var(--color-foreground)]" {...props} />
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-3 border-l-2 border-[color:var(--color-accent)] bg-[color:var(--color-muted)] px-4 py-2 text-sm text-[color:var(--color-muted-foreground)] italic"
      {...props}
    />
  ),
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        "rounded-md bg-[color:var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.85em]",
        className,
      )}
      {...props}
    />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-4 border-[color:var(--color-border)]" {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border-b border-[color:var(--color-border)] px-3 py-2 text-left font-semibold"
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-b border-[color:var(--color-border)] px-3 py-2" {...props} />
  ),
};
