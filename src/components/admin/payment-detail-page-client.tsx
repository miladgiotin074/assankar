"use client";

import { useParams } from "next/navigation";
import { AdminPaymentDetailView } from "@/components/admin/payment-detail-view";

export function AdminPaymentDetailPageClient() {
  const params = useParams<{ phone: string }>();
  const phone = typeof params.phone === "string" ? params.phone : "";
  if (!phone) return <div className="admin-empty">شماره نامعتبر است.</div>;
  return <AdminPaymentDetailView phone={phone} />;
}
