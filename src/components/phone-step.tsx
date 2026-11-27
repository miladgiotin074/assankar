import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { submitPhone } from "@/app/account/actions";
import { readSession } from "@/lib/session";

export async function PhoneStep() {
  if (await readSession()) redirect("/dashboard");

  return (
    <AuthForm
      action={submitPhone}
      field="phone"
      label="شماره موبایل"
      hint="با ۰۹ شروع می‌شود و یازده رقم است."
      autoComplete="tel"
      inputMode="tel"
      maxLength={16}
      submitLabel="ادامه"
    />
  );
}
