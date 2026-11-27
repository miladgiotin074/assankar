import { collection } from "@/lib/mongo";
import { site } from "@/lib/site";

export type AppSettings = {
  registrationFee: number;
  insuranceFee: number;
  guaranteeFee: number;
  warehouseFee: number;
  shippingFee: number;
  telegramUser: string;
  payoutCard: string;
  payoutHolder: string;
  payoutBank: string;
};

type SettingsDoc = Partial<AppSettings> & { _id: string; at?: Date };

const SETTINGS_ID = "app";
const defaults: AppSettings = {
  registrationFee: site.registrationFee,
  insuranceFee: site.insuranceFee,
  guaranteeFee: site.guaranteeFee,
  warehouseFee: site.warehouseFee,
  shippingFee: site.shippingFee,
  telegramUser: site.telegramUser,
  payoutCard: site.payoutCard,
  payoutHolder: site.payoutHolder,
  payoutBank: site.payoutBank,
};

let cache: AppSettings | null = null;

function money(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) return fallback;
  return Math.round(n);
}

function telegram(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const clean = value.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");
  if (clean.length < 3 || clean.length > 64) return fallback;
  return clean;
}

function text(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback;
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > max) return fallback;
  return clean;
}

function cardNumber(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 16 || digits.length > 19) return fallback;
  return digits;
}

function normalize(doc: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    registrationFee: money(doc?.registrationFee, defaults.registrationFee),
    insuranceFee: money(doc?.insuranceFee, defaults.insuranceFee),
    guaranteeFee: money(doc?.guaranteeFee, defaults.guaranteeFee),
    warehouseFee: money(doc?.warehouseFee, defaults.warehouseFee),
    shippingFee: money(doc?.shippingFee, defaults.shippingFee),
    telegramUser: telegram(doc?.telegramUser, defaults.telegramUser),
    payoutCard: cardNumber(doc?.payoutCard, defaults.payoutCard),
    payoutHolder: text(doc?.payoutHolder, defaults.payoutHolder, 80),
    payoutBank: text(doc?.payoutBank, defaults.payoutBank, 80),
  };
}

export function clearSettingsCache() {
  cache = null;
}

export async function getSettings(): Promise<AppSettings> {
  if (cache) return cache;
  try {
    const doc = await (await collection<SettingsDoc>("settings")).findOne({ _id: SETTINGS_ID });
    cache = normalize(doc);
    return cache;
  } catch {
    cache = defaults;
    return defaults;
  }
}

export async function saveSettings(input: Partial<AppSettings>) {
  const current = await getSettings();
  const next = normalize({ ...current, ...input });
  await (
    await collection<SettingsDoc>("settings")
  ).updateOne({ _id: SETTINGS_ID }, { $set: { ...next, updatedAt: new Date() } }, { upsert: true });
  cache = next;
  return next;
}
