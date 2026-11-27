import { Suspense } from "react";
import { AdminPaymentDetailPageClient } from "@/components/admin/payment-detail-page-client";

export default function AdminPaymentDetailPage() {
  return (
    <Suspense fallback={<div className="admin-empty">در حال بارگذاری…</div>}>
      <AdminPaymentDetailPageClient />
    </Suspense>
  );
}
