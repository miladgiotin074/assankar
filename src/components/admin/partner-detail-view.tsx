"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { faDigits } from "@/lib/format";

type Detail = {
  phone: string;
  phoneDisplay: string;
  name: string;
  profile: {
    firstName: string;
    lastName: string;
    card: string;
    address: string;
    birth: string;
  };
  choices: { productId: string; title: string; label: string; amountLabel: string; image: string }[];
  payment: {
    status: "pending" | "approved" | "rejected";
    amountLabel: string;
    phone: string;
  } | null;
  receiptUrl: string;
};

export function AdminPartnerDetailView({ phone }: { phone: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/partners/${phone}`, { credentials: "same-origin" })
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

  if (error) return <div className="admin-empty">{error}</div>;
  if (!detail) return <div className="admin-empty">در حال بارگذاری…</div>;

  const payStatus =
    detail.payment?.status === "approved"
      ? "تأیید شده"
      : detail.payment?.status === "rejected"
        ? "رد شده"
        : detail.payment?.status === "pending"
          ? "در انتظار تأیید"
          : "بدون فیش";

  return (
    <div className="admin-stack">
      <section className="admin-hero">
        <strong>{detail.name}</strong>
        <p dir="ltr">{detail.phoneDisplay}</p>
      </section>

      <div className="admin-meta">
        <div>
          <span>تاریخ تولد</span>
          <strong>{faDigits(detail.profile.birth)}</strong>
        </div>
        <div>
          <span>شماره کارت</span>
          <strong dir="ltr">{faDigits(detail.profile.card.replace(/(\d{4})(?=\d)/g, "$1 "))}</strong>
        </div>
        <div>
          <span>آدرس</span>
          <strong>{detail.profile.address}</strong>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>محصولات</h2>
        </div>
        {detail.choices.length ? (
          detail.choices.map((item) => (
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
          ))
        ) : (
          <p>هنوز محصولی انتخاب نشده است.</p>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>وضعیت واریز</h2>
          <p>
            {payStatus}
            {detail.payment ? ` · ${detail.payment.amountLabel}` : ""}
          </p>
        </div>
        {detail.payment?.status === "pending" ? (
          <Link href={`/admin/payments/${detail.payment.phone}`} className="admin-link-row">
            بررسی فیش
            <span aria-hidden="true">‹</span>
          </Link>
        ) : detail.receiptUrl ? (
          <a href={detail.receiptUrl} target="_blank" rel="noopener noreferrer" className="admin-link-row">
            مشاهده فیش
            <span aria-hidden="true">‹</span>
          </a>
        ) : null}
      </section>
    </div>
  );
}
