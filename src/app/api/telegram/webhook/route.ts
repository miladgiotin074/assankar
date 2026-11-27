import { NextResponse } from "next/server";
import {
  handleTelegramUpdate,
  telegramWebhookStatus,
  type TelegramUpdate,
} from "@/lib/telegram-bot";

export async function GET() {
  const status = await telegramWebhookStatus();
  return NextResponse.json({ ok: true, service: "telegram-webhook", ...status });
}

export async function POST(request: Request) {
  // Secret is optional. A mismatched secret was blocking all Telegram updates.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token") || "";
    if (header && header !== secret) {
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
