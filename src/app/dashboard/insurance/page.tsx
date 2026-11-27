import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BankCard, PaymentForm } from "@/components/payment-form";
import { submitInsuranceReceipt } from "@/app/dashboard/payment/actions";
import { readChoices } from "@/lib/catalog";
import { readPayment } from "@/lib/payment";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "واریز هزینه بیمه",
  robots: { index: false, follow: false },
};

export default function InsurancePage() {
  return (
    <AppShell title="واریز بیمه" titleAs="h1" backHref="/dashboard" variant="form">
      <Suspense fallback={<div className="h-40" />}>
        <InsuranceGate />
      </Suspense>
    </AppShell>
  );
}

async function InsuranceGate() {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");
  if (!(await readChoices(session.phone)).length) redirect("/dashboard/products");

  const registration = await readPayment(session.phone, "registration");
  if (registration?.status !== "approved") redirect("/dashboard/payment");

  const payment = await readPayment(session.phone, "insurance");
  const status = payment?.status ?? "none";
  const receiptUrl = payment?.fileId ? `/api/receipts/${payment.fileId}` : "";

  return (
    <div className="pay-screen">
      <div className="pay-intro">
        <p className="pay-kicker">مرحله بیمه</p>
        <h2 className="pay-title">واریز هزینهٔ بیمه</h2>
        <p className="pay-lead">
          بعد از تأیید ثبت‌نام، هزینهٔ بیمه را به همان کارت واریز کنید و عکس فیش را بفرستید.
        </p>
      </div>
      <BankCard
        number={site.payoutCard}
        holder={site.payoutHolder}
        bank={site.payoutBank}
        purpose="فقط برای واریز هزینهٔ بیمه آسان‌کار"
      />
      <PaymentForm
        amount={site.insuranceFee}
        status={status}
        receiptUrl={receiptUrl}
        title="هزینه بیمه"
        nextHint="بعد از تأیید فیش بیمه، مرحلهٔ ضمانت کالا باز می‌شود."
        action={submitInsuranceReceipt}
      />
    </div>
  );
}
