import { Suspense } from "react";
import { AdminPartnerDetailPageClient } from "@/components/admin/partner-detail-page-client";

export default function AdminPartnerDetailPage() {
  return (
    <Suspense fallback={<div className="admin-empty">در حال بارگذاری…</div>}>
      <AdminPartnerDetailPageClient />
    </Suspense>
  );
}
