import { isAdminTelegramId } from "@/lib/admin-ids";

function botToken() {
  return process.env.BOT_TOKEN?.trim() || "";
}

function adminUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "";
  return `${raw.replace(/\/$/, "")}/admin`;
}

async function telegramApi(method: string, body: Record<string, unknown>) {
  const token = botToken();
  if (!token) {
    console.error("[telegram] BOT_TOKEN is missing");
    return { ok: false as const, error: "BOT_TOKEN missing" };
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; description?: string; error_code?: number }
    | null;
  if (!response.ok || !data?.ok) {
    const error = data?.description || `Telegram ${method} failed`;
    console.error(`[telegram] ${method}:`, error);
    return { ok: false as const, error };
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
  if (!chatId || !fromId) return;

  const isStart =
    text === "/start" || text.startsWith("/start@") || text.startsWith("/start ");
  if (!isStart) return;

  if (!botToken()) {
    console.error("[telegram] /start ignored because BOT_TOKEN is empty");
    return;
  }

  if (!isAdminTelegramId(fromId)) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "این ربات فقط برای مدیران آسان‌کار است.",
    });
    return;
  }

  const url = adminUrl();
  if (!/^https:\/\/[^/]+\/admin$/.test(url)) {
    console.error("[telegram] invalid admin url:", url);
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: "آدرس پنل مدیریت روی سرور درست تنظیم نشده است. NEXT_PUBLIC_SITE_URL را بررسی کنید.",
    });
    return;
  }

  const withButton = await telegramApi("sendMessage", {
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

  if (withButton.ok) return;

  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `پنل مدیریت:\n${url}\n\nدکمه شیشه‌ای ارسال نشد (${withButton.error}). لینک بالا را در تلگرام باز کنید.`,
    reply_markup: {
      inline_keyboard: [[{ text: "باز کردن پنل", url }]],
    },
  });
}
