import { NextResponse } from "next/server";
import { adminListPartners } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams.get("q") || "";
  return NextResponse.json({ items: await adminListPartners(q) });
}
