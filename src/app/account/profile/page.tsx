import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompleteForm } from "@/components/complete-form";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "تکمیل ثبت‌نام",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <AppShell title="تکمیل ثبت‌نام" titleAs="h1" backHref="/dashboard" variant="form">
      <Suspense fallback={<div className="h-40" />}>
        <ProfileGate />
      </Suspense>
    </AppShell>
  );
}

async function ProfileGate() {
  const session = await readSession();
  if (!session) redirect("/register");
  if (await hasProfile(session.phone)) redirect("/dashboard");

  return (
    <div className="profile-screen">
      <p className="profile-lead">نام، شماره شبا، تاریخ تولد و آدرس محل سکونت را بنویسید.</p>
      <CompleteForm />
    </div>
  );
}
