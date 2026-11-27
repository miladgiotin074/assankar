import { NextResponse } from "next/server";
import { adminListPayments } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { parsePaymentKind, type PaymentKind, type PaymentStatus } from "@/lib/payment";

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusRaw = searchParams.get("status") || "pending";
  const status = (["pending", "approved", "rejected", "all"].includes(statusRaw)
    ? statusRaw
    : "pending") as PaymentStatus | "all";
  const kindRaw = searchParams.get("kind") || "all";
  const kind = (kindRaw === "all" ? "all" : parsePaymentKind(kindRaw)) as PaymentKind | "all";
  const q = searchParams.get("q") || "";
  return NextResponse.json({ items: await adminListPayments(status, q, kind) });
}
