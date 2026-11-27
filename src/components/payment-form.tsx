"use client";

import { useActionState, useEffect, useState } from "react";
import { submitReceipt, type PaymentState } from "@/app/dashboard/payment/actions";
import { faDigits, toman } from "@/lib/format";
import { site } from "@/lib/site";

const empty: PaymentState = { error: "" };

export function PaymentForm({
  amount,
  status,
  receiptUrl,
}: {
  amount: number;
  status: "none" | "pending" | "approved" | "rejected";
  receiptUrl: string;
}) {
  const [state, action, pending] = useActionState(submitReceipt, empty);
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onFile(file: File | null) {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    if (!file) {
      setPreview("");
      setFileName("");
      return;
    }
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  if (status === "approved") {
    return (
      <section className="pay-status is-ok" aria-label="وضعیت واریز">
        <strong>واریز تأیید شد</strong>
        <p>پشتیبانی فیش شما را بررسی و تأیید کرده است. مرحلهٔ بعدی همکاری باز است.</p>
        {receiptUrl ? (
          <a className="pay-receipt-link" href={receiptUrl} target="_blank" rel="noopener noreferrer">
            مشاهدهٔ فیش ارسال‌شده
          </a>
        ) : null}
      </section>
    );
  }

  return (
    <form action={action} className="pay-form">
      <section className="pay-fee" aria-label="هزینه ثبت‌نام">
        <p>هزینهٔ ثبت‌نام</p>
        <strong>{toman(amount)}</strong>
        <small>مبلغ را دقیقاً به کارت بالا واریز کنید.</small>
      </section>

      <section className="pay-guide" aria-label="راهنمای فیش">
        <h2>ارسال عکس فیش</h2>
        <ol>
          <li>مبلغ {toman(amount)} را به کارت بالا واریز کنید.</li>
          <li>از رسید بانکی یا فیش واریزی عکس واضح بگیرید.</li>
          <li>عکس را همین‌جا بفرستید تا پشتیبانی واریز را تأیید کند.</li>
        </ol>
      </section>

      {status === "pending" ? (
        <section className="pay-status is-wait" aria-label="وضعیت واریز">
          <strong>فیش دریافت شد</strong>
          <p>عکس فیش روی سرور ذخیره شده و منتظر تأیید پشتیبانی است. در صورت نیاز می‌توانید عکس جدید بفرستید.</p>
          {receiptUrl ? (
            <a className="pay-receipt-link" href={receiptUrl} target="_blank" rel="noopener noreferrer">
              مشاهدهٔ فیش فعلی
            </a>
          ) : null}
        </section>
      ) : null}

      {status === "rejected" ? (
        <section className="pay-status is-bad" aria-label="وضعیت واریز">
          <strong>نیاز به ارسال دوباره</strong>
          <p>فیش قبلی تأیید نشد. لطفاً عکس واضح‌تری از واریز درست بفرستید.</p>
        </section>
      ) : null}

      <label className={preview || receiptUrl ? "pay-upload is-ready" : "pay-upload"}>
        <input
          type="file"
          name="receipt"
          accept="image/jpeg,image/png,image/webp"
          required={status === "none" || status === "rejected"}
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
        <span className="pay-upload-frame">
          {preview ? (
            <img src={preview} alt="" />
          ) : receiptUrl && status === "pending" ? (
            <img src={receiptUrl} alt="" />
          ) : (
            <span className="pay-upload-empty">
              <strong>انتخاب عکس فیش</strong>
              <small>JPG، PNG یا WEBP تا ۵ مگابایت</small>
            </span>
          )}
        </span>
        <span className="pay-upload-meta">{fileName ? faDigits(fileName) : "عکس را از گالری یا دوربین انتخاب کنید"}</span>
      </label>

      {state.error ? (
        <p className="pay-alert" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="btn w-full" type="submit" disabled={pending}>
        {pending ? "در حال ارسال" : status === "pending" ? "ارسال فیش جدید" : "ارسال فیش واریزی"}
      </button>

      <p className="pay-foot">پشتیبانی پس از بررسی فیش، واریز را در حساب شما تأیید می‌کند. تلگرام: @{site.telegramUser}</p>
    </form>
  );
}

export function BankCard({
  number,
  holder,
  bank,
}: {
  number: string;
  holder: string;
  bank: string;
}) {
  const digits = number.replace(/\D/g, "");
  const grouped = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  return (
    <div className="bank-stage" aria-label="کارت واریز">
      <div className="bank-card">
        <div className="bank-card-shine" aria-hidden="true" />
        <div className="bank-card-chip" aria-hidden="true" />
        <p className="bank-card-bank">{bank}</p>
        <p className="bank-card-number" dir="ltr">
          {faDigits(grouped)}
        </p>
        <div className="bank-card-foot">
          <div>
            <span>صاحب حساب</span>
            <strong>{holder}</strong>
          </div>
          <div>
            <span>برند</span>
            <strong>{site.latin}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
