import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { submitNationalId } from "@/app/account/actions";
import { faDigits } from "@/lib/format";
import { readPendingPhone, readSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "کد ملی",
  robots: { index: false, follow: false },
};

export default function NationalIdPage() {
  return (
    <AppShell title="آسان‌کار" backHref="/register">
      <Suspense fallback={<div className="h-40" />}>
        <NationalIdStep />
      </Suspense>
    </AppShell>
  );
}

async function NationalIdStep() {
  if (await readSession()) redirect("/dashboard");
  const phone = await readPendingPhone();
  if (!phone) redirect("/register");

  const shown = faDigits(phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"));

  return (
    <AuthCard title="کد ملی" copy="کد ملی ده رقمی را بنویسید.">
      <p className="auth-phone-label">شماره واردشده</p>
      <p className="auth-phone" dir="ltr">
        {shown}
      </p>
      <AuthForm
        action={submitNationalId}
        field="nationalId"
        label="کد ملی"
        hint="ده رقم، بدون خط تیره."
        autoComplete="off"
        inputMode="numeric"
        maxLength={10}
        submitLabel="ورود به داشبورد"
      />
    </AuthCard>
  );
}
