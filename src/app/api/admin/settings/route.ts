import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings, saveSettings, type AppSettings } from "@/lib/settings";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getSettings());
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Partial<AppSettings> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "داده نامعتبر است." }, { status: 400 });
  }
  const saved = await saveSettings(body);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payment");
  revalidatePath("/dashboard/insurance");
  revalidatePath("/dashboard/guarantee");
  revalidatePath("/dashboard/warehouse");
  revalidatePath("/dashboard/shipping");
  revalidatePath("/");
  return NextResponse.json(saved);
}
