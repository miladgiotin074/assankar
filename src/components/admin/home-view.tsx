"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAvatar, AdminSkeleton, relativeFa } from "@/components/admin/admin-kit";
import { useAdminLive } from "@/components/admin/admin-live";
import { useAdminTelegram } from "@/components/admin/telegram-provider";
import { faDigits } from "@/lib/format";
import type { AdminPaymentRow, AdminStats } from "@/lib/admin";

let statsCache: AdminStats | null = null;

function AdminCharts({ stats }: { stats: AdminStats }) {
  const series = stats.series || [];
  const max = Math.max(1, ...series.map((point) => Math.max(point.submitted, point.approved, point.rejected)));
  const total = stats.pendingPayments + stats.approvedTotal + stats.rejectedTotal;
  const approved = total ? (stats.approvedTotal / total) * 100 : 0;
  const waiting = total ? (stats.pendingPayments / total) * 100 : 0;

  return (
    <>
      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>هفت روز اخیر</h2>
          <p>آبی ثبت فیش، سبز تأیید، قرمز رد</p>
        </div>
        <div className="admin-bars" aria-label="نمودار هفت روز">
          {series.map((point, index) => (
            <div key={`${point.label}-${index}`} className="admin-bar-col">
              <div className="admin-bar">
                <i className="is-in" style={{ height: `${(point.submitted / max) * 100}%` }} />
                <i className="is-ok" style={{ height: `${(point.approved / max) * 100}%` }} />
                <i className="is-bad" style={{ height: `${(point.rejected / max) * 100}%` }} />
              </div>
              <small>{point.label}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>ترکیب همه فیش‌ها</h2>
          <p>{faDigits(String(total))} فیش</p>
        </div>
        <div className="admin-mix">
          <div
            className="admin-donut"
            style={{
              background: total
                ? `conic-gradient(#0b7a52 0 ${approved}%, #d4880c ${approved}% ${approved + waiting}%, #c0392b ${approved + waiting}% 100%)`
                : "#e7eef5",
            }}
          />
          <ul>
            <li>
              <i className="is-ok" />
              تأیید
              <b>{faDigits(String(stats.approvedTotal))}</b>
            </li>
            <li>
              <i className="is-wait" />
              انتظار
              <b>{faDigits(String(stats.pendingPayments))}</b>
            </li>
            <li>
              <i className="is-bad" />
              رد
              <b>{faDigits(String(stats.rejectedTotal))}</b>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

export function AdminHomeView() {
  const { admin } = useAdminTelegram();
  const { tick } = useAdminLive();
  const [stats, setStats] = useState<AdminStats | null>(statsCache);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/stats", { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "خطا در دریافت آمار");
        if (alive) {
          statsCache = data as AdminStats;
          setStats(statsCache);
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

      {stats ? <AdminCharts stats={stats} /> : null}

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
