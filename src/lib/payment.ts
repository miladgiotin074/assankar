import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Collection } from "mongodb";
import { collection } from "@/lib/mongo";
import { site } from "@/lib/site";

export type PaymentStatus = "pending" | "approved" | "rejected";

export type PaymentRecord = {
  phone: string;
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

function payments() {
  if (!paymentsReady) {
    paymentsReady = collection<PaymentRecord>("payments")
      .then(async (col) => {
        await col.createIndex({ phone: 1 }, { unique: true });
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

export async function readPayment(phone: string) {
  return (await payments()).findOne({ phone });
}

export async function listPayments(filter: {
  status?: PaymentStatus | "all";
  q?: string;
  limit?: number;
}) {
  const limit = Math.min(100, Math.max(1, filter.limit ?? 40));
  const query: Record<string, unknown> = {};
  if (filter.status && filter.status !== "all") query.status = filter.status;
  const q = filter.q?.trim() || "";
  if (q) {
    const digits = q.replace(/\D/g, "");
    if (digits) query.phone = { $regex: digits };
  }
  return (await payments()).find(query).sort({ at: -1 }).limit(limit).toArray();
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

export async function reviewPayment(phone: string, status: "approved" | "rejected", adminTgId: number) {
  if (!/^09\d{9}$/.test(phone)) {
    return { ok: false as const, error: "شماره معتبر نیست." };
  }
  const col = await payments();
  const current = await col.findOne({ phone });
  if (!current) return { ok: false as const, error: "فیشی برای این شماره نیست." };
  if (!current.fileId) return { ok: false as const, error: "فایل فیش پیدا نشد." };

  await col.updateOne(
    { phone },
    {
      $set: {
        status,
        reviewedAt: new Date(),
        reviewedBy: adminTgId,
      },
    },
  );
  return { ok: true as const };
}

export async function clearPayment(phone: string) {
  const current = await (await payments()).findOne({ phone });
  if (current?.storedName) {
    await rm(join(rootDir(), current.storedName), { force: true });
  }
  await (await payments()).deleteOne({ phone });
}

export async function readReceiptFile(fileId: string) {
  const payment = await (await payments()).findOne({ fileId });
  if (!payment) return null;
  const bytes = await readFile(join(rootDir(), payment.storedName));
  return { payment, bytes };
}

export async function saveReceipt(phone: string, file: File) {
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

  const existing = await (await payments()).findOne({ phone });
  if (existing?.status === "approved") {
    return { ok: false as const, error: "واریز شما قبلاً تأیید شده است." };
  }

  await mkdir(rootDir(), { recursive: true });
  const fileId = createHash("sha256").update(`${phone}:${Date.now()}:${randomBytes(8).toString("hex")}`).digest("hex").slice(0, 32);
  const storedName = `${fileId}.${ext}`;
  await writeFile(join(rootDir(), storedName), buffer);

  const record: PaymentRecord = {
    phone,
    amount: site.registrationFee,
    status: "pending",
    fileId,
    storedName,
    mime,
    size: buffer.byteLength,
    originalName: safeName(file.name || `receipt.${ext}`),
    at: new Date(),
  };

  await (await payments()).updateOne(
    { phone },
    { $set: record, $unset: { reviewedAt: "" } },
    { upsert: true },
  );

  if (existing?.storedName && existing.storedName !== storedName) {
    await rm(join(rootDir(), existing.storedName), { force: true });
  }

  return { ok: true as const, payment: record };
}
