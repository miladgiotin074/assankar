import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { reviewPayment } from "@/lib/payment";

type Params = { params: Promise<{ phone: string }> };

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { phone } = await params;
  if (!/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "شماره معتبر نیست." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status === "approved" || body?.status === "rejected" ? body.status : null;
  if (!status) {
    return NextResponse.json({ error: "وضعیت نامعتبر است." }, { status: 400 });
  }

  const result = await reviewPayment(phone, status, admin.tgId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payment");
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  return NextResponse.json({ ok: true, status });
}
