import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Collection } from "mongodb";
import { collection } from "@/lib/mongo";
import { findShippingOption, findWarehouseOption, getSettings } from "@/lib/settings";

export type PaymentStatus = "pending" | "approved" | "rejected";
export type PaymentKind = "registration" | "insurance" | "guarantee" | "warehouse" | "shipping";

const paymentKinds = new Set<PaymentKind>(["registration", "insurance", "guarantee", "warehouse", "shipping"]);

export function parsePaymentKind(value: unknown, fallback: PaymentKind = "registration"): PaymentKind {
  return typeof value === "string" && paymentKinds.has(value as PaymentKind)
    ? (value as PaymentKind)
    : fallback;
}

export type PaymentRecord = {
  phone: string;
  kind: PaymentKind;
  amount: number;
  status: PaymentStatus;
  fileId: string;
  storedName: string;
  mime: string;
  size: number;
  originalName: string;
  at: Date;
  reviewedAt?: Date;
  reviewedBy?: number;
  optionId?: string;
  optionLabel?: string;
};

const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const maxBytes = 5 * 1024 * 1024;
let paymentsReady: Promise<Collection<PaymentRecord>> | null = null;

function rootDir() {
  return join(process.cwd(), "data", "receipts");
}

function normalize(doc: PaymentRecord | null) {
  if (!doc) return null;
  return { ...doc, kind: parsePaymentKind(doc.kind) };
}

async function amountFor(kind: PaymentKind, optionId = "") {
  const settings = await getSettings();
  if (kind === "insurance") return settings.insuranceFee;
  if (kind === "guarantee") return settings.guaranteeFee;
  if (kind === "warehouse") {
    const option = findWarehouseOption(settings, optionId);
    return option?.amount ?? settings.warehouseFee;
  }
  if (kind === "shipping") {
    const option = findShippingOption(settings, optionId);
    return option?.amount ?? settings.shippingFee;
  }
  return settings.registrationFee;
}

function payments() {
  if (!paymentsReady) {
    paymentsReady = collection<PaymentRecord>("payments")
      .then(async (col) => {
        try {
          await col.dropIndex("phone_1");
        } catch {
          /* old unique phone index may already be gone */
        }
        await col.updateMany({ kind: { $exists: false } }, { $set: { kind: "registration" } });
        await col.createIndex({ phone: 1, kind: 1 }, { unique: true });
        await col.createIndex({ fileId: 1 }, { unique: true });
        return col;
      })
      .catch((error: unknown) => {
        paymentsReady = null;
        throw error;
      });
  }
  return paymentsReady;
}

function safeName(value: string) {
  return value.replace(/[^\u0600-\u06FFa-zA-Z0-9._-]+/g, "-").slice(0, 80);
}

export function paymentKindLabel(kind: PaymentKind) {
  if (kind === "insurance") return "بیمه";
  if (kind === "guarantee") return "ضمانت کالا";
  if (kind === "warehouse") return "انبار";
  if (kind === "shipping") return "باربری";
  return "ثبت‌نام";
}

export async function readPayment(phone: string, kind: PaymentKind = "registration") {
  const col = await payments();
  if (kind === "registration") {
    const exact = await col.findOne({ phone, kind: "registration" });
    if (exact) return normalize(exact);
    const legacy = await col.findOne({ phone, kind: { $exists: false } });
    return normalize(legacy);
  }
  return normalize(await col.findOne({ phone, kind }));
}

export async function readPaymentsByPhone(phone: string) {
  const col = await payments();
  const rows = await col.find({ phone }).toArray();
  const map: Partial<Record<PaymentKind, PaymentRecord>> = {};
  for (const row of rows) {
    const hasKind = typeof row.kind === "string";
    const kind = hasKind ? parsePaymentKind(row.kind) : "registration";
    const normalized = normalize({ ...row, kind });
    if (!normalized) continue;
    if (!map[kind] || (kind === "registration" && hasKind)) {
      map[kind] = normalized;
    }
  }
  return map;
}

export async function listPayments(filter: {
  status?: PaymentStatus | "all";
  kind?: PaymentKind | "all";
  q?: string;
  phones?: string[];
  limit?: number;
}) {
  const limit = Math.min(100, Math.max(1, filter.limit ?? 40));
  const query: Record<string, unknown> = {};
  if (filter.status && filter.status !== "all") query.status = filter.status;
  if (filter.kind && filter.kind !== "all") query.kind = filter.kind;
  const phones = (filter.phones || []).filter((phone) => /^09\d{9}$/.test(phone)).slice(0, 80);
  const digits = (filter.q || "").replace(/\D/g, "");
  if (phones.length) query.phone = { $in: phones };
  else if (digits) query.phone = { $regex: digits };
  const rows = await (await payments()).find(query).sort({ at: -1 }).limit(limit).toArray();
  return rows.map((row) => normalize(row)!);
}

export async function paymentSeries(days = 7) {
  const count = Math.min(14, Math.max(1, days));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - (count - 1));
  const docs = await (await payments())
    .find({ $or: [{ at: { $gte: start } }, { reviewedAt: { $gte: start } }] })
    .project({ at: 1, reviewedAt: 1, status: 1 })
    .toArray();

  const points = Array.from({ length: count }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      key: `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
      label: new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(day),
      submitted: 0,
      approved: 0,
      rejected: 0,
    };
  });
  const byKey = new Map(points.map((point) => [point.key, point]));
  const keyOf = (value: Date | undefined) => {
    if (!value) return "";
    const day = new Date(value);
    return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
  };

  for (const doc of docs) {
    const submitted = byKey.get(keyOf(doc.at));
    if (submitted) submitted.submitted += 1;
    const reviewed = byKey.get(keyOf(doc.reviewedAt));
    if (reviewed && doc.status === "approved") reviewed.approved += 1;
    if (reviewed && doc.status === "rejected") reviewed.rejected += 1;
  }

  return points.map(({ label, submitted, approved, rejected }) => ({
    label,
    submitted,
    approved,
    rejected,
  }));
}

export async function countPaymentsByStatus() {
  const col = await payments();
  const [pending, approved, rejected] = await Promise.all([
    col.countDocuments({ status: "pending" }),
    col.countDocuments({ status: "approved" }),
    col.countDocuments({ status: "rejected" }),
  ]);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const approvedToday = await col.countDocuments({ status: "approved", reviewedAt: { $gte: start } });
  return { pending, approved, rejected, approvedToday };
}

export async function reviewPayment(
  phone: string,
  status: "approved" | "rejected",
  adminTgId: number,
  kind: PaymentKind = "registration",
) {
  if (!/^09\d{9}$/.test(phone)) {
    return { ok: false as const, error: "شماره معتبر نیست." };
  }
  const current = await readPayment(phone, kind);
  if (!current) return { ok: false as const, error: "فیشی برای این شماره نیست." };
  if (!current.fileId) return { ok: false as const, error: "فایل فیش پیدا نشد." };

  await (await payments()).updateOne(
    { phone, kind: current.kind },
    {
      $set: {
        kind: current.kind,
        status,
        reviewedAt: new Date(),
        reviewedBy: adminTgId,
      },
    },
  );
  return { ok: true as const };
}

export async function clearPayment(phone: string) {
  const col = await payments();
  const rows = await col.find({ phone }).toArray();
  for (const current of rows) {
    if (current.storedName) {
      await rm(join(rootDir(), current.storedName), { force: true });
    }
  }
  await col.deleteMany({ phone });
}

export async function readReceiptFile(fileId: string) {
  const payment = normalize(await (await payments()).findOne({ fileId }));
  if (!payment) return null;
  const bytes = await readFile(join(rootDir(), payment.storedName));
  return { payment, bytes };
}

export async function saveReceipt(
  phone: string,
  file: File,
  kind: PaymentKind = "registration",
  optionId = "",
) {
  const mime = file.type;
  const ext = allowed.get(mime);
  if (!ext) {
    return { ok: false as const, error: "فقط عکس با فرمت JPG، PNG یا WEBP بفرستید." };
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false as const, error: "فایل عکس را دوباره انتخاب کنید." };
  }
  if (file.size > maxBytes) {
    return { ok: false as const, error: "حجم عکس حداکثر ۵ مگابایت باشد." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    return { ok: false as const, error: "حجم عکس حداکثر ۵ مگابایت باشد." };
  }

  if (kind === "insurance") {
    const registration = await readPayment(phone, "registration");
    if (registration?.status !== "approved") {
      return { ok: false as const, error: "اول باید هزینهٔ ثبت‌نام تأیید شده باشد." };
    }
  }
  if (kind === "guarantee") {
    const insurance = await readPayment(phone, "insurance");
    if (insurance?.status !== "approved") {
      return { ok: false as const, error: "اول باید هزینهٔ بیمه تأیید شده باشد." };
    }
  }
  if (kind === "warehouse") {
    const guarantee = await readPayment(phone, "guarantee");
    if (guarantee?.status !== "approved") {
      return { ok: false as const, error: "اول باید ضمانت کالا تأیید شده باشد." };
    }
  }
  if (kind === "shipping") {
    const warehouse = await readPayment(phone, "warehouse");
    if (warehouse?.status !== "approved") {
      return { ok: false as const, error: "اول باید هزینهٔ انبار تأیید شده باشد." };
    }
  }

  const existing = await readPayment(phone, kind);
  if (existing?.status === "approved") {
    return { ok: false as const, error: "واریز شما قبلاً تأیید شده است." };
  }

  let amount = await amountFor(kind, optionId);
  let resolvedOptionId: string | undefined;
  let optionLabel: string | undefined;
  if (kind === "warehouse" || kind === "shipping") {
    const settings = await getSettings();
    const option =
      kind === "warehouse" ? findWarehouseOption(settings, optionId) : findShippingOption(settings, optionId);
    if (!option) {
      return {
        ok: false as const,
        error: kind === "warehouse" ? "یکی از گزینه‌های مدت انبار را انتخاب کنید." : "یکی از گزینه‌های مدت باربری را انتخاب کنید.",
      };
    }
    amount = option.amount;
    resolvedOptionId = option.id;
    optionLabel = option.label;
  }

  await mkdir(rootDir(), { recursive: true });
  const fileId = createHash("sha256")
    .update(`${phone}:${kind}:${Date.now()}:${randomBytes(8).toString("hex")}`)
    .digest("hex")
    .slice(0, 32);
  const storedName = `${fileId}.${ext}`;
  await writeFile(join(rootDir(), storedName), buffer);

  const record: PaymentRecord = {
    phone,
    kind,
    amount,
    status: "pending",
    fileId,
    storedName,
    mime,
    size: buffer.byteLength,
    originalName: safeName(file.name || `receipt.${ext}`),
    at: new Date(),
    ...(resolvedOptionId ? { optionId: resolvedOptionId, optionLabel } : {}),
  };

  await (await payments()).updateOne(
    { phone, kind },
    {
      $set: record,
      $unset: {
        reviewedAt: "",
        reviewedBy: "",
        ...(kind === "warehouse" || kind === "shipping" ? {} : { optionId: "", optionLabel: "" }),
      },
    },
    { upsert: true },
  );

  if (existing?.storedName && existing.storedName !== storedName) {
    await rm(join(rootDir(), existing.storedName), { force: true });
  }

  return { ok: true as const, payment: record };
}
