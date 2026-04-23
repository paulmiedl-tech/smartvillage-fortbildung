# smartvillage Fortbildungsempfehlungs-Bot

Ein kuratierender Fortbildungs-Advisor für smarties. Strukturiertes 5-Schritt-Onboarding, anschließend fünf kuratierte Empfehlungen auf Basis echter, gegroundeter Recherche. Kein generischer Suchaggregator, sondern Advisor-Logik mit hartem Qualitätsfilter, Budget-first-Priorisierung und strikter Link-Validierung.

## Stack

- **Next.js 15** (App Router) + **TypeScript** strict
- **Tailwind CSS v4** (CSS-first Config, keine `tailwind.config.js`)
- **Vercel AI SDK v5** (`ai`, `@ai-sdk/google`, `@ai-sdk/react`)
- **Gemini 2.5 Flash** mit Google Search Grounding (server-side, niemals client-exposed)
- **shadcn-Primitives** (Button, Textarea, Badge) + Framer Motion + Lucide Icons
- **Inter** via `next/font/google` (GDPR-konform self-hosted)
- **localStorage** für Chat-Persistenz (MVP, drop-in-ready für Vercel KV)

## Lokale Entwicklung

```bash
# Node 20 (via nvm .nvmrc)
nvm use

pnpm install

# Env vorbereiten
cp .env.example .env.local
# .env.local öffnen und GOOGLE_GENERATIVE_AI_API_KEY eintragen

pnpm dev
```

Dev-Server: http://localhost:3000

## Env Variables

| Name | Required | Scope | Purpose |
|---|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | server-side only | Gemini API Key aus Google AI Studio |

**Hinweis:** Der Key wird ausschließlich serverseitig in [app/api/chat/route.ts](app/api/chat/route.ts) gelesen. Niemals mit `NEXT_PUBLIC_`-Präfix versehen, sonst landet er im Client-Bundle.

## Scripts

```bash
pnpm dev        # Turbopack Dev-Server
pnpm build      # Production Build
pnpm start      # Production Server (nach build)
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
```

## Projektstruktur

```
app/
  api/chat/route.ts       # Gemini streaming + Google Search Grounding
  globals.css             # Design Tokens (light + dark), Brand Palette
  layout.tsx              # Theme Provider, Fonts, Background Decor
  page.tsx                # Single page: Header + Chat
components/
  background-decor.tsx    # Ambient Gradient + Dot-Network Pattern
  chat/                   # Chat, Messages, Onboarding, Input, ResearchProgress
  site-header.tsx         # Header mit Reset-Modal via chat:reset Event
  theme-provider.tsx      # next-themes Wrapper
  theme-toggle.tsx        # Light/Dark Toggle
  logo.tsx                # Inline SVG Logo (Mark + Wordmark Variants)
  ui/                     # Button, Badge, Textarea, Dialog (primitives)
lib/
  ai/system-prompt.ts     # Systemprompt (kuratierende Advisor-Logik)
  utils.ts                # cn() Tailwind helper
```

## Design-System

- **Brand-Farben:** Navy `#000831`, Coral `#FF5A49`, Lavender `#D1DEFF`, Offwhite `#FBFAF9`
- **Dark-Mode** vollständig designt (`next-themes`, `.dark` Klasse auf `<html>`)
- **Typografie:** Inter (Variable), Line-Heights großzügig, 8-pt Grid
- **Motion:** Framer Motion sparsam, respektiert `prefers-reduced-motion`
- **A11y:** WCAG 2.2 AA, Focus-Rings sichtbar, ARIA-Live für Streaming, Keyboard-navigierbar

## Deployment zu Vercel

### 1. Repository verbinden

1. Bei Vercel einloggen → **New Project**
2. GitHub Repository `paulmiedl-tech/smartvillage-fortbildung` auswählen
3. Framework Preset wird automatisch als **Next.js** erkannt, package manager als **pnpm**
4. **Root Directory:** leer lassen (Repo-Root)
5. **Build Command:** `pnpm build` (Default)
6. **Install Command:** `pnpm install` (Default)

### 2. Environment Variable setzen

Unter **Project Settings → Environment Variables**:

| Key | Value | Environments |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | (aus Google AI Studio) | Production, Preview, Development |

Nach dem Setzen: **Redeploy** damit die Variable aktiv wird.

### 3. Region

Die Region ist in [vercel.json](vercel.json) auf `fra1` (Frankfurt) gesetzt für GDPR-Konformität und niedrige Latenz in DACH.

### 4. Custom Domain (optional)

Unter **Project Settings → Domains** beliebige Domain anbinden. Vercel stellt automatisch ein TLS-Zertifikat aus.

## Sicherheit

- **API Key niemals committen.** `.env.local` ist in `.gitignore`.
- **Kein `NEXT_PUBLIC_`-Präfix** für sensitive Server-Variablen.
- **Keine Analytics oder Third-Party-Tracking** in MVP. Falls später nötig, Plausible self-hosted.
- **No-Index:** Meta-Tag `robots: noindex, nofollow` in [app/layout.tsx](app/layout.tsx), bis der Bot produktiv freigegeben ist.

## Kostenkontrolle

- **Gemini 2.5 Flash:** 0,075 $/1M Input-Tokens, 0,30 $/1M Output-Tokens (Stand 2026-04).
- **Message History Cap:** API-Route schickt nur die letzten 20 Messages an das Modell ([app/api/chat/route.ts](app/api/chat/route.ts)).
- **Systemprompt:** ~1.500 Tokens, gesendet pro Turn. Bei stabilem Traffic empfohlen: Gemini Context Caching einbauen (nicht im MVP-Scope).

## Roadmap (nicht im MVP)

- Vercel KV für serverseitige Chat-Persistenz (mehrere Devices)
- Prompt Caching (Gemini `cachedContent`) für Kosten-Reduktion
- Admin-Interface für Prompt-Iteration ohne Code-Deploy
- Feedback-Mechanismus pro Empfehlung (thumbs up/down → Analytics)
- Bildungsurlaub-Integration mit Bundesland-Filter
- Multi-User Auth (falls später gewünscht)
