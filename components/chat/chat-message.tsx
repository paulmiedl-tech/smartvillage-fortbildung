"use client";

import * as React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UIMessage } from "ai";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { normalizeProviderUrl } from "@/lib/providers";

/**
 * Detects a funding-status suffix at the end of a paragraph so the
 * rendering can replace it with a visual Badge component instead of
 * inline "· Förderfähig: X" text.
 *
 * Matches (separator required, detail optional):
 *   · Förderfähig
 *   · Förderfähig: Bildungsgutschein
 *   · Evtl. Förderfähig
 *   · Evtl. Förderfähig: Bildungsurlaub NRW
 *   · Keine Förderung
 *   · Keine Förderung bekannt
 */
const FUNDING_SUFFIX_REGEX =
  /\s*·\s*(Förderfähig|Evtl\.?\s*Förderfähig|Keine\s+Förderung(?:\s+bekannt)?)(?:\s*:\s*([^·\n]+?))?\s*$/i;

type FundingVariant = "success" | "tentative" | "muted";

interface FundingExtraction {
  before: React.ReactNode[];
  variant: FundingVariant;
  label: string;
}

function extractFundingSuffix(children: React.ReactNode): FundingExtraction | null {
  const arr = React.Children.toArray(children);
  if (arr.length === 0) return null;
  const lastIndex = arr.length - 1;
  const last = arr[lastIndex];
  if (typeof last !== "string") return null;

  const match = last.match(FUNDING_SUFFIX_REGEX);
  if (!match || match.index === undefined) return null;

  const statusRaw = match[1].toLowerCase().replace(/\s+/g, " ").trim();
  const detail = match[2]?.trim();

  let variant: FundingVariant;
  let label: string;
  if (statusRaw.startsWith("evtl")) {
    variant = "tentative";
    label = detail ? `Evtl. förderfähig · ${detail}` : "Evtl. förderfähig";
  } else if (statusRaw.startsWith("keine")) {
    variant = "muted";
    label = "Keine Förderung";
  } else {
    variant = "success";
    label = detail ? `Förderfähig · ${detail}` : "Förderfähig";
  }

  const truncatedLast = last.slice(0, match.index).trimEnd();
  const before: React.ReactNode[] = [...arr.slice(0, lastIndex)];
  if (truncatedLast.length > 0) before.push(truncatedLast);

  return { before, variant, label };
}

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
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
    // If this paragraph ends with a funding-status suffix (see
    // FUNDING_SUFFIX_REGEX above), strip the suffix from the text and
    // render it as a visual Badge at the end. The badge carries its own
    // whitespace-nowrap, so it wraps cleanly to the next line on narrow
    // viewports instead of breaking internally.
    const funding = extractFundingSuffix(children);
    if (funding) {
      return (
        <p className="mb-3 last:mb-0" {...props}>
          {funding.before}{" "}
          <Badge variant={funding.variant} className="align-baseline">
            {funding.label}
          </Badge>
        </p>
      );
    }
    return (
      <p className="mb-3 last:mb-0" {...props}>
        {children}
      </p>
    );
  },
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
    // (lib/providers.ts). Three rendering paths:
    //   1. Hostname on allowlist → direct homepage link (primary accent)
    //   2. Hostname NOT on allowlist but we have readable link text →
    //      Google search fallback (same visual, acts as "search this
    //      provider" button). Ensures no dead-ends: every visible link
    //      takes the user somewhere useful.
    //   3. No usable link text at all → plaintext fallback.
    const normalized = normalizeProviderUrl(href);
    const linkTextRaw = typeof children === "string"
      ? children
      : Array.isArray(children)
        ? children.filter((c) => typeof c === "string").join(" ")
        : "";
    const linkText = linkTextRaw.trim();

    if (normalized) {
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
    }

    // Fallback: LLM mentioned a provider/host we don't have on the
    // allowlist. Route the click to a Google search for the link text
    // rather than leaving the user with dead plaintext. The search result
    // almost always surfaces the correct provider page on first try.
    if (linkText.length >= 3 && linkText.length <= 80) {
      const fallbackHref = `https://www.google.com/search?q=${encodeURIComponent(linkText)}`;
      return (
        <a
          {...props}
          href={fallbackHref}
          target="_blank"
          rel="noopener noreferrer"
          title={`Google-Suche nach „${linkText}"`}
          className="font-medium text-[color:var(--color-muted-foreground)] underline decoration-dotted decoration-[color:var(--color-muted-foreground)]/50 underline-offset-2 transition-colors hover:text-[color:var(--color-accent)] hover:decoration-[color:var(--color-accent)]"
        >
          {children}
        </a>
      );
    }

    return (
      <span className="font-medium text-[color:var(--color-muted-foreground)]">
        {children}
      </span>
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
