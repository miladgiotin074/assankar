import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BankCard, PaymentForm } from "@/components/payment-form";
import { submitWarehouseReceipt } from "@/app/dashboard/payment/actions";
import { readChoices } from "@/lib/catalog";
import { readPayment } from "@/lib/payment";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "واریز هزینه انبار",
  robots: { index: false, follow: false },
};

export default function WarehousePage() {
  return (
    <AppShell title="هزینه انبار" titleAs="h1" backHref="/dashboard" variant="form">
      <Suspense fallback={<div className="h-40" />}>
        <WarehouseGate />
      </Suspense>
    </AppShell>
  );
}

async function WarehouseGate() {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");
  if (!(await readChoices(session.phone)).length) redirect("/dashboard/products");

  const guarantee = await readPayment(session.phone, "guarantee");
  if (guarantee?.status !== "approved") redirect("/dashboard/guarantee");

  const payment = await readPayment(session.phone, "warehouse");
  const status = payment?.status ?? "none";
  const receiptUrl = payment?.fileId ? `/api/receipts/${payment.fileId}` : "";
  const settings = await getSettings();

  return (
    <div className="pay-screen">
      <div className="pay-intro">
        <p className="pay-kicker">مرحله انبار</p>
        <h2 className="pay-title">واریز هزینهٔ انبار</h2>
        <p className="pay-lead">
          بعد از تأیید ضمانت کالا، هزینهٔ انبار را به همان کارت واریز کنید و عکس فیش را بفرستید.
        </p>
      </div>
      <BankCard
        number={settings.payoutCard}
        holder={settings.payoutHolder}
        bank={settings.payoutBank}
        purpose="فقط برای واریز هزینهٔ انبار آسان‌کار"
      />
      <PaymentForm
        amount={settings.warehouseFee}
        status={status}
        receiptUrl={receiptUrl}
        title="هزینه انبار"
        nextHint="بعد از تأیید فیش انبار، مرحلهٔ هزینهٔ باربری باز می‌شود."
        telegramUser={settings.telegramUser}
        action={submitWarehouseReceipt}
      />
    </div>
  );
}
