"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAdminTelegram } from "@/components/admin/telegram-provider";
import { useTelegramBack } from "@/components/admin/use-telegram-back";

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.4 3.8 10.2c-.3.25-.3.7 0 .95l.7.55c.25.2.6.15.8-.1L12 5.9l6.7 5.7c.2.25.55.3.8.1l.7-.55c.3-.25.3-.7 0-.95L12 3.4Zm0 4.1-6 5.1V20c0 .55.45 1 1 1h3.2v-5.2h3.6V21H17c.55 0 1-.45 1-1v-7.4l-6-5.1Z"
      />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 2.5h10c.8 0 1.5.7 1.5 1.5v17.2c0 .5-.55.8-.95.55L15.5 20l-1.9 1.35c-.3.2-.7.2-1 0L10.7 20l-2.05 1.45c-.4.25-.95-.05-.95-.55V4c0-.8.7-1.5 1.5-1.5Zm1.5 4.2v1.6h7V6.7h-7Zm0 3.5v1.6h7v-1.6h-7Zm0 3.5v1.6h5V13.7h-5Z"
      />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.2 11.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Zm7.6 0a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2ZM3.5 18.8c0-2.5 2.4-4.5 4.7-4.5h.5c.7.3 1.5.5 2.3.5.8 0 1.6-.2 2.3-.5h.5c.5 0 1 .1 1.4.3A4.7 4.7 0 0 0 13.5 18v1.3H3.5v-1.5Zm10.7-1.5c0-1 .3-1.9.9-2.6.5.1 1 .2 1.6.2h.5c2.3 0 4.3 1.8 4.3 4.2v1.5h-7.3v-3.3Z"
      />
    </svg>
  );
}

const tabs = [
  { href: "/admin", label: "خانه", icon: <IconHome />, match: (path: string) => path === "/admin" },
  {
    href: "/admin/payments",
    label: "فیش‌ها",
    icon: <IconReceipt />,
    match: (path: string) => path.startsWith("/admin/payments"),
  },
  {
    href: "/admin/partners",
    label: "همکاران",
    icon: <IconPeople />,
    match: (path: string) => path.startsWith("/admin/partners"),
  },
];

function titleFor(path: string) {
  if (path.startsWith("/admin/payments/")) return "بررسی فیش";
  if (path.startsWith("/admin/payments")) return "فیش‌ها";
  if (path.startsWith("/admin/partners/")) return "پرونده همکار";
  if (path.startsWith("/admin/partners")) return "همکاران";
  return "مدیریت";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const { ready, admin, error, insideTelegram } = useAdminTelegram();
  useTelegramBack();

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
          <small>شناسه تلگرام خود را در ADMIN_TELEGRAM_IDS قرار دهید.</small>
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
              <em aria-hidden="true">{tab.icon}</em>
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
