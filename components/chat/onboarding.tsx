"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarClock,
  Coins,
  Compass,
  Euro,
  GraduationCap,
  Headphones,
  MessageCircle,
  Monitor,
  PiggyBank,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type IntentId = "training" | "career" | "funding" | "individual";

interface IntentDef {
  id: IntentId;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const INTENTS: IntentDef[] = [
  {
    id: "training",
    title: "Fortbildung finden",
    desc: "Konkretes Thema, Zertifikat oder Kurs. Ich finde passende Angebote.",
    icon: Search,
  },
  {
    id: "career",
    title: "Karriere gezielt entwickeln",
    desc: "Nächster Schritt, neue Rolle, neue Skills. Strategisch gedacht.",
    icon: TrendingUp,
  },
  {
    id: "funding",
    title: "Förderung und Budget nutzen",
    desc: "Bildungsgutschein, Bildungsurlaub, VBG & Co. Was passt zu Dir?",
    icon: Euro,
  },
  {
    id: "individual",
    title: "Individuelle Beratung starten",
    desc: "Du bist noch unsicher? Wir schauen gemeinsam, was Dir weiterhilft.",
    icon: MessageCircle,
  },
];

const ROLE_OPTIONS = [
  { label: "Azubi / Werkstudent:in", icon: GraduationCap },
  { label: "Junior / Berufseinsteiger:in", icon: User },
  { label: "Mid-Level / Fachkraft", icon: Briefcase },
  { label: "Senior / Expert:in", icon: Star },
  { label: "Team Lead / Führungskraft", icon: Users },
  { label: "Management / Direction", icon: Compass },
];

const FORMAT_OPTIONS = [
  { label: "Seminar oder Workshop (vor Ort)", icon: Users },
  { label: "Online-Kurs, selbstgetaktet", icon: Monitor },
  { label: "Coaching oder 1:1", icon: User },
  { label: "Konferenz oder Messe", icon: Calendar },
  { label: "Podcast, Buch oder Community", icon: Headphones },
  { label: "Offen, überrasche mich", icon: Sparkles },
];

const TIME_OPTIONS = [
  { label: "So schnell wie möglich", icon: Zap },
  { label: "In den nächsten 1 bis 3 Monaten", icon: CalendarClock },
  { label: "Dieses Halbjahr", icon: Calendar },
  { label: "Dieses Jahr", icon: Calendar },
  { label: "Zeitlich flexibel", icon: Sparkles },
];

const BUDGET_OPTIONS = [
  { label: "Kostenfrei oder bis 500 €", icon: PiggyBank },
  { label: "Bis 1.000 €", icon: Coins },
  { label: "Standard 2.000 € (smartvillage-Jahresbudget)", icon: Wallet },
  { label: "Flexibel, Qualität zählt mehr", icon: Sparkles },
  { label: "Ich bin unsicher, empfiehl mir was passt", icon: Compass },
];

const STEPS = ["goal", "role", "format", "time", "budget"] as const;
type StepId = (typeof STEPS)[number];

interface OnboardingProps {
  onSubmit: (text: string) => void;
}

export function Onboarding({ onSubmit }: OnboardingProps) {
  const [intent, setIntent] = React.useState<IntentId | null>(null);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [goal, setGoal] = React.useState("");
  const [role, setRole] = React.useState("");
  const [format, setFormat] = React.useState("");
  const [time, setTime] = React.useState("");
  const [budget, setBudget] = React.useState("");

  const handleIntent = (id: IntentId) => {
    if (id === "individual") {
      onSubmit(
        "Hi, ich weiß noch nicht genau, in welche Richtung meine Weiterbildung gehen soll. Lass uns bitte kurz zusammen überlegen, was zu mir passen könnte.",
      );
      return;
    }
    // Reset picklists when switching intent so carry-over doesn't confuse the
    // user (e.g. a "career" role selection showing up in "funding" flow).
    // The goal textarea is intentionally preserved: it's real typed content
    // and often still relevant across related intents.
    if (intent !== null && intent !== id) {
      setRole("");
      setFormat("");
      setTime("");
      setBudget("");
    }
    setIntent(id);
    setStepIndex(0);
  };

  const goBack = () => {
    if (stepIndex === 0) {
      setIntent(null);
      return;
    }
    setStepIndex((s) => s - 1);
  };

  const goForward = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((s) => s + 1);
    } else {
      submitComposed();
    }
  };

  const submitComposed = () => {
    if (!intent) return;
    const text = composeMessage(intent, { goal, role, format, time, budget });
    onSubmit(text);
  };

  if (!intent) {
    return <IntentPicker onPick={handleIntent} />;
  }

  const currentStep: StepId = STEPS[stepIndex];
  const canGoForward =
    (currentStep === "goal" && goal.trim().length >= 3) ||
    (currentStep === "role" && role.length > 0) ||
    (currentStep === "format" && format.length > 0) ||
    (currentStep === "time" && time.length > 0) ||
    (currentStep === "budget" && budget.length > 0);

  return (
    <div className="flex flex-col gap-6 py-6 md:py-10">
      <WizardHeader
        intent={intent}
        stepIndex={stepIndex}
        totalSteps={STEPS.length}
        onBack={goBack}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-5"
        >
          {currentStep === "goal" && (
            <GoalStep intent={intent} value={goal} onChange={setGoal} onNext={goForward} />
          )}
          {currentStep === "role" && (
            <PicklistStep
              title="Wo stehst Du aktuell beruflich?"
              options={ROLE_OPTIONS}
              value={role}
              onPick={(v) => {
                setRole(v);
                setStepIndex((s) => s + 1);
              }}
            />
          )}
          {currentStep === "format" && (
            <PicklistStep
              title="Welches Format passt am besten zu Dir?"
              options={FORMAT_OPTIONS}
              value={format}
              onPick={(v) => {
                setFormat(v);
                setStepIndex((s) => s + 1);
              }}
            />
          )}
          {currentStep === "time" && (
            <PicklistStep
              title="Wann möchtest Du starten?"
              options={TIME_OPTIONS}
              value={time}
              onPick={(v) => {
                setTime(v);
                setStepIndex((s) => s + 1);
              }}
            />
          )}
          {currentStep === "budget" && (
            <PicklistStep
              title="Welcher Budget-Rahmen passt?"
              options={BUDGET_OPTIONS}
              value={budget}
              onPick={(v) => {
                setBudget(v);
                const composed = composeMessage(intent, {
                  goal,
                  role,
                  format,
                  time,
                  budget: v,
                });
                onSubmit(composed);
              }}
              finishLabel="Los geht's"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {currentStep === "goal" && (
        <div className="flex justify-end">
          <Button onClick={goForward} disabled={!canGoForward}>
            Weiter
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Intent picker                                                     */
/* ------------------------------------------------------------------ */

function IntentPicker({ onPick }: { onPick: (id: IntentId) => void }) {
  return (
    <div className="flex flex-col gap-8 py-6 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-lavender)] px-3 py-1 text-xs font-medium text-[color:var(--color-primary)]">
          <Sparkles className="size-3.5" />
          Dein persönlicher Fortbildungs-Assistent
        </span>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-[color:var(--color-foreground)] md:text-4xl">
          Lass uns Deine nächste Fortbildung finden.
        </h1>
        <p className="max-w-xl text-balance text-[15px] leading-relaxed text-[color:var(--color-muted-foreground)]">
          In fünf kurzen Schritten bekommst Du fünf kuratierte Empfehlungen,
          passend zu Deinem Ziel, Budget und Format. Wähl einfach, womit Du starten
          willst.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid w-full gap-3 sm:grid-cols-2"
      >
        {INTENTS.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onPick(it.id)}
            className="group flex items-start gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4 text-left shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--color-accent)]/40 hover:shadow-[var(--shadow-lift)] md:p-5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-lavender)] text-[color:var(--color-primary)] transition-colors group-hover:bg-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent-foreground)]">
              <it.icon className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[color:var(--color-foreground)] md:text-[15px]">
                {it.title}
              </p>
              <p className="text-xs leading-relaxed text-[color:var(--color-muted-foreground)] md:text-[13px]">
                {it.desc}
              </p>
            </div>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wizard shell                                                      */
/* ------------------------------------------------------------------ */

function WizardHeader({
  intent,
  stepIndex,
  totalSteps,
  onBack,
}: {
  intent: IntentId;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
}) {
  const intentDef = INTENTS.find((i) => i.id === intent)!;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 text-xs text-[color:var(--color-muted-foreground)]"
        >
          <ArrowLeft className="size-3.5" />
          Zurück
        </Button>
        <span className="text-xs font-medium text-[color:var(--color-muted-foreground)]">
          Schritt {stepIndex + 1} von {totalSteps}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[color:var(--color-lavender)] text-[color:var(--color-primary)]">
          <intentDef.icon className="size-4" />
        </div>
        <span className="text-xs font-medium text-[color:var(--color-muted-foreground)]">
          {intentDef.title}
        </span>
      </div>
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= stepIndex
                ? "bg-[color:var(--color-accent)]"
                : "bg-[color:var(--color-border)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Goal step (free text)                                             */
/* ------------------------------------------------------------------ */

function GoalStep({
  intent,
  value,
  onChange,
  onNext,
}: {
  intent: IntentId;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const placeholder = goalPlaceholder(intent);
  const question = goalQuestion(intent);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (value.trim().length >= 3) onNext();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight text-[color:var(--color-foreground)] md:text-2xl">
        {question}
      </h2>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        className="min-h-[120px] text-[15px] leading-relaxed"
        aria-label="Dein Ziel"
        autoFocus
      />
      <p className="text-xs text-[color:var(--color-muted-foreground)]">
        Ein, zwei Sätze reichen völlig. Je konkreter, desto besser die Empfehlungen.
      </p>
    </div>
  );
}

function goalQuestion(intent: IntentId) {
  switch (intent) {
    case "training":
      return "Welches Thema oder welche Fähigkeit möchtest Du lernen?";
    case "career":
      return "Was ist Dein nächstes berufliches Ziel?";
    case "funding":
      return "Welche Fortbildung hast Du im Blick, oder welches Thema?";
    default:
      return "Worum geht's?";
  }
}

function goalPlaceholder(intent: IntentId) {
  switch (intent) {
    case "training":
      return "z. B. Verhandlungstraining für Kundengespräche, HubSpot-Zertifizierung, Figma für Product Designer…";
    case "career":
      return "z. B. in Richtung Teamlead wachsen, in PM wechseln, strategischer werden, Executive-Skills aufbauen…";
    case "funding":
      return "z. B. Projektmanagement-Zertifizierung (Prince2), Ausbildung zum Scrum Master, Weiterbildung im Marketing…";
    default:
      return "Erzähl mir, woran Du gerade arbeitest.";
  }
}

/* ------------------------------------------------------------------ */
/*  Picklist step                                                     */
/* ------------------------------------------------------------------ */

function PicklistStep({
  title,
  options,
  value,
  onPick,
  finishLabel,
}: {
  title: string;
  options: Array<{ label: string; icon: React.ComponentType<{ className?: string }> }>;
  value: string;
  onPick: (v: string) => void;
  finishLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight text-[color:var(--color-foreground)] md:text-2xl">
        {title}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = value === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onPick(opt.label)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border bg-[color:var(--color-card)] px-4 py-3 text-left shadow-[var(--shadow-soft)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
                selected
                  ? "border-[color:var(--color-accent)] ring-2 ring-[color:var(--color-accent)]/20"
                  : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/40",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  selected
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]"
                    : "bg-[color:var(--color-lavender)] text-[color:var(--color-primary)] group-hover:bg-[color:var(--color-accent)] group-hover:text-[color:var(--color-accent-foreground)]",
                )}
              >
                <opt.icon className="size-4" />
              </span>
              <span className="text-sm font-medium text-[color:var(--color-foreground)]">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {finishLabel && (
        <p className="text-xs text-[color:var(--color-muted-foreground)]">
          Nach Auswahl geht&apos;s direkt los. Ich beginne mit der Recherche.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message composition                                               */
/* ------------------------------------------------------------------ */

function composeMessage(
  intent: IntentId,
  answers: {
    goal: string;
    role: string;
    format: string;
    time: string;
    budget: string;
  },
): string {
  const headline = (() => {
    switch (intent) {
      case "training":
        return "Ich suche eine Fortbildung.";
      case "career":
        return "Ich möchte mich beruflich weiterentwickeln.";
      case "funding":
        return "Ich suche Fördermöglichkeiten für eine Fortbildung.";
      default:
        return "Lass uns loslegen.";
    }
  })();

  // Consistent label keys regardless of intent. The system prompt
  // pattern-matches on exactly these labels to detect "structured onboarding
  // input" and skip the clarifying-questions phase.
  return [
    headline,
    "",
    `Ziel: ${answers.goal.trim()}`,
    `Rolle: ${answers.role}`,
    `Format: ${answers.format}`,
    `Zeitrahmen: ${answers.time}`,
    `Budget: ${answers.budget}`,
  ].join("\n");
}
