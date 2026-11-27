import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BankCard, PaymentForm } from "@/components/payment-form";
import { submitGuaranteeReceipt } from "@/app/dashboard/payment/actions";
import { readChoices } from "@/lib/catalog";
import { readPayment } from "@/lib/payment";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "واریز ضمانت کالا",
  robots: { index: false, follow: false },
};

export default function GuaranteePage() {
  return (
    <AppShell title="ضمانت کالا" titleAs="h1" backHref="/dashboard" variant="form">
      <Suspense fallback={<div className="h-40" />}>
        <GuaranteeGate />
      </Suspense>
    </AppShell>
  );
}

async function GuaranteeGate() {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");
  if (!(await readChoices(session.phone)).length) redirect("/dashboard/products");

  const insurance = await readPayment(session.phone, "insurance");
  if (insurance?.status !== "approved") redirect("/dashboard/insurance");

  const payment = await readPayment(session.phone, "guarantee");
  const status = payment?.status ?? "none";
  const receiptUrl = payment?.fileId ? `/api/receipts/${payment.fileId}` : "";

  return (
    <div className="pay-screen">
      <div className="pay-intro">
        <p className="pay-kicker">مرحله ضمانت</p>
        <h2 className="pay-title">واریز ضمانت کالا</h2>
        <p className="pay-lead">
          بعد از تأیید بیمه، مبلغ ضمانت کالا را به همان کارت واریز کنید و عکس فیش را بفرستید.
        </p>
      </div>
      <BankCard
        number={site.payoutCard}
        holder={site.payoutHolder}
        bank={site.payoutBank}
        purpose="فقط برای واریز ضمانت کالای آسان‌کار"
      />
      <PaymentForm
        amount={site.guaranteeFee}
        status={status}
        receiptUrl={receiptUrl}
        title="ضمانت کالا"
        nextHint="بعد از تأیید فیش ضمانت، مرحلهٔ بعد همکاری باز می‌شود."
        action={submitGuaranteeReceipt}
      />
    </div>
  );
}
