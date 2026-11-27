"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAvatar, CopyButton, relativeFa } from "@/components/admin/admin-kit";
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
    at: string;
    reviewedAt: string;
  } | null;
  receiptUrl: string;
};

function cardText(card: string) {
  return faDigits(card.replace(/(\d{4})(?=\d)/g, "$1 "));
}

const detailCache = new Map<string, Detail>();

export function AdminPartnerDetailView({ phone }: { phone: string }) {
  const [detail, setDetail] = useState<Detail | null>(detailCache.get(phone) ?? null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/partners/${phone}`, { credentials: "same-origin" })
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
  const payWhen = detail.payment?.reviewedAt || detail.payment?.at || "";

  return (
    <div className="admin-stack">
      <section className="admin-hero is-person">
        <AdminAvatar name={detail.name} />
        <div>
          <strong>{detail.name}</strong>
          <p dir="ltr">{detail.phoneDisplay}</p>
        </div>
      </section>

      <div className="admin-meta">
        <div className="admin-meta-line">
          <div>
            <span>موبایل</span>
            <strong dir="ltr">{detail.phoneDisplay}</strong>
          </div>
          <CopyButton value={detail.phone} label="شماره کپی شد" />
        </div>
        <div>
          <span>تاریخ تولد</span>
          <strong>{faDigits(detail.profile.birth)}</strong>
        </div>
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
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>محصولات</h2>
          <p>{detail.choices.length ? `${faDigits(String(detail.choices.length))} مورد` : "هنوز انتخاب نشده"}</p>
        </div>
        {detail.choices.length
          ? detail.choices.map((item) => (
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
          : null}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>وضعیت واریز</h2>
          <p>
            {payStatus}
            {detail.payment ? ` · ${detail.payment.amountLabel}` : ""}
            {payWhen ? ` · ${relativeFa(payWhen)}` : ""}
          </p>
        </div>
        {detail.receiptUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="admin-receipt is-inline" src={detail.receiptUrl} alt="فیش واریزی" />
        ) : null}
        {detail.payment ? (
          <Link href={`/admin/payments/${detail.payment.phone}`} className="admin-link-row">
            {detail.payment.status === "pending" ? "بررسی و تصمیم" : "جزئیات فیش"}
            <span aria-hidden="true">‹</span>
          </Link>
        ) : null}
      </section>
    </div>
  );
}
