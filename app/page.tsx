import { SiteHeader } from "@/components/site-header";
import { Chat } from "@/components/chat/chat";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 overflow-hidden">
        <Chat />
      </main>
    </div>
  );
}
