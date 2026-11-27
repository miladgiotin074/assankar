"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { maxChoices, saveChoices } from "@/lib/catalog";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";

export type ChoiceState = { error: string };

export async function submitChoice(_prev: ChoiceState, formData: FormData): Promise<ChoiceState> {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");

  const raw = String(formData.get("picks") ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "انتخاب محصولات را دوباره ثبت کنید." };
  }

  if (!Array.isArray(parsed) || !parsed.length || parsed.length > maxChoices) {
    return { error: "بین یک تا سه محصول انتخاب کنید." };
  }

  const picks = parsed.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as { productId?: unknown; quantity?: unknown };
    const productId = typeof record.productId === "string" ? record.productId : "";
    const quantity = Number(record.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity <= 0) return [];
    return [{ productId, quantity }];
  });

  if (picks.length !== parsed.length) {
    return { error: "محصول و تعداد بسته را دوباره انتخاب کنید." };
  }

  const saved = await saveChoices(session.phone, picks);
  if (!saved.ok) return { error: saved.error };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  redirect("/dashboard", RedirectType.replace);
}
