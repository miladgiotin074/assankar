import { ObjectId, type WithId } from "mongodb";
import { toEnglishDigits } from "@/lib/apply";
import { faNum } from "@/lib/format";
import { collection } from "@/lib/mongo";
import {
  maxChoices,
  type CatalogCard,
  type ChoiceItem,
  type WageRow,
} from "@/lib/catalog-shared";

export type { CatalogCard, ChoiceItem, WageRow };
export { maxChoices };

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

export type AdminProduct = CatalogCard & {
  active: boolean;
  order: number;
};

type ChoiceLine = {
  productId: string;
  quantity: number;
};

type ChoiceDoc = {
  phone: string;
  items: ChoiceLine[];
  productId?: string;
  quantity?: number;
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

function linesFromDoc(doc: ChoiceDoc | null): ChoiceLine[] {
  if (!doc) return [];
  if (Array.isArray(doc.items) && doc.items.length) {
    return doc.items
      .filter((item) => item && typeof item.productId === "string" && Number.isInteger(item.quantity) && item.quantity > 0)
      .slice(0, maxChoices);
  }
  if (typeof doc.productId === "string" && Number.isInteger(doc.quantity) && (doc.quantity ?? 0) > 0) {
    return [{ productId: doc.productId, quantity: doc.quantity as number }];
  }
  return [];
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

function toAdminProduct(doc: WithId<ProductDoc>): AdminProduct | null {
  const title = text(doc.title, 80);
  if (!title) return null;
  return {
    id: String(doc._id),
    title,
    image: imageUrl(doc.image),
    note: text(doc.note, 180) || packNote,
    wages: wages(doc.wages),
    active: doc.active !== false,
    order: Number.isFinite(Number(doc.order)) ? Number(doc.order) : 0,
  };
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

async function ensureCatalogSeed() {
  const col = await collection<ProductDoc & { _id?: string }>("products");
  const count = await col.countDocuments();
  if (count > 0) return;
  await col.insertMany(
    defaultProducts.map((item, index) => ({
      _id: item.id,
      title: item.title,
      image: item.image,
      note: item.note,
      wages: item.wages,
      active: true,
      order: index + 1,
      at: new Date(),
    })) as never[],
  );
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  try {
    await ensureCatalogSeed();
    const docs = await (await collection<ProductDoc>("products")).find({}).sort({ order: 1, title: 1 }).limit(80).toArray();
    return docs.flatMap((doc) => {
      const item = toAdminProduct(doc);
      return item ? [item] : [];
    });
  } catch {
    return defaultProducts.map((item, index) => ({ ...item, active: true, order: index + 1 }));
  }
}

export async function saveProduct(input: {
  id?: string;
  title: string;
  image: string;
  note: string;
  wages: { packs: number; amount: number; label?: string }[];
  active?: boolean;
  order?: number;
}) {
  const title = text(input.title, 80);
  if (!title) return { ok: false as const, error: "عنوان محصول را بنویسید." };
  const image = imageUrl(input.image);
  const note = text(input.note, 180) || packNote;
  const wageRows = (input.wages || [])
    .map((row, index) => {
      const packs = Number(row.packs);
      const amount = Number(row.amount);
      if (!Number.isInteger(packs) || packs <= 0 || !Number.isFinite(amount) || amount < 0) return null;
      return {
        packs,
        amount: Math.round(amount),
        label: text(row.label, 80) || `هر ${faNum(packs)} بسته`,
      };
    })
    .filter((row): row is WageRow => Boolean(row))
    .slice(0, 12);
  if (!wageRows.length) return { ok: false as const, error: "حداقل یک ردیف تعداد و دستمزد لازم است." };

  const payload = {
    title,
    image,
    note,
    wages: wageRows,
    active: input.active !== false,
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0,
    at: new Date(),
  };

  const col = await collection<ProductDoc>("products");
  if (input.id) {
    if (!ObjectId.isValid(input.id) && !defaultProducts.some((item) => item.id === input.id)) {
      return { ok: false as const, error: "شناسه محصول نامعتبر است." };
    }
    if (ObjectId.isValid(input.id)) {
      await col.updateOne({ _id: new ObjectId(input.id) } as never, { $set: payload }, { upsert: false });
      return { ok: true as const, id: input.id };
    }
    await col.updateOne({ _id: input.id } as never, { $set: payload }, { upsert: true });
    return { ok: true as const, id: input.id };
  }

  const inserted = await col.insertOne(payload as never);
  return { ok: true as const, id: String(inserted.insertedId) };
}

export async function setProductActive(id: string, active: boolean) {
  const col = await collection<ProductDoc>("products");
  if (ObjectId.isValid(id)) {
    await col.updateOne({ _id: new ObjectId(id) } as never, { $set: { active, at: new Date() } });
    return { ok: true as const };
  }
  await col.updateOne({ _id: id } as never, { $set: { active, at: new Date() } }, { upsert: false });
  return { ok: true as const };
}

async function productById(id: string) {
  return (await listProducts()).find((item) => item.id === id) ?? null;
}

async function productByIdAny(id: string) {
  const active = await productById(id);
  if (active) return active;
  try {
    const col = await collection<ProductDoc>("products");
    const doc = ObjectId.isValid(id)
      ? await col.findOne({ _id: new ObjectId(id) } as never)
      : await col.findOne({ _id: id } as never);
    if (!doc) return defaultProducts.find((item) => item.id === id) ?? null;
    return card(String(doc._id), doc);
  } catch {
    return defaultProducts.find((item) => item.id === id) ?? null;
  }
}

export async function readChoices(phone: string): Promise<ChoiceItem[]> {
  const doc = await (await choicesReady()).findOne({ phone });
  const lines = linesFromDoc(doc);
  if (!lines.length) return [];

  const resolved = await Promise.all(
    lines.map(async (line) => {
      const item = await productByIdAny(line.productId);
      const row = item?.wages.find((wage) => wage.packs === line.quantity);
      if (!item || !row) return null;
      return {
        productId: item.id,
        title: item.title,
        image: item.image,
        quantity: row.packs,
        label: row.label,
        amount: row.amount,
      } satisfies ChoiceItem;
    }),
  );
  return resolved.filter((item): item is ChoiceItem => Boolean(item));
}

export async function clearChoice(phone: string) {
  await (await choicesReady()).deleteOne({ phone });
}

export async function saveChoices(phone: string, picks: ChoiceLine[]) {
  if (!picks.length || picks.length > maxChoices) {
    return { ok: false as const, error: "بین یک تا سه محصول انتخاب کنید." };
  }

  const seen = new Set<string>();
  const items: ChoiceLine[] = [];
  for (const pick of picks) {
    if (seen.has(pick.productId)) {
      return { ok: false as const, error: "هر محصول را فقط یک‌بار انتخاب کنید." };
    }
    seen.add(pick.productId);
    const item = await productById(pick.productId);
    const row = item?.wages.find((wage) => wage.packs === pick.quantity);
    if (!item || !row) {
      return { ok: false as const, error: "محصول و تعداد بسته را دوباره انتخاب کنید." };
    }
    items.push({ productId: item.id, quantity: row.packs });
  }

  await (
    await choicesReady()
  ).updateOne(
    { phone },
    { $set: { phone, items, at: new Date() }, $unset: { productId: "", quantity: "" } },
    { upsert: true },
  );
  return { ok: true as const };
}
