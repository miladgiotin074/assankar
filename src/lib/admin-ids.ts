export function adminTelegramIds() {
  return (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export function isAdminTelegramId(tgId: number) {
  return adminTelegramIds().includes(tgId);
}
