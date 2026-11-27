"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { faDigits } from "@/lib/format";
import type { AdminPaymentRow } from "@/lib/admin";
import type { PaymentStatus } from "@/lib/payment";
import { hapticFeedback } from "@tma.js/sdk-react";

const filters: { id: PaymentStatus; label: string }[] = [
  { id: "pending", label: "در انتظار" },
  { id: "approved", label: "تأیید" },
  { id: "rejected", label: "رد" },
];

function chipClass(status: PaymentStatus) {
  if (status === "approved") return "admin-chip is-ok";
  if (status === "rejected") return "admin-chip is-bad";
  return "admin-chip is-wait";
}

function chipLabel(status: PaymentStatus) {
  if (status === "approved") return "تأیید شده";
  if (status === "rejected") return "رد شده";
  return "در انتظار";
}

function timeLabel(iso: string) {
  if (!iso) return "—";
  return faDigits(
    new Intl.DateTimeFormat("fa-IR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso)),
  );
}

function tap() {
  try {
    if (hapticFeedback.selectionChanged.isAvailable()) hapticFeedback.selectionChanged();
  } catch {
    /* optional */
  }
}

export function AdminPaymentsView() {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AdminPaymentRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ status });
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch(`/api/admin/payments?${params}`, { credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "خطا در دریافت فیش‌ها");
      setItems((data.items || []) as AdminPaymentRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, q]);

  return (
    <div className="admin-stack">
      <div className="admin-filters">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={status === item.id ? "is-active" : undefined}
            onClick={() => {
              tap();
              setStatus(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <input
        className="admin-search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="جستجو با شماره موبایل"
        inputMode="tel"
      />

      {loading ? <div className="admin-empty">در حال بارگذاری…</div> : null}
      {error ? <div className="admin-empty">{error}</div> : null}
      {!loading && !error && !items.length ? <div className="admin-empty">موردی در این فیلتر نیست.</div> : null}

      {!loading && items.length ? (
        <div className="admin-list">
          {items.map((item) => (
            <Link key={item.phone} href={`/admin/payments/${item.phone}`} className="admin-row">
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.phoneDisplay} · {item.amountLabel}
                  <br />
                  {timeLabel(item.at)}
                </small>
              </span>
              <span className={chipClass(item.status)}>{chipLabel(item.status)}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
