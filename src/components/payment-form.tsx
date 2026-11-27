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
        <span className="pay-status-mark" aria-hidden="true" />
        <div>
          <strong>واریز تأیید شد</strong>
          <p>پشتیبانی فیش شما را بررسی و تأیید کرده است. مرحلهٔ بعدی همکاری باز است.</p>
          {receiptUrl ? (
            <a className="pay-receipt-link" href={receiptUrl} target="_blank" rel="noopener noreferrer">
              مشاهدهٔ فیش ارسال‌شده
            </a>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <form action={action} className="pay-form">
      <section className="pay-fee" aria-label="هزینه ثبت‌نام">
        <div>
          <p>هزینهٔ ثبت‌نام</p>
          <strong>{toman(amount)}</strong>
        </div>
        <small>مبلغ را دقیقاً به همین کارت واریز کنید.</small>
      </section>

      <section className="pay-guide" aria-label="راهنمای فیش">
        <div className="pay-guide-head">
          <h2>چطور واریز کنم؟</h2>
          <span>۳ قدم</span>
        </div>
        <ol>
          <li>
            <strong>واریز مبلغ</strong>
            <span>مبلغ {toman(amount)} را به کارت بالا واریز کنید.</span>
          </li>
          <li>
            <strong>عکس از فیش</strong>
            <span>از رسید بانکی یا فیش واریزی عکس واضح بگیرید.</span>
          </li>
          <li>
            <strong>ارسال برای تأیید</strong>
            <span>عکس را بفرستید تا پشتیبانی واریز را تأیید کند.</span>
          </li>
        </ol>
      </section>

      {status === "pending" ? (
        <section className="pay-status is-wait" aria-label="وضعیت واریز">
          <span className="pay-status-mark" aria-hidden="true" />
          <div>
            <strong>فیش دریافت شد</strong>
            <p>عکس فیش روی سرور ذخیره شده و منتظر تأیید پشتیبانی است. در صورت نیاز عکس جدید بفرستید.</p>
            {receiptUrl ? (
              <a className="pay-receipt-link" href={receiptUrl} target="_blank" rel="noopener noreferrer">
                مشاهدهٔ فیش فعلی
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {status === "rejected" ? (
        <section className="pay-status is-bad" aria-label="وضعیت واریز">
          <span className="pay-status-mark" aria-hidden="true" />
          <div>
            <strong>نیاز به ارسال دوباره</strong>
            <p>فیش قبلی تأیید نشد. لطفاً عکس واضح‌تری از واریز درست بفرستید.</p>
          </div>
        </section>
      ) : null}

      <label className={preview || (receiptUrl && status === "pending") ? "pay-upload is-ready" : "pay-upload"}>
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
              <em aria-hidden="true" />
              <strong>انتخاب عکس فیش</strong>
              <small>JPG، PNG یا WEBP تا ۵ مگابایت</small>
            </span>
          )}
        </span>
        <span className="pay-upload-meta">
          {fileName ? faDigits(fileName) : preview || status === "pending" ? "برای تعویض، عکس جدید انتخاب کنید" : "عکس را از گالری یا دوربین انتخاب کنید"}
        </span>
      </label>

      {state.error ? (
        <p className="pay-alert" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="btn w-full" type="submit" disabled={pending}>
        {pending ? "در حال ارسال" : status === "pending" ? "ارسال فیش جدید" : "ارسال فیش واریزی"}
      </button>

      <p className="pay-foot">بعد از بررسی فیش، واریز در حساب شما تأیید می‌شود. پشتیبانی: @{site.telegramUser}</p>
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
  const [spin, setSpin] = useState(true);
  const [copied, setCopied] = useState(false);
  const digits = number.replace(/\D/g, "");
  const grouped = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  useEffect(() => {
    if (!spin) return;
    const timer = window.setTimeout(() => setSpin(false), 4200);
    return () => window.clearTimeout(timer);
  }, [spin]);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(digits);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function replay() {
    setSpin(false);
    window.setTimeout(() => setSpin(true), 30);
  }

  return (
    <div className="bank-block">
      <div className="bank-stage" aria-label="کارت واریز">
        <button
          type="button"
          className={spin ? "bank-flip is-spin" : "bank-flip"}
          onClick={replay}
          aria-label="چرخش دوباره کارت"
        >
          <span className="bank-face bank-face-front">
            <span className="bank-card-shine" aria-hidden="true" />
            <span className="bank-card-chip" aria-hidden="true" />
            <span className="bank-card-bank">{bank}</span>
            <span className="bank-card-number" dir="ltr">
              {faDigits(grouped)}
            </span>
            <span className="bank-card-foot">
              <span>
                <span>صاحب حساب</span>
                <strong>{holder}</strong>
              </span>
              <span>
                <span>برند</span>
                <strong>{site.latin}</strong>
              </span>
            </span>
          </span>
          <span className="bank-face bank-face-back" aria-hidden="true">
            <span className="bank-stripe" />
            <span className="bank-back-panel">
              <span className="bank-sign" />
              <span className="bank-cvv">
                <em>CVV</em>
                <b>•••</b>
              </span>
            </span>
            <span className="bank-back-note">
              <strong>{bank}</strong>
              <small>فقط برای واریز هزینهٔ ثبت‌نام آسان‌کار</small>
            </span>
          </span>
        </button>
      </div>

      <div className="bank-actions">
        <button type="button" className="bank-copy" onClick={copyNumber}>
          {copied ? "کپی شد" : "کپی شماره کارت"}
        </button>
        <button type="button" className="bank-replay" onClick={replay}>
          چرخش کارت
        </button>
      </div>
    </div>
  );
}
