"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmSheet, CopyButton, ReceiptZoom, buzz, relativeFa } from "@/components/admin/admin-kit";
import { useAdminLive } from "@/components/admin/admin-live";
import { faDigits } from "@/lib/format";

type Detail = {
  payment: {
    phone: string;
    phoneDisplay: string;
    amountLabel: string;
    status: "pending" | "approved" | "rejected";
    name: string;
    at: string;
    reviewedAt: string;
  };
  profile: {
    firstName: string;
    lastName: string;
    card: string;
    address: string;
    birth: string;
  } | null;
  choices: { productId: string; title: string; label: string; amountLabel: string; image: string }[];
  receiptUrl: string;
};

function cardText(card: string) {
  return faDigits(card.replace(/(\d{4})(?=\d)/g, "$1 "));
}

const detailCache = new Map<string, Detail>();

export function AdminPaymentDetailView({ phone }: { phone: string }) {
  const router = useRouter();
  const { refresh } = useAdminLive();
  const [detail, setDetail] = useState<Detail | null>(detailCache.get(phone) ?? null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [ask, setAsk] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/payments/${phone}`, { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "پیدا نشد");
        if (alive) {
          detailCache.set(phone, data as Detail);
          setDetail(data as Detail);
        }
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [phone]);

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
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ثبت نشد");
      buzz(status === "approved" ? "success" : "warning");
      detailCache.delete(phone);
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
        <div className="admin-meta-line">
          <div>
            <span>همکار</span>
            <strong>{detail.payment.name}</strong>
          </div>
          <Link href={`/admin/partners/${detail.payment.phone}`} className="admin-copy">
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
                <span>شماره کارت</span>
                <strong dir="ltr">{cardText(detail.profile.card)}</strong>
              </div>
              <CopyButton value={detail.profile.card} label="شماره کارت کپی شد" />
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
          {detail.payment.status === "approved" ? "این فیش تأیید شده است." : "این فیش رد شده است."}
          {when ? ` · ${relativeFa(when)}` : ""}
        </div>
      )}

      {ask ? (
        <ConfirmSheet
          title={ask === "approved" ? "تأیید واریز" : "رد فیش"}
          text={
            ask === "approved"
              ? `واریز ${detail.payment.name} به مبلغ ${detail.payment.amountLabel} تأیید شود؟`
              : `فیش ${detail.payment.name} رد شود؟ همکار می‌تواند فیش تازه بفرستد.`
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
