import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BankCard, PaymentForm } from "@/components/payment-form";
import { readChoices } from "@/lib/catalog";
import { readPayment } from "@/lib/payment";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "واریز هزینه ثبت‌نام",
  robots: { index: false, follow: false },
};

export default function PaymentPage() {
  return (
    <AppShell title="واریز هزینه" titleAs="h1" backHref="/dashboard" variant="form">
      <Suspense fallback={<div className="h-40" />}>
        <PaymentGate />
      </Suspense>
    </AppShell>
  );
}

async function PaymentGate() {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");
  if (!(await readChoices(session.phone)).length) redirect("/dashboard/products");

  const payment = await readPayment(session.phone);
  const status = payment?.status ?? "none";
  const receiptUrl = payment?.fileId ? `/api/receipts/${payment.fileId}` : "";

  return (
    <div className="pay-screen">
      <div className="pay-intro">
        <p className="pay-kicker">مرحله واریز</p>
        <h2 className="pay-title">واریز به کارت و ارسال فیش</h2>
        <p className="pay-lead">
          شماره کارت را کپی کنید، مبلغ ثبت‌نام را واریز کنید و عکس فیش را همین‌جا بفرستید.
        </p>
      </div>
      <BankCard number={site.payoutCard} holder={site.payoutHolder} bank={site.payoutBank} />
      <PaymentForm amount={site.registrationFee} status={status} receiptUrl={receiptUrl} />
    </div>
  );
}
