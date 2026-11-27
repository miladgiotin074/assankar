import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Collection } from "mongodb";
import { toEnglishDigits } from "@/lib/apply";
import { isAtLeast18, isValidJalaliDate, jalaliToGregorian } from "@/lib/jalali";
import { collection } from "@/lib/mongo";

export type ProfileField = "firstName" | "lastName" | "card" | "birth" | "address";

export type ProfileState = {
  error: string;
  field: ProfileField | "";
};

export type ProfileRecord = {
  phone: string;
  firstName: string;
  lastName: string;
  card: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  address: string;
  at: Date;
};

const namePattern = /^[\u0600-\u06FF\u200c\s-]{2,40}$/;

let profilesReady: Promise<void> | null = null;

function luhn(card: string) {
  let sum = 0;
  let double = false;
  for (let index = card.length - 1; index >= 0; index -= 1) {
    let digit = Number(card[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function digits(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "");
}

function cleanName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isPersonName(value: string) {
  return namePattern.test(value) && /[\u0600-\u06FF]/.test(value);
}

export function checkProfile(raw: {
  firstName: string;
  lastName: string;
  card: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  address: string;
}): { ok: true; value: Omit<ProfileRecord, "phone" | "at"> } | { ok: false; error: string; field: ProfileField } {
  const firstName = cleanName(raw.firstName);
  if (!isPersonName(firstName)) {
    return { ok: false, field: "firstName", error: "نام را با حروف فارسی بنویسید." };
  }

  const lastName = cleanName(raw.lastName);
  if (!isPersonName(lastName)) {
    return { ok: false, field: "lastName", error: "نام خانوادگی را با حروف فارسی بنویسید." };
  }

  const card = digits(raw.card);
  if (!/^[56]\d{15}$/.test(card) || /^(\d)\1{15}$/.test(card) || !luhn(card)) {
    return { ok: false, field: "card", error: "شماره کارت را شانزده رقم معتبر بنویسید." };
  }

  const birthYear = Number(digits(raw.birthYear));
  const birthMonth = Number(digits(raw.birthMonth));
  const birthDay = Number(digits(raw.birthDay));
  if (!isValidJalaliDate(birthYear, birthMonth, birthDay)) {
    return { ok: false, field: "birth", error: "تاریخ تولد را درست بنویسید." };
  }

  const birth = jalaliToGregorian(birthYear, birthMonth, birthDay);
  if (!birth || !isAtLeast18(birth)) {
    return { ok: false, field: "birth", error: "حداقل سن برای همکاری ۱۸ سال است." };
  }

  const address = raw.address.trim().replace(/\s+/g, " ");
  if (address.length < 12 || address.length > 400 || !/[\u0600-\u06FFa-zA-Z]/.test(address)) {
    return { ok: false, field: "address", error: "آدرس دقیق محل سکونت را کامل بنویسید." };
  }

  return { ok: true, value: { firstName, lastName, card, birthYear, birthMonth, birthDay, address } };
}

async function profiles() {
  const col = await collection<ProfileRecord>("profiles");
  if (!profilesReady) {
    profilesReady = col
      .createIndex({ phone: 1 }, { unique: true })
      .then(() => importLegacy(col))
      .catch((error: unknown) => {
        profilesReady = null;
        throw error;
      });
  }
  await profilesReady;
  return col;
}

async function importLegacy(col: Collection<ProfileRecord>) {
  try {
    const raw = await readFile(join(process.cwd(), "data", "profiles.json"), "utf8");
    const data = JSON.parse(raw) as Record<
      string,
      {
        firstName?: string;
        lastName?: string;
        card?: string;
        birthYear?: number;
        birthMonth?: number;
        birthDay?: number;
        address?: string;
        at?: string;
      }
    >;
    for (const [phone, value] of Object.entries(data)) {
      if (!/^09\d{9}$/.test(phone) || !value || typeof value.card !== "string") continue;
      await col.updateOne(
        { phone },
        {
          $setOnInsert: {
            phone,
            firstName: value.firstName ?? "",
            lastName: value.lastName ?? "",
            card: value.card,
            birthYear: value.birthYear ?? 0,
            birthMonth: value.birthMonth ?? 0,
            birthDay: value.birthDay ?? 0,
            address: value.address ?? "",
            at: value.at ? new Date(String(value.at)) : new Date(),
          },
        },
        { upsert: true },
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function isComplete(profile: ProfileRecord | null) {
  return Boolean(
    profile &&
      isPersonName(profile.firstName) &&
      isPersonName(profile.lastName) &&
      profile.card.length === 16 &&
      profile.address.length >= 12,
  );
}

export async function hasProfile(phone: string) {
  const profile = await (await profiles()).findOne({ phone });
  return isComplete(profile);
}

export async function saveProfile(phone: string, value: Omit<ProfileRecord, "phone" | "at">) {
  await (
    await profiles()
  ).updateOne({ phone }, { $set: { ...value, phone, at: new Date() } }, { upsert: true });
}
