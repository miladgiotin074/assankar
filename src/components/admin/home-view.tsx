"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAvatar, AdminSkeleton, relativeFa } from "@/components/admin/admin-kit";
import { useAdminLive } from "@/components/admin/admin-live";
import { useAdminTelegram } from "@/components/admin/telegram-provider";
import { faDigits } from "@/lib/format";
import type { AdminPaymentRow, AdminStats } from "@/lib/admin";

export function AdminHomeView() {
  const { admin } = useAdminTelegram();
  const { tick } = useAdminLive();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/stats", { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "خطا در دریافت آمار");
        if (alive) {
          setStats(data as AdminStats);
          setError("");
        }
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const queue = stats?.recent || [];

  return (
    <div className="admin-stack">
      <section className="admin-hero">
        <strong>سلام{admin?.name ? ` ${admin.name}` : ""}</strong>
        <p>
          {stats
            ? stats.pendingPayments
              ? `${faDigits(String(stats.pendingPayments))} فیش منتظر بررسی است.`
              : "فیشی در صف نیست."
            : "در حال خواندن وضعیت صف…"}
        </p>
      </section>

      {error ? <div className="admin-empty">{error}</div> : null}

      {stats ? (
        <section className="admin-stats" aria-label="آمار">
          <Link href="/admin/payments" className="admin-stat">
            <span>فیش در انتظار</span>
            <strong>{faDigits(String(stats.pendingPayments))}</strong>
          </Link>
          <Link href="/admin/payments?status=approved" className="admin-stat">
            <span>تأیید امروز</span>
            <strong>{faDigits(String(stats.approvedToday))}</strong>
          </Link>
          <Link href="/admin/partners" className="admin-stat">
            <span>همکاران</span>
            <strong>{faDigits(String(stats.partners))}</strong>
          </Link>
          <Link href="/admin/partners?stage=no-choices" className="admin-stat">
            <span>بدون محصول</span>
            <strong>{faDigits(String(stats.partnersWithoutChoices))}</strong>
          </Link>
        </section>
      ) : !error ? (
        <AdminSkeleton rows={2} />
      ) : null}

      <div className="admin-section-row">
        <p className="admin-section-title">صف بررسی</p>
        <Link href="/admin/payments">همه</Link>
      </div>

      {stats && !queue.length ? <div className="admin-empty">فیش جدیدی برای بررسی نیست.</div> : null}
      {!stats && !error ? <AdminSkeleton rows={3} /> : null}

      {queue.length ? (
        <div className="admin-list">
          {queue.map((item: AdminPaymentRow) => (
            <Link key={item.phone} href={`/admin/payments/${item.phone}`} className="admin-row is-person">
              <AdminAvatar name={item.name} />
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.amountLabel}
                  {item.choiceCount ? ` · ${faDigits(String(item.choiceCount))} محصول` : ""}
                  <br />
                  {relativeFa(item.at)}
                </small>
              </span>
              <span className="admin-chip is-wait">انتظار</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
