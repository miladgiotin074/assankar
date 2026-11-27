import { NextResponse } from "next/server";
import { adminPaymentDetail } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { parsePaymentKind } from "@/lib/payment";

type Params = { params: Promise<{ phone: string }> };

export async function GET(request: Request, { params }: Params) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { phone } = await params;
  if (!/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const kind = parsePaymentKind(new URL(request.url).searchParams.get("kind"));
  const detail = await adminPaymentDetail(phone, kind);
  if (!detail) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(detail);
}
