import { ObjectId } from "mongodb";
import { collection } from "@/lib/mongo";

export type WageRow = {
  label: string;
  amount: number;
};

export type CatalogCard = {
  id: string;
  title: string;
  image: string;
  wages: WageRow[];
};

type ProductDoc = {
  title?: unknown;
  image?: unknown;
  active?: unknown;
  order?: unknown;
  wages?: unknown;
};

type ChoiceDoc = {
  phone: string;
  productId: string;
  quantity: number;
  at: Date;
};

const choicesReady = collectionReady();

function collectionReady() {
  let ready: Promise<void> | null = null;
  return async () => {
    const col = await collection<ChoiceDoc>("choices");
    if (!ready) {
      ready = col
        .createIndex({ phone: 1 }, { unique: true })
        .then(() => undefined)
        .catch((error: unknown) => {
          ready = null;
          throw error;
        });
    }
    await ready;
    return col;
  };
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function imageUrl(value: unknown) {
  const url = text(value, 500);
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch {
    return "";
  }
  return "";
}

function wages(value: unknown): WageRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as { label?: unknown; amount?: unknown };
    const label = text(record.label, 80);
    const amount = Number(record.amount);
    if (!label || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) return [];
    return [{ label, amount: Math.round(amount) }];
  }).slice(0, 12);
}

function card(id: string, doc: ProductDoc): CatalogCard | null {
  const title = text(doc.title, 80);
  if (!title || doc.active === false) return null;
  return { id, title, image: imageUrl(doc.image), wages: wages(doc.wages) };
}

export async function listProducts(): Promise<CatalogCard[]> {
  const docs = await (await collection<ProductDoc>("products"))
    .find({ active: { $ne: false } })
    .sort({ order: 1, title: 1 })
    .limit(40)
    .toArray();

  return docs.flatMap((doc) => {
    const item = card(String(doc._id), doc);
    return item ? [item] : [];
  });
}

export async function readChoice(phone: string) {
  const choice = await (await choicesReady()).findOne({ phone });
  if (!choice || !ObjectId.isValid(choice.productId)) return null;
  if (choice.quantity < 1 || choice.quantity > 3) return null;
  const doc = await (await collection<ProductDoc>("products")).findOne({
    _id: new ObjectId(choice.productId),
    active: { $ne: false },
  });
  const item = doc ? card(choice.productId, doc) : null;
  if (!item) return null;
  return { productId: item.id, title: item.title, quantity: choice.quantity };
}

export async function saveChoice(phone: string, productId: string, quantity: number) {
  if (!ObjectId.isValid(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 3) {
    return { ok: false as const, error: "محصول و تعداد را دوباره انتخاب کنید." };
  }
  const doc = await (await collection<ProductDoc>("products")).findOne({
    _id: new ObjectId(productId),
    active: { $ne: false },
  });
  if (!doc || !card(productId, doc)) {
    return { ok: false as const, error: "این محصول برای انتخاب باز نیست." };
  }
  await (
    await choicesReady()
  ).updateOne({ phone }, { $set: { phone, productId, quantity, at: new Date() } }, { upsert: true });
  return { ok: true as const };
}
