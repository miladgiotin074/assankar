import { NextResponse } from "next/server";
import { handleTelegramUpdate, type TelegramUpdate } from "@/lib/telegram-bot";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "telegram-webhook",
    hasToken: Boolean(process.env.BOT_TOKEN?.trim()),
    hasAdmins: Boolean(process.env.ADMIN_TELEGRAM_IDS?.trim()),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "",
  });
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token") || "";
    if (header !== secret) {
      console.error("[telegram] webhook secret mismatch");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleTelegramUpdate(update);
  } catch (error) {
    console.error("[telegram] update failed", error);
  }

  return NextResponse.json({ ok: true });
}
