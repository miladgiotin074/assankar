"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminAvatar, AdminSkeleton, buzz } from "@/components/admin/admin-kit";
import { useAdminLive } from "@/components/admin/admin-live";
import { faDigits } from "@/lib/format";
import type { AdminPartnerRow, PartnerFilter } from "@/lib/admin";

const listCache = new Map<string, AdminPartnerRow[]>();

const filters: { id: PartnerFilter; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "انتظار" },
  { id: "approved", label: "تأیید" },
  { id: "rejected", label: "رد" },
  { id: "none", label: "بدون فیش" },
  { id: "no-choices", label: "بدون محصول" },
];

function chipClass(item: AdminPartnerRow) {
  if (!item.hasChoices && item.paymentStatus === "none") return "admin-chip is-muted";
  if (item.paymentStatus === "approved") return "admin-chip is-ok";
  if (item.paymentStatus === "rejected") return "admin-chip is-bad";
  if (item.paymentStatus === "pending") return "admin-chip is-wait";
  return "admin-chip is-muted";
}

function chipLabel(item: AdminPartnerRow) {
  if (item.paymentStatus === "approved") return "تأیید";
  if (item.paymentStatus === "rejected") return "رد";
  if (item.paymentStatus === "pending") return "انتظار";
  if (!item.hasChoices) return "بدون محصول";
  return "بدون فیش";
}

function isStage(value: string): value is PartnerFilter {
  return filters.some((item) => item.id === value);
}

export function AdminPartnersView({ stageQuery = "" }: { stageQuery?: string }) {
  const { tick } = useAdminLive();
  const [stage, setStage] = useState<PartnerFilter>(isStage(stageQuery) ? stageQuery : "all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AdminPartnerRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStage(stageQuery)) setStage(stageQuery);
  }, [stageQuery]);

  const load = useCallback(async () => {
    const key = `${stage}:${q.trim()}`;
    const hit = listCache.get(key);
    if (hit) {
      setItems(hit);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      const query = new URLSearchParams({ stage });
      if (q.trim()) query.set("q", q.trim());
      const response = await fetch(`/api/admin/partners?${query}`, { credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "خطا در دریافت همکاران");
      const rows = (data.items || []) as AdminPartnerRow[];
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
  }, [q, stage]);

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
            className={stage === item.id ? "is-active" : undefined}
            onClick={() => {
              buzz("light");
              setStage(item.id);
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
      {!loading && !error && !items.length ? <div className="admin-empty">همکاری در این فیلتر نیست.</div> : null}

      {!loading && items.length ? (
        <div className="admin-list">
          {items.map((item) => (
            <Link key={item.phone} href={`/admin/partners/${item.phone}`} className="admin-row is-person">
              <AdminAvatar name={item.name} />
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.phoneDisplay}
                  <br />
                  {item.choiceCount
                    ? `${faDigits(String(item.choiceCount))} محصول${item.choicesAmountLabel ? ` · ${item.choicesAmountLabel}` : ""}`
                    : item.stage}
                </small>
              </span>
              <span className={chipClass(item)}>{chipLabel(item)}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
