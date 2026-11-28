"use client";

import { useActionState, useEffect, useState } from "react";
import { submitReceipt, type PaymentState } from "@/app/dashboard/payment/actions";
import { faDigits, toman } from "@/lib/format";
import { site } from "@/lib/site";

const empty: PaymentState = { error: "" };

type PayAction = (prev: PaymentState, formData: FormData) => Promise<PaymentState>;

export function PaymentForm({
  amount,
  status,
  receiptUrl,
  title = "هزینه ثبت‌نام",
  nextHint = "بعد از بررسی فیش، واریز در حساب شما تأیید می‌شود.",
  telegramUser = site.telegramUser,
  action: submitAction = submitReceipt,
  options,
  optionsTitle = "مدت",
  initialOptionId = "",
  lockedOptionLabel = "",
}: {
  amount: number;
  status: "none" | "pending" | "approved" | "rejected";
  receiptUrl: string;
  title?: string;
  nextHint?: string;
  telegramUser?: string;
  action?: PayAction;
  options?: { id: string; label: string; amount: number }[];
  optionsTitle?: string;
  initialOptionId?: string;
  lockedOptionLabel?: string;
}) {
  const [state, action, pending] = useActionState(submitAction, empty);
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const hasOptions = Boolean(options?.length);
  const [optionId, setOptionId] = useState(
    () => initialOptionId || options?.[0]?.id || "",
  );
  const selected = hasOptions
    ? options?.find((row) => row.id === optionId) || options?.[0]
    : undefined;
  const optionLocked = status === "pending" || status === "approved";
  const payAmount = hasOptions && !optionLocked ? (selected?.amount ?? amount) : amount;

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
          <p>{nextHint}</p>
          {lockedOptionLabel ? <p className="pay-option-locked">گزینه: {lockedOptionLabel}</p> : null}
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
      {hasOptions ? (
        <section className="pay-options" aria-label={`گزینه ${optionsTitle}`}>
          <div className="pay-options-head">
            <h2>{optionsTitle}</h2>
            <span>یکی را انتخاب کنید</span>
          </div>
          <div className="pay-options-list" role="radiogroup" aria-label={optionsTitle}>
            {options!.map((row) => {
              const on = row.id === (selected?.id || "");
              return (
                <button
                  key={row.id}
                  type="button"
                  className={on ? "is-on" : undefined}
                  role="radio"
                  aria-checked={on}
                  disabled={optionLocked}
                  onClick={() => setOptionId(row.id)}
                >
                  <span className="pay-option-mark" aria-hidden="true" />
                  <span className="pay-option-copy">
                    <span>{row.label}</span>
                    <strong>{toman(row.amount)}</strong>
                  </span>
                </button>
              );
            })}
          </div>
          {optionLocked && lockedOptionLabel ? (
            <p className="pay-fee-note">گزینهٔ ارسال‌شده: {lockedOptionLabel}</p>
          ) : null}
          <input type="hidden" name="optionId" value={selected?.id || ""} />
        </section>
      ) : null}

      <section className="pay-fee" aria-label={title}>
        <div className="pay-fee-main">
          <p>{selected ? `${title} · ${selected.label}` : title}</p>
          <strong>{toman(payAmount)}</strong>
        </div>
        <p className="pay-fee-note">همین مبلغ را دقیقاً به شماره کارت بالا واریز کنید.</p>
      </section>

      <section className="pay-guide" aria-label="راهنمای فیش">
        <div className="pay-guide-head">
          <h2>مراحل واریز</h2>
          <span>۳ قدم</span>
        </div>
        <ol>
          <li>
            <strong>واریز به کارت</strong>
            <span>مبلغ {toman(payAmount)} را به شمارهٔ کپی‌شده واریز کنید.</span>
          </li>
          <li>
            <strong>عکس از فیش</strong>
            <span>از رسید بانکی عکس واضح و خوانا بگیرید.</span>
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
            <p>عکس فیش ذخیره شده و منتظر تأیید پشتیبانی است. در صورت نیاز عکس جدید بفرستید.</p>
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
          {fileName
            ? faDigits(fileName)
            : preview || status === "pending"
              ? "برای تعویض، عکس جدید انتخاب کنید"
              : "عکس را از گالری یا دوربین انتخاب کنید"}
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

      <p className="pay-foot">
        {nextHint} پشتیبانی: @{telegramUser}
      </p>
    </form>
  );
}

export function BankCard({
  number,
  holder,
  bank,
  purpose = "فقط برای واریز هزینهٔ ثبت‌نام آسان‌کار",
}: {
  number: string;
  holder: string;
  bank: string;
  purpose?: string;
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

  function flipCard() {
    if (spin) return;
    setSpin(true);
  }

  return (
    <div className="bank-block">
      <div className="bank-stage" aria-label="کارت واریز">
        <button
          type="button"
          className={spin ? "bank-flip is-spin" : "bank-flip"}
          onClick={flipCard}
          aria-label="برای چرخش کارت، روی کارت بزنید"
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
              <small>{purpose}</small>
            </span>
          </span>
        </button>
      </div>

      <p className="bank-hint">برای دیدن پشت کارت، روی کارت بزنید</p>

      <div className="bank-number-panel">
        <div className="bank-number-copy">
          <span>شماره کارت</span>
          <strong dir="ltr">{faDigits(grouped)}</strong>
          <small>
            {bank} · {holder}
          </small>
        </div>
        <button type="button" className="bank-copy" onClick={copyNumber}>
          {copied ? "کپی شد" : "کپی شماره"}
        </button>
      </div>
    </div>
  );
}
