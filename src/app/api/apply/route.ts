import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { validateApply } from "@/lib/apply";

const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 8) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return Response.json({ ok: false, message: "درخواست از مبدأ نامعتبر است." }, { status: 403 });
      }
    } catch {
      return Response.json({ ok: false, message: "درخواست از مبدأ نامعتبر است." }, { status: 403 });
    }
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 12_000) {
    return Response.json({ ok: false, message: "پیام طولانی است." }, { status: 413 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return Response.json(
      { ok: false, message: "تعداد درخواست‌ها زیاد شده. کمی بعد دوباره تلاش کنید یا تلفنی هماهنگ کنید." },
      { status: 429 },
    );
  }

  let body: {
    name?: unknown;
    city?: unknown;
    phone?: unknown;
    path?: unknown;
    note?: unknown;
    consent?: unknown;
    hp_field?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "درخواست نامعتبر است." }, { status: 400 });
  }

  if (typeof body.hp_field === "string" && body.hp_field.trim()) {
    return Response.json({ ok: true, ref: "AK-OK" });
  }

  const result = validateApply(body);
  if (!result.ok) {
    return Response.json(result, { status: 400 });
  }

  const ref = `AK-${Date.now().toString(36).toUpperCase()}`;
  try {
    const dir = join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await appendFile(
      join(dir, "applications.jsonl"),
      `${JSON.stringify({ ref, at: new Date().toISOString(), ...result.value })}\n`,
      "utf8",
    );
  } catch {
    return Response.json(
      { ok: false, message: "ثبت درخواست روی سرور ممکن نشد. لطفاً تلفنی هماهنگ کنید." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, ref });
}
