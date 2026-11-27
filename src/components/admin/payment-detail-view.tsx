"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { faDigits } from "@/lib/format";
import { hapticFeedback } from "@tma.js/sdk-react";

type Detail = {
  payment: {
    phone: string;
    phoneDisplay: string;
    amountLabel: string;
    status: "pending" | "approved" | "rejected";
    name: string;
    at: string;
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

function buzz(kind: "success" | "error" | "warning") {
  try {
    if (hapticFeedback.notificationOccurred.isAvailable()) {
      hapticFeedback.notificationOccurred(kind);
    }
  } catch {
    /* optional */
  }
}

export function AdminPaymentDetailView({ phone }: { phone: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/payments/${phone}`, { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "پیدا نشد");
        if (alive) setDetail(data as Detail);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [phone]);

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
      router.replace("/admin/payments");
      router.refresh();
    } catch (err) {
      buzz("error");
      setError(err instanceof Error ? err.message : "خطا");
      setPending(false);
    }
  }

  if (error && !detail) return <div className="admin-empty">{error}</div>;
  if (!detail) return <div className="admin-empty">در حال بارگذاری فیش…</div>;

  return (
    <div className="admin-stack">
      {detail.receiptUrl ? (
        <div className="admin-receipt-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="admin-receipt" src={detail.receiptUrl} alt="فیش واریزی" />
        </div>
      ) : (
        <div className="admin-empty">تصویر فیش موجود نیست.</div>
      )}

      <div className="admin-meta">
        <div>
          <span>همکار</span>
          <strong>
            {detail.payment.name}
            <br />
            <span dir="ltr">{detail.payment.phoneDisplay}</span>
          </strong>
        </div>
        <div>
          <span>مبلغ</span>
          <strong>{detail.payment.amountLabel}</strong>
        </div>
        {detail.profile ? (
          <>
            <div>
              <span>شماره کارت</span>
              <strong dir="ltr">{faDigits(detail.profile.card.replace(/(\d{4})(?=\d)/g, "$1 "))}</strong>
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
      ) : null}

      {error ? <div className="admin-empty">{error}</div> : null}

      {detail.payment.status === "pending" ? (
        <div className="admin-actions">
          <button type="button" className="is-bad" disabled={pending} onClick={() => void review("rejected")}>
            رد فیش
          </button>
          <button type="button" className="is-ok" disabled={pending} onClick={() => void review("approved")}>
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
        </div>
      )}
    </div>
  );
}
