import { isAdminTelegramId } from "@/lib/admin-auth";
import { site } from "@/lib/site";

function botToken() {
  return process.env.BOT_TOKEN?.trim() || "";
}

function adminUrl() {
  return `${site.url}/admin`;
}

async function telegramApi(method: string, body: Record<string, unknown>) {
  const token = botToken();
  if (!token) {
    return { ok: false as const, error: "BOT_TOKEN missing" };
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || !data?.ok) {
    return { ok: false as const, error: data?.description || `Telegram ${method} failed` };
  }
  return { ok: true as const };
}

export type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id: number; type?: string };
    from?: { id: number; first_name?: string; username?: string };
  };
};

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  const text = message?.text?.trim() || "";
  const chatId = message?.chat?.id;
  const fromId = message?.from?.id;
  if (!chatId || !fromId || !text) return;

  const isStart = text === "/start" || text.startsWith("/start@") || text.startsWith("/start ");
  if (!isStart) return;

  if (!isAdminTelegramId(fromId)) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "این ربات فقط برای مدیران آسان‌کار است.",
    });
    return;
  }

  const url = adminUrl();
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: "برای مدیریت فیش‌ها و همکاران، پنل مینی‌اپ را باز کنید.",
    reply_markup: {
      keyboard: [
        [
          {
            text: "پنل مدیریت آسان‌کار",
            web_app: { url },
          },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    },
  });
}
