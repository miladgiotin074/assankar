"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { saveChoice } from "@/lib/catalog";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";

export type ChoiceState = { error: string };

export async function submitChoice(_prev: ChoiceState, formData: FormData): Promise<ChoiceState> {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");

  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(String(formData.get("quantity") ?? ""));
  const saved = await saveChoice(session.phone, productId, quantity);
  if (!saved.ok) return { error: saved.error };

  revalidatePath("/dashboard");
  redirect("/dashboard", RedirectType.replace);
}
