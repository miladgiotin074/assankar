import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTelegramProvider } from "@/components/admin/telegram-provider";
import "./admin.css";

export const metadata: Metadata = {
  title: "پنل مدیریت آسان‌کار",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c4d86",
};

function AdminBootFallback() {
  return (
    <div className="admin-boot">
      <div className="admin-boot-card">
        <strong>آسان‌کار ادمین</strong>
        <p>در حال آماده‌سازی مینی‌اپ…</p>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root" dir="rtl">
      <Suspense fallback={<AdminBootFallback />}>
        <AdminTelegramProvider>
          <AdminShell>{children}</AdminShell>
        </AdminTelegramProvider>
      </Suspense>
    </div>
  );
}
