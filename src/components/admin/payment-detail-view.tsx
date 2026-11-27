"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmSheet, CopyButton, ReceiptZoom, buzz, relativeFa } from "@/components/admin/admin-kit";
import { useAdminLive } from "@/components/admin/admin-live";
import { faDigits } from "@/lib/format";
import type { PaymentKind } from "@/lib/payment";

type Detail = {
  payment: {
    phone: string;
    phoneDisplay: string;
    amountLabel: string;
    status: "pending" | "approved" | "rejected";
    kind: PaymentKind;
    kindLabel: string;
    name: string;
    at: string;
    reviewedAt: string;
  };
  profile: {
    firstName: string;
    lastName: string;
    sheba: string;
    shebaDisplay: string;
    address: string;
    birth: string;
  } | null;
  choices: { productId: string; title: string; label: string; amountLabel: string; image: string }[];
  receiptUrl: string;
};

const detailCache = new Map<string, Detail>();

export function AdminPaymentDetailView({
  phone,
  kind = "registration",
}: {
  phone: string;
  kind?: PaymentKind;
}) {
  const router = useRouter();
  const { refresh } = useAdminLive();
  const cacheKey = `${phone}:${kind}`;
  const [detail, setDetail] = useState<Detail | null>(detailCache.get(cacheKey) ?? null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [ask, setAsk] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/payments/${phone}?kind=${kind}`, { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "پیدا نشد");
        if (alive) {
          detailCache.set(cacheKey, data as Detail);
          setDetail(data as Detail);
        }
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [phone, kind, cacheKey]);

  const closeAsk = useCallback(() => setAsk(null), []);

  async function review(status: "approved" | "rejected") {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/payments/${phone}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status, kind }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ثبت نشد");
      buzz(status === "approved" ? "success" : "warning");
      detailCache.delete(cacheKey);
      refresh();
      router.replace("/admin/payments");
      router.refresh();
    } catch (err) {
      buzz("error");
      setError(err instanceof Error ? err.message : "خطا");
      setPending(false);
      setAsk(null);
    }
  }

  if (error && !detail) return <div className="admin-empty">{error}</div>;
  if (!detail) return <div className="admin-empty">در حال بارگذاری فیش…</div>;

  const when = detail.payment.status === "pending" ? detail.payment.at : detail.payment.reviewedAt || detail.payment.at;
  const kindLabel =
    detail.payment.kindLabel ||
    (kind === "insurance"
      ? "بیمه"
      : kind === "guarantee"
        ? "ضمانت کالا"
        : kind === "shipping"
          ? "باربری"
          : kind === "warehouse"
            ? "انبار"
            : "ثبت‌نام");

  return (
    <div className="admin-stack">
      {detail.receiptUrl ? (
        <ReceiptZoom src={detail.receiptUrl}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="admin-receipt" src={detail.receiptUrl} alt="فیش واریزی" />
        </ReceiptZoom>
      ) : (
        <div className="admin-empty">تصویر فیش موجود نیست.</div>
      )}

      <div className="admin-meta">
        <div>
          <span>نوع واریز</span>
          <strong>{kindLabel}</strong>
        </div>
        <div className="admin-meta-line">
          <div>
            <span>همکار</span>
            <strong>{detail.payment.name}</strong>
          </div>
          <Link href={`/admin/partners/detail?phone=${detail.payment.phone}`} className="admin-copy">
            پرونده
          </Link>
        </div>
        <div className="admin-meta-line">
          <div>
            <span>موبایل</span>
            <strong dir="ltr">{detail.payment.phoneDisplay}</strong>
          </div>
          <CopyButton value={detail.payment.phone} label="شماره کپی شد" />
        </div>
        <div>
          <span>مبلغ و زمان</span>
          <strong>
            {detail.payment.amountLabel}
            <br />
            {relativeFa(when)}
          </strong>
        </div>
        {detail.profile ? (
          <>
            <div className="admin-meta-line">
              <div>
                <span>شماره شبا</span>
                <strong dir="ltr">{faDigits(detail.profile.shebaDisplay || detail.profile.sheba || "—")}</strong>
              </div>
              {detail.profile.sheba ? <CopyButton value={detail.profile.sheba} label="شماره شبا کپی شد" /> : null}
            </div>
            <div>
              <span>آدرس</span>
              <strong>{detail.profile.address}</strong>
            </div>
          </>
        ) : null}
      </div>

      {detail.choices.length ? (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>محصولات انتخاب‌شده</h2>
          </div>
          {detail.choices.map((item) => (
            <div key={item.productId} className="admin-choice">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" />
              ) : (
                <span>کالا</span>
              )}
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.label} · {item.amountLabel}
                </small>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="admin-empty">محصولی انتخاب نشده است.</div>
      )}

      {error ? <div className="admin-empty">{error}</div> : null}

      {detail.payment.status === "pending" ? (
        <div className="admin-actions">
          <button type="button" className="is-bad" disabled={pending} onClick={() => setAsk("rejected")}>
            رد فیش
          </button>
          <button type="button" className="is-ok" disabled={pending} onClick={() => setAsk("approved")}>
            تأیید واریز
          </button>
        </div>
      ) : (
        <div
          className={
            detail.payment.status === "approved" ? "admin-status-banner is-ok" : "admin-status-banner is-bad"
          }
        >
          {detail.payment.status === "approved" ? `این فیش ${kindLabel} تأیید شده است.` : `این فیش ${kindLabel} رد شده است.`}
          {when ? ` · ${relativeFa(when)}` : ""}
        </div>
      )}

      {ask ? (
        <ConfirmSheet
          title={ask === "approved" ? `تأیید واریز ${kindLabel}` : `رد فیش ${kindLabel}`}
          text={
            ask === "approved"
              ? `واریز ${kindLabel} ${detail.payment.name} به مبلغ ${detail.payment.amountLabel} تأیید شود؟`
              : `فیش ${kindLabel} ${detail.payment.name} رد شود؟ همکار می‌تواند فیش تازه بفرستد.`
          }
          confirm={ask === "approved" ? "تأیید" : "رد کردن"}
          tone={ask === "approved" ? "ok" : "bad"}
          pending={pending}
          onCancel={closeAsk}
          onConfirm={() => void review(ask)}
        />
      ) : null}
    </div>
  );
}
