"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { normalizePhone } from "@/lib/apply";
import { isValidMobile, isValidNationalId, normalizeNationalId, type AuthState } from "@/lib/identity";
import { clearChoice } from "@/lib/catalog";
import { clearPayment } from "@/lib/payment";
import { checkProfile, clearProfile, saveProfile, type ProfileState } from "@/lib/profile";
import { endSession, readPendingPhone, readSession, rememberPhone, startSession } from "@/lib/session";
import { openAccount } from "@/lib/users";

const hits = new Map<string, number[]>();

async function limited() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 12) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function honeypot(formData: FormData) {
  const trap = formData.get("hp_field");
  return typeof trap === "string" && trap.trim().length > 0;
}

export async function submitPhone(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (honeypot(formData)) redirect("/");
  if (await limited()) {
    return { error: "تعداد تلاش‌ها زیاد شده. کمی بعد دوباره شماره را بنویسید." };
  }

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!isValidMobile(phone)) {
    return { error: "شماره موبایل را با ۰۹ و یازده رقم بنویسید." };
  }

  await rememberPhone(phone);
  redirect("/account/national-id");
}

export async function submitNationalId(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (honeypot(formData)) redirect("/");
  const phone = await readPendingPhone();
  if (!phone) redirect("/register");
  if (await limited()) {
    return { error: "تعداد تلاش‌ها زیاد شده. کمی بعد دوباره کد ملی را بنویسید." };
  }

  const nationalId = normalizeNationalId(String(formData.get("nationalId") ?? ""));
  if (!isValidNationalId(nationalId)) {
    return { error: "کد ملی ده رقمی معتبر بنویسید." };
  }

  const account = await openAccount(phone, nationalId);
  if (!account.ok) return { error: account.error };

  await startSession(phone);
  redirect("/dashboard");
}

export async function submitProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  if (honeypot(formData)) redirect("/");
  const session = await readSession();
  if (!session) redirect("/register");
  if (await limited()) {
    return { error: "تعداد تلاش‌ها زیاد شده. کمی بعد دوباره اطلاعات را بنویسید.", field: "" };
  }

  const checked = checkProfile({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    sheba: String(formData.get("sheba") ?? ""),
    birthDay: String(formData.get("birthDay") ?? ""),
    birthMonth: String(formData.get("birthMonth") ?? ""),
    birthYear: String(formData.get("birthYear") ?? ""),
    address: String(formData.get("address") ?? ""),
  });
  if (!checked.ok) return { error: checked.error, field: checked.field };

  try {
    await saveProfile(session.phone, checked.value);
  } catch {
    return { error: "ذخیرهٔ اطلاعات ممکن نشد. دوباره تلاش کنید.", field: "" };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard", RedirectType.replace);
}

export async function logout() {
  await endSession();
  redirect("/register");
}

export async function resetAccount() {
  const session = await readSession();
  if (!session) redirect("/register");
  await clearProfile(session.phone);
  await clearChoice(session.phone);
  await clearPayment(session.phone);
  revalidatePath("/dashboard");
  revalidatePath("/account/profile");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/payment");
  redirect("/dashboard", RedirectType.replace);
}
