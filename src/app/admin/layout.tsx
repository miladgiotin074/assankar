import type { Metadata, Viewport } from "next";
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root" dir="rtl">
      <AdminTelegramProvider>
        <AdminShell>{children}</AdminShell>
      </AdminTelegramProvider>
    </div>
  );
}
