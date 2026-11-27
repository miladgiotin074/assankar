import { NextResponse } from "next/server";
import { adminStats } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await adminStats());
}
