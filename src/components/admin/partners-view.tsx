"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminPartnerRow } from "@/lib/admin";
import type { PaymentStatus } from "@/lib/payment";

function chipClass(status: PaymentStatus | "none") {
  if (status === "approved") return "admin-chip is-ok";
  if (status === "rejected") return "admin-chip is-bad";
  if (status === "pending") return "admin-chip is-wait";
  return "admin-chip is-muted";
}

function chipLabel(status: PaymentStatus | "none") {
  if (status === "approved") return "تأیید";
  if (status === "rejected") return "رد";
  if (status === "pending") return "انتظار";
  return "بدون فیش";
}

export function AdminPartnersView() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AdminPartnerRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch(`/api/admin/partners?${params}`, { credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "خطا در دریافت همکاران");
      setItems((data.items || []) as AdminPartnerRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, q]);

  return (
    <div className="admin-stack">
      <input
        className="admin-search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="جستجو با نام یا موبایل"
      />

      {loading ? <div className="admin-empty">در حال بارگذاری…</div> : null}
      {error ? <div className="admin-empty">{error}</div> : null}
      {!loading && !error && !items.length ? <div className="admin-empty">همکاری پیدا نشد.</div> : null}

      {!loading && items.length ? (
        <div className="admin-list">
          {items.map((item) => (
            <Link key={item.phone} href={`/admin/partners/${item.phone}`} className="admin-row">
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.phoneDisplay}
                  <br />
                  {item.stage}
                </small>
              </span>
              <span className={chipClass(item.paymentStatus)}>{chipLabel(item.paymentStatus)}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
