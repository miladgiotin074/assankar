"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminAvatar, AdminSkeleton, buzz, relativeFa } from "@/components/admin/admin-kit";
import { useAdminLive } from "@/components/admin/admin-live";
import { faDigits } from "@/lib/format";
import type { AdminPaymentRow } from "@/lib/admin";
import type { PaymentStatus } from "@/lib/payment";

const listCache = new Map<string, AdminPaymentRow[]>();

const filters: { id: PaymentStatus | "all"; label: string }[] = [
  { id: "pending", label: "در انتظار" },
  { id: "approved", label: "تأیید" },
  { id: "rejected", label: "رد" },
  { id: "all", label: "همه" },
];

function chipClass(status: PaymentStatus) {
  if (status === "approved") return "admin-chip is-ok";
  if (status === "rejected") return "admin-chip is-bad";
  return "admin-chip is-wait";
}

function chipLabel(status: PaymentStatus) {
  if (status === "approved") return "تأیید";
  if (status === "rejected") return "رد";
  return "انتظار";
}

function isStatus(value: string): value is PaymentStatus | "all" {
  return value === "pending" || value === "approved" || value === "rejected" || value === "all";
}

export function AdminPaymentsView({ statusQuery = "" }: { statusQuery?: string }) {
  const { tick } = useAdminLive();
  const [status, setStatus] = useState<PaymentStatus | "all">(isStatus(statusQuery) ? statusQuery : "pending");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AdminPaymentRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStatus(statusQuery)) setStatus(statusQuery);
  }, [statusQuery]);

  const load = useCallback(async () => {
    const key = `${status}:${q.trim()}`;
    const hit = listCache.get(key);
    if (hit) {
      setItems(hit);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const query = new URLSearchParams({ status });
      if (q.trim()) query.set("q", q.trim());
      const response = await fetch(`/api/admin/payments?${query}`, { credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "خطا در دریافت فیش‌ها");
      const rows = (data.items || []) as AdminPaymentRow[];
      listCache.set(key, rows);
      setItems(rows);
    } catch (err) {
      if (!hit) {
        setError(err instanceof Error ? err.message : "خطا");
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, q, tick]);

  return (
    <div className="admin-stack">
      <div className="admin-filters is-scroll">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={status === item.id ? "is-active" : undefined}
            onClick={() => {
              buzz("light");
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
        placeholder="جستجو با نام یا موبایل"
        inputMode="search"
      />

      {loading ? <AdminSkeleton rows={5} /> : null}
      {error ? <div className="admin-empty">{error}</div> : null}
      {!loading && !error && !items.length ? <div className="admin-empty">موردی در این فیلتر نیست.</div> : null}

      {!loading && items.length ? (
        <div className="admin-list">
          {items.map((item) => (
            <Link key={item.phone} href={`/admin/payments/detail?phone=${item.phone}`} className="admin-row is-person">
              <AdminAvatar name={item.name} />
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.phoneDisplay} · {item.amountLabel}
                  {item.choiceCount ? ` · ${faDigits(String(item.choiceCount))} محصول` : ""}
                  <br />
                  {relativeFa(item.status === "pending" ? item.at : item.reviewedAt || item.at)}
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
