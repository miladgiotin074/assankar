import { toEnglishDigits } from "@/lib/apply";
import { faNum } from "@/lib/format";
import { collection } from "@/lib/mongo";

export type WageRow = {
  label: string;
  packs: number;
  amount: number;
};

export type CatalogCard = {
  id: string;
  title: string;
  image: string;
  note: string;
  wages: WageRow[];
};

const packNote = "وسایل موردنیاز آماده است و کار شما صرفاً بسته‌بندی می‌باشد.";

function packRows(rows: [number, number][]): WageRow[] {
  return rows.map(([packs, amount]) => ({
    label: `هر ${faNum(packs)} بسته`,
    packs,
    amount,
  }));
}

export const defaultProducts: CatalogCard[] = [
  {
    id: "safety-pin",
    title: "بسته‌بندی سوزن قفلی",
    image: "/products/safety-pin.jpg",
    note: packNote,
    wages: packRows([
      [100, 850_000],
      [1000, 8_500_000],
      [10_000, 85_000_000],
    ]),
  },
  {
    id: "socks",
    title: "بسته‌بندی جوراب صادراتی",
    image: "/products/socks.jpg",
    note: packNote,
    wages: packRows([
      [100, 4_000_000],
      [200, 8_000_000],
    ]),
  },
  {
    id: "barbie",
    title: "بسته‌بندی عروسک باربی صادراتی",
    image: "/products/barbie.jpg",
    note: packNote,
    wages: packRows([
      [1, 20_000],
      [10, 200_000],
      [100, 2_000_000],
      [400, 8_000_000],
    ]),
  },
  {
    id: "foundation",
    title: "بسته‌بندی کرم پودر لورآل اصلی",
    image: "/products/foundation.jpg",
    note: packNote,
    wages: packRows([
      [10, 400_000],
      [100, 4_000_000],
      [200, 8_000_000],
      [400, 16_000_000],
    ]),
  },
  {
    id: "match-pencil",
    title: "بسته‌بندی کبریت مدل مداد",
    image: "/products/match-pencil.jpg",
    note: packNote,
    wages: packRows([
      [500, 1_500_000],
      [1000, 2_500_000],
      [3000, 5_000_000],
    ]),
  },
  {
    id: "lip-tint",
    title: "بسته‌بندی تینت لب بستنی مجیک",
    image: "/products/lip-tint.jpg",
    note: packNote,
    wages: packRows([
      [10, 400_000],
      [100, 4_000_000],
      [1000, 40_000_000],
    ]),
  },
];

type ProductDoc = {
  title?: unknown;
  image?: unknown;
  note?: unknown;
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

function packCount(value: unknown, label: string, index: number) {
  const direct = Number(value);
  if (Number.isInteger(direct) && direct > 0) return direct;
  const digits = toEnglishDigits(label).replace(/[^\d]/g, "");
  const parsed = Number(digits);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return index + 1;
}

function wages(value: unknown): WageRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row, index) => {
    if (!row || typeof row !== "object") return [];
    const record = row as { label?: unknown; amount?: unknown; packs?: unknown };
    const label = text(record.label, 80);
    const amount = Number(record.amount);
    if (!label || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) return [];
    return [{ label, amount: Math.round(amount), packs: packCount(record.packs, label, index) }];
  }).slice(0, 12);
}

function card(id: string, doc: ProductDoc): CatalogCard | null {
  const title = text(doc.title, 80);
  if (!title || doc.active === false) return null;
  return { id, title, image: imageUrl(doc.image), note: text(doc.note, 180), wages: wages(doc.wages) };
}

export async function listProducts(): Promise<CatalogCard[]> {
  try {
    const docs = await (await collection<ProductDoc>("products"))
      .find({ active: { $ne: false } })
      .sort({ order: 1, title: 1 })
      .limit(40)
      .toArray();
    const items = docs.flatMap((doc) => {
      const item = card(String(doc._id), doc);
      return item ? [item] : [];
    });
    if (items.length) return items;
  } catch {
    return defaultProducts;
  }
  return defaultProducts;
}

async function productById(id: string) {
  return (await listProducts()).find((item) => item.id === id) ?? null;
}

export async function readChoice(phone: string) {
  const choice = await (await choicesReady()).findOne({ phone });
  if (!choice) return null;
  const item = await productById(choice.productId);
  const row = item?.wages.find((wage) => wage.packs === choice.quantity);
  if (!item || !row) return null;
  return { productId: item.id, title: item.title, quantity: row.packs, label: row.label };
}

export async function clearChoice(phone: string) {
  await (await choicesReady()).deleteOne({ phone });
}

export async function saveChoice(phone: string, productId: string, quantity: number) {
  const item = await productById(productId);
  const row = item?.wages.find((wage) => wage.packs === quantity);
  if (!item || !row) {
    return { ok: false as const, error: "محصول و تعداد بسته را دوباره انتخاب کنید." };
  }
  await (
    await choicesReady()
  ).updateOne({ phone }, { $set: { phone, productId, quantity: row.packs, at: new Date() } }, { upsert: true });
  return { ok: true as const };
}
