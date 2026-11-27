"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { faDigits } from "@/lib/format";
import type { AdminStats } from "@/lib/admin";
import { useAdminTelegram } from "@/components/admin/telegram-provider";

export function AdminHomeView() {
  const { admin } = useAdminTelegram();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/stats", { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "خطا در دریافت آمار");
        if (alive) setStats(data as AdminStats);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="admin-stack">
      <section className="admin-panel">
        <h2>سلام{admin?.name ? ` ${admin.name}` : ""}</h2>
        <p>صف فیش‌های در انتظار را بررسی کنید و وضعیت همکاران را ببینید.</p>
      </section>

      {error ? <div className="admin-empty">{error}</div> : null}

      {stats ? (
        <section className="admin-stats" aria-label="آمار">
          <div className="admin-stat">
            <span>فیش در انتظار</span>
            <strong>{faDigits(String(stats.pendingPayments))}</strong>
          </div>
          <div className="admin-stat">
            <span>تأیید امروز</span>
            <strong>{faDigits(String(stats.approvedToday))}</strong>
          </div>
          <div className="admin-stat">
            <span>همکاران</span>
            <strong>{faDigits(String(stats.partners))}</strong>
          </div>
          <div className="admin-stat">
            <span>بدون انتخاب محصول</span>
            <strong>{faDigits(String(stats.partnersWithoutChoices))}</strong>
          </div>
        </section>
      ) : !error ? (
        <div className="admin-empty">در حال بارگذاری آمار…</div>
      ) : null}

      <Link href="/admin/payments" className="admin-row">
        <span>
          <strong>صف فیش‌ها</strong>
          <small>تأیید یا رد واریز ثبت‌نام</small>
        </span>
        <span className="admin-chip is-wait">اولویت</span>
      </Link>
      <Link href="/admin/partners" className="admin-row">
        <span>
          <strong>همکاران</strong>
          <small>پروفایل، محصول و وضعیت واریز</small>
        </span>
        <span className="admin-chip is-muted">فهرست</span>
      </Link>
    </div>
  );
}
