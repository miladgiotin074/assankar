import { NextResponse } from "next/server";
import { adminListPartners, type PartnerFilter } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";

const stages = new Set<PartnerFilter>(["all", "pending", "approved", "rejected", "none", "no-choices"]);

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const raw = url.searchParams.get("stage") || "all";
  const stage = stages.has(raw as PartnerFilter) ? (raw as PartnerFilter) : "all";
  return NextResponse.json({ items: await adminListPartners(q, stage) });
}
