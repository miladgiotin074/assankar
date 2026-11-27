import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { adminTelegramIds } from "@/lib/admin-ids";

export { isAdminTelegramId } from "@/lib/admin-ids";

const cookieName = "ak_admin";
const sessionSeconds = 12 * 60 * 60;
const maxAuthAgeSeconds = 24 * 60 * 60;

export type AdminSession = {
  tgId: number;
  name: string;
  username: string;
  exp: number;
};

function botToken() {
  return process.env.BOT_TOKEN?.trim() || "";
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || "assankar-admin-dev";
}

function adminIds() {
  return adminTelegramIds();
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function sealed(session: Omit<AdminSession, "exp">, exp: number) {
  const payload = `${session.tgId}.${exp}.${encodeURIComponent(session.name)}.${encodeURIComponent(session.username)}`;
  return `${payload}.${sign(payload)}`;
}

function opened(value: string | undefined, now: number): AdminSession | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 5) return null;
  const [tgText, expText, nameEnc, userEnc, mac] = parts;
  const tgId = Number(tgText);
  const exp = Number(expText);
  if (!Number.isFinite(tgId) || !Number.isFinite(exp) || exp < now) return null;
  if (!adminIds().includes(tgId)) return null;

  const payload = `${tgText}.${expText}.${nameEnc}.${userEnc}`;
  const expected = sign(payload);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  return {
    tgId,
    name: decodeURIComponent(nameEnc || ""),
    username: decodeURIComponent(userEnc || ""),
    exp,
  };
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
    path: "/",
    maxAge,
  };
}

function cookieOptionsDev(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge,
  };
}

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type VerifiedInitData = {
  user: TelegramWebAppUser;
  authDate: number;
};

export function verifyTelegramInitData(initData: string): VerifiedInitData | null {
  const raw = initData.trim();
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  if (!hash) return null;

  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const checkString = pairs.join("\n");

  const authDate = Number(params.get("auth_date") || 0);
  if (!Number.isFinite(authDate) || authDate <= 0) return null;
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age < 0 || age > maxAuthAgeSeconds) return null;

  let user: TelegramWebAppUser | null = null;
  try {
    user = JSON.parse(params.get("user") || "null") as TelegramWebAppUser | null;
  } catch {
    return null;
  }
  if (!user || !Number.isFinite(user.id) || user.id <= 0) return null;
  if (!adminIds().includes(user.id)) return null;

  const token = botToken();
  if (!token) {
    if (process.env.NODE_ENV !== "production" && process.env.ADMIN_DEV_BYPASS === "1") {
      return { user, authDate };
    }
    return null;
  }

  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  const calculated = createHmac("sha256", secretKey).update(checkString).digest("hex");
  const left = Buffer.from(calculated, "hex");
  const right = Buffer.from(hash, "hex");
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  return { user, authDate };
}

export async function readAdminSession() {
  await connection();
  const store = await cookies();
  return opened(store.get(cookieName)?.value, Date.now());
}

export async function startAdminSession(user: TelegramWebAppUser) {
  if (!adminIds().includes(user.id)) {
    return { ok: false as const, error: "دسترسی ادمین ندارید." };
  }
  const store = await cookies();
  const exp = Date.now() + sessionSeconds * 1000;
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || "ادمین";
  const username = user.username || "";
  const value = sealed({ tgId: user.id, name, username }, exp);
  const options = process.env.NODE_ENV === "production" ? cookieOptions(sessionSeconds) : cookieOptionsDev(sessionSeconds);
  store.set(cookieName, value, options);
  return { ok: true as const, session: { tgId: user.id, name, username, exp } satisfies AdminSession };
}

export async function endAdminSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function requireAdmin() {
  const session = await readAdminSession();
  if (!session) return null;
  return session;
}
