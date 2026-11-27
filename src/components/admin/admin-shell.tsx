"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAdminTelegram } from "@/components/admin/telegram-provider";

const tabs = [
  { href: "/admin", label: "خانه", match: (path: string) => path === "/admin" },
  { href: "/admin/payments", label: "فیش‌ها", match: (path: string) => path.startsWith("/admin/payments") },
  { href: "/admin/partners", label: "همکاران", match: (path: string) => path.startsWith("/admin/partners") },
] as const;

function titleFor(path: string) {
  if (path.startsWith("/admin/payments/")) return "جزئیات فیش";
  if (path.startsWith("/admin/payments")) return "فیش‌ها";
  if (path.startsWith("/admin/partners/")) return "پرونده همکار";
  if (path.startsWith("/admin/partners")) return "همکاران";
  return "پنل مدیریت";
}

export function AdminShell({ children }: { title?: string; children: ReactNode }) {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const { ready, admin, error, insideTelegram } = useAdminTelegram();

  if (!ready) {
    return (
      <div className="admin-boot">
        <div className="admin-boot-card">
          <strong>آسان‌کار ادمین</strong>
          <p>در حال آماده‌سازی مینی‌اپ…</p>
        </div>
      </div>
    );
  }

  if (!insideTelegram || error || !admin) {
    return (
      <div className="admin-boot">
        <div className="admin-boot-card">
          <strong>دسترسی محدود</strong>
          <p>{error || "این پنل فقط برای ادمین داخل تلگرام است."}</p>
          <small>BotFather → Mini App URL روی /admin و ADMIN_TELEGRAM_IDS را تنظیم کنید.</small>
        </div>
      </div>
    );
  }

  const hideTabs =
    /^\/admin\/payments\/[^/]+$/.test(pathname) || /^\/admin\/partners\/[^/]+$/.test(pathname);

  return (
    <div className="admin-app">
      <header className="admin-top">
        <div>
          <p className="admin-top-kicker">آسان‌کار</p>
          <h1>{title}</h1>
        </div>
        <p className="admin-top-user" dir="ltr">
          {admin.username ? `@${admin.username}` : admin.name}
        </p>
      </header>
      <main className={hideTabs ? "admin-main is-detail" : "admin-main"}>{children}</main>
      {hideTabs ? null : (
        <nav className="admin-tabs" aria-label="منوی ادمین">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href} className={tab.match(pathname) ? "is-active" : undefined}>
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
