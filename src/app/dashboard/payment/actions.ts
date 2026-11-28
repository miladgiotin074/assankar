"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { readChoices } from "@/lib/catalog";
import { saveReceipt, type PaymentKind } from "@/lib/payment";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";

export type PaymentState = { error: string };

async function submitKind(kind: PaymentKind, formData: FormData): Promise<PaymentState> {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");
  if (!(await readChoices(session.phone)).length) redirect("/dashboard/products");

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size <= 0) {
    return { error: "عکس فیش واریزی را انتخاب کنید." };
  }

  const optionId = String(formData.get("optionId") ?? "").trim();
  const saved = await saveReceipt(session.phone, file, kind, optionId);
  if (!saved.ok) return { error: saved.error };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payment");
  revalidatePath("/dashboard/insurance");
  revalidatePath("/dashboard/guarantee");
  revalidatePath("/dashboard/shipping");
  revalidatePath("/dashboard/warehouse");
  redirect("/dashboard", RedirectType.replace);
}

export async function submitReceipt(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  return submitKind("registration", formData);
}

export async function submitInsuranceReceipt(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  return submitKind("insurance", formData);
}

export async function submitGuaranteeReceipt(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  return submitKind("guarantee", formData);
}

export async function submitShippingReceipt(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  return submitKind("shipping", formData);
}

export async function submitWarehouseReceipt(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  return submitKind("warehouse", formData);
}
