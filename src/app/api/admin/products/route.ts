import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminProducts, saveProduct, setProductActive } from "@/lib/catalog";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ items: await listAdminProducts() });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | {
        id?: string;
        title?: string;
        image?: string;
        note?: string;
        wages?: { packs: number; amount: number; label?: string }[];
        active?: boolean;
        order?: number;
      }
    | null;
  if (!body) {
    return NextResponse.json({ error: "داده نامعتبر است." }, { status: 400 });
  }
  const saved = await saveProduct({
    id: body.id,
    title: String(body.title ?? ""),
    image: String(body.image ?? ""),
    note: String(body.note ?? ""),
    wages: Array.isArray(body.wages) ? body.wages : [],
    active: body.active,
    order: body.order,
  });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true, id: saved.id });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { id?: string; active?: boolean } | null;
  if (!body?.id || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "داده نامعتبر است." }, { status: 400 });
  }
  await setProductActive(body.id, body.active);
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true });
}
