"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { readChoices } from "@/lib/catalog";
import { saveReceipt } from "@/lib/payment";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";

export type PaymentState = { error: string };

export async function submitReceipt(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");
  if (!(await readChoices(session.phone)).length) redirect("/dashboard/products");

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size <= 0) {
    return { error: "عکس فیش واریزی را انتخاب کنید." };
  }

  const saved = await saveReceipt(session.phone, file);
  if (!saved.ok) return { error: saved.error };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payment");
  redirect("/dashboard", RedirectType.replace);
}
