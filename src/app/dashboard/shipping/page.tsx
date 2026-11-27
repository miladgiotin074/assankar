import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BankCard, PaymentForm } from "@/components/payment-form";
import { submitShippingReceipt } from "@/app/dashboard/payment/actions";
import { readChoices } from "@/lib/catalog";
import { readPayment } from "@/lib/payment";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "واریز هزینه باربری",
  robots: { index: false, follow: false },
};

export default function ShippingPage() {
  return (
    <AppShell title="هزینه باربری" titleAs="h1" backHref="/dashboard" variant="form">
      <Suspense fallback={<div className="h-40" />}>
        <ShippingGate />
      </Suspense>
    </AppShell>
  );
}

async function ShippingGate() {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");
  if (!(await readChoices(session.phone)).length) redirect("/dashboard/products");

  const guarantee = await readPayment(session.phone, "guarantee");
  if (guarantee?.status !== "approved") redirect("/dashboard/guarantee");

  const payment = await readPayment(session.phone, "shipping");
  const status = payment?.status ?? "none";
  const receiptUrl = payment?.fileId ? `/api/receipts/${payment.fileId}` : "";

  return (
    <div className="pay-screen">
      <div className="pay-intro">
        <p className="pay-kicker">مرحله باربری</p>
        <h2 className="pay-title">واریز هزینهٔ باربری</h2>
        <p className="pay-lead">
          بعد از تأیید ضمانت کالا، هزینهٔ باربری را به همان کارت واریز کنید و عکس فیش را بفرستید.
        </p>
      </div>
      <BankCard
        number={site.payoutCard}
        holder={site.payoutHolder}
        bank={site.payoutBank}
        purpose="فقط برای واریز هزینهٔ باربری آسان‌کار"
      />
      <PaymentForm
        amount={site.shippingFee}
        status={status}
        receiptUrl={receiptUrl}
        title="هزینه باربری"
        nextHint="بعد از تأیید فیش باربری، مرحلهٔ بعد همکاری باز می‌شود."
        action={submitShippingReceipt}
      />
    </div>
  );
}
