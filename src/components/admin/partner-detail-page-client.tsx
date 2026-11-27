"use client";

import { useParams } from "next/navigation";
import { AdminPartnerDetailView } from "@/components/admin/partner-detail-view";

export function AdminPartnerDetailPageClient() {
  const params = useParams<{ phone: string }>();
  const phone = typeof params.phone === "string" ? params.phone : "";
  if (!phone) return <div className="admin-empty">شماره نامعتبر است.</div>;
  return <AdminPartnerDetailView phone={phone} />;
}