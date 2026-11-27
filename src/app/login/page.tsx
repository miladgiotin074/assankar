import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthCard } from "@/components/auth-card";
import { PhoneStep } from "@/components/phone-step";

export const metadata: Metadata = {
  title: "ثبت‌نام و ورود",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AppShell title="آسان‌کار">
      <AuthCard title="ثبت‌نام و ورود" copy="شماره موبایل خود را بنویسید.">
        <Suspense fallback={<div className="h-40" />}>
          <PhoneStep />
        </Suspense>
      </AuthCard>
    </AppShell>
  );
}
