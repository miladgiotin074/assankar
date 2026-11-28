import { collection } from "@/lib/mongo";
import { site } from "@/lib/site";

export type WarehouseOption = {
  id: string;
  label: string;
  amount: number;
};

export type AppSettings = {
  registrationFee: number;
  insuranceFee: number;
  guaranteeFee: number;
  warehouseFee: number;
  shippingFee: number;
  warehouseOptions: WarehouseOption[];
  telegramUser: string;
  payoutCard: string;
  payoutHolder: string;
  payoutBank: string;
};

type SettingsDoc = Partial<AppSettings> & { _id: string; at?: Date };

const SETTINGS_ID = "app";

const defaultWarehouseOptions: WarehouseOption[] = [
  { id: "6m", label: "۶ ماهه", amount: site.warehouseFee },
  { id: "12m", label: "۱۲ ماهه", amount: site.warehouseFee12 },
];

const defaults: AppSettings = {
  registrationFee: site.registrationFee,
  insuranceFee: site.insuranceFee,
  guaranteeFee: site.guaranteeFee,
  warehouseFee: site.warehouseFee,
  shippingFee: site.shippingFee,
  warehouseOptions: defaultWarehouseOptions,
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

function optionId(value: unknown, fallback: string) {
  if (typeof value === "string" && /^[a-zA-Z0-9_-]{1,32}$/.test(value.trim())) return value.trim();
  return fallback;
}

function warehouseOptions(value: unknown, fallbackFee: number): WarehouseOption[] {
  if (!Array.isArray(value) || !value.length) {
    if (fallbackFee > 0) {
      return [
        { id: "6m", label: "۶ ماهه", amount: fallbackFee },
        { id: "12m", label: "۱۲ ماهه", amount: site.warehouseFee12 },
      ];
    }
    return defaultWarehouseOptions.map((row) => ({ ...row }));
  }

  const seen = new Set<string>();
  const rows: WarehouseOption[] = [];
  value.forEach((row, index) => {
    if (!row || typeof row !== "object") return;
    const raw = row as Record<string, unknown>;
    const label = typeof raw.label === "string" ? raw.label.trim().replace(/\s+/g, " ") : "";
    const amount = money(raw.amount, -1);
    if (!label || label.length > 48 || amount < 0) return;
    let id = optionId(raw.id, `opt${index + 1}`);
    if (seen.has(id)) id = `${id}_${index + 1}`;
    seen.add(id);
    rows.push({ id, label, amount });
  });

  return rows.length ? rows : defaultWarehouseOptions.map((row) => ({ ...row }));
}

function normalize(doc: Partial<AppSettings> | null | undefined): AppSettings {
  const options = warehouseOptions(doc?.warehouseOptions, money(doc?.warehouseFee, defaults.warehouseFee));
  return {
    registrationFee: money(doc?.registrationFee, defaults.registrationFee),
    insuranceFee: money(doc?.insuranceFee, defaults.insuranceFee),
    guaranteeFee: money(doc?.guaranteeFee, defaults.guaranteeFee),
    warehouseFee: options[0]?.amount ?? defaults.warehouseFee,
    shippingFee: money(doc?.shippingFee, defaults.shippingFee),
    warehouseOptions: options,
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

export function findWarehouseOption(settings: AppSettings, optionIdValue: string) {
  return settings.warehouseOptions.find((row) => row.id === optionIdValue) || settings.warehouseOptions[0] || null;
}
