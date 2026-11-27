"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminLiveProvider, useAdminLive } from "@/components/admin/admin-live";
import { AdminHomeView } from "@/components/admin/home-view";
import { AdminPartnerDetailView } from "@/components/admin/partner-detail-view";
import { AdminPartnersView } from "@/components/admin/partners-view";
import { AdminPaymentDetailView } from "@/components/admin/payment-detail-view";
import { AdminPaymentsView } from "@/components/admin/payments-view";
import { useAdminTelegram } from "@/components/admin/telegram-provider";
import { useTelegramBack } from "@/components/admin/use-telegram-back";
import { faDigits } from "@/lib/format";

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
  if (path === "/admin/payments/detail") return "بررسی فیش";
  if (path.startsWith("/admin/payments")) return "فیش‌ها";
  if (path === "/admin/partners/detail") return "پرونده همکار";
  if (path.startsWith("/admin/partners")) return "همکاران";
  return "مدیریت";
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5.2V3.1c0-.4.5-.6.8-.3l2.7 2.6c.2.2.2.5 0 .7l-2.7 2.6c-.3.3-.8.1-.8-.3V6.4a5.6 5.6 0 1 0 5.6 5.6h1.6A7.2 7.2 0 1 1 12 5.2Z"
      />
    </svg>
  );
}

function useClientSearch() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);
  return search;
}

function AdminFrame() {
  const pathname = usePathname();
  const search = useClientSearch();
  const title = titleFor(pathname);
  const { admin } = useAdminTelegram();
  const { pending, refresh } = useAdminLive();
  useTelegramBack();
  const query = new URLSearchParams(search);
  const paymentPhone = pathname === "/admin/payments/detail" ? query.get("phone") || "" : "";
  const partnerPhone = pathname === "/admin/partners/detail" ? query.get("phone") || "" : "";
  const detail = Boolean(paymentPhone || partnerPhone);
  const tab = pathname.startsWith("/admin/partners")
    ? "partners"
    : pathname.startsWith("/admin/payments")
      ? "payments"
      : "home";
  const badge = pending > 99 ? "۹۹+" : faDigits(String(pending));

  return (
    <div className="admin-app">
      <header className="admin-top">
        <div>
          <p className="admin-top-kicker">آسان‌کار</p>
          <h1>{title}</h1>
        </div>
        <div className="admin-top-side">
          <p className="admin-top-user" dir="ltr">
            {admin?.username ? `@${admin.username}` : admin?.name}
          </p>
          <button type="button" className="admin-icon-btn" aria-label="تازه‌سازی" onClick={refresh}>
            <RefreshIcon />
          </button>
        </div>
      </header>
      <div className="admin-stage">
        <section className="admin-pane" hidden={tab !== "home" || detail}>
          <AdminHomeView />
        </section>
        <section className="admin-pane" hidden={tab !== "payments" || detail}>
          <AdminPaymentsView statusQuery={query.get("status") || ""} />
        </section>
        <section className="admin-pane" hidden={tab !== "partners" || detail}>
          <AdminPartnersView stageQuery={query.get("stage") || ""} />
        </section>
        {paymentPhone ? (
          <section className="admin-layer" key={paymentPhone}>
            <AdminPaymentDetailView phone={paymentPhone} />
          </section>
        ) : null}
        {partnerPhone ? (
          <section className="admin-layer" key={partnerPhone}>
            <AdminPartnerDetailView phone={partnerPhone} />
          </section>
        ) : null}
      </div>
      {detail ? null : (
        <nav className="admin-tabs" aria-label="منوی ادمین">
          {tabs.map((tabItem) => (
            <Link key={tabItem.href} href={tabItem.href} className={tabItem.match(pathname) ? "is-active" : undefined}>
              <em aria-hidden="true">{tabItem.icon}</em>
              {tabItem.label}
              {tabItem.href === "/admin/payments" && pending > 0 ? <b className="admin-badge">{badge}</b> : null}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
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
          <small>شناسه تلگرام خود را در ADMIN_TELEGRAM_IDS قرار دهید.</small>
        </div>
      </div>
    );
  }

  return (
    <AdminLiveProvider>
      <AdminFrame />
      {children}
    </AdminLiveProvider>
  );
}
