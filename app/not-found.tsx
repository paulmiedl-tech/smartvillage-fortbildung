import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-sm font-medium text-[color:var(--color-muted-foreground)]">404</p>
      <h1 className="text-2xl font-semibold">Die Seite gibt&apos;s hier nicht.</h1>
      <Button asChild variant="secondary">
        <Link href="/">Zurück zum Chat</Link>
      </Button>
    </div>
  );
}
