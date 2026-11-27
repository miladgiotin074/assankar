import type { ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SupportChat } from "@/components/support-chat";
import { getSettings } from "@/lib/settings";

export async function Frame({
  children,
  hashPrefix = "",
}: {
  children: ReactNode;
  hashPrefix?: string;
}) {
  const settings = await getSettings();
  return (
    <>
      <a className="skip" href="#main">
        رفتن به محتوا
      </a>
      <Header hashPrefix={hashPrefix} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer hashPrefix={hashPrefix} />
      <SupportChat telegramUser={settings.telegramUser} />
    </>
  );
}
