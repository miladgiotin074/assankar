import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

const pendingName = "ak_phone";
const sessionName = "ak_session";
const pendingSeconds = 20 * 60;
const sessionSeconds = 14 * 24 * 60 * 60;

function secret() {
  return process.env.AUTH_SECRET || "assankar-dev-session";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function sealed(phone: string, exp: number) {
  const payload = `${phone}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function opened(value: string | undefined, now: number) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [phone, expText, mac] = parts;
  if (!phone || !expText || !mac) return null;
  if (!/^09\d{9}$/.test(phone)) return null;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp < now) return null;

  const expected = sign(`${phone}.${expText}`);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return { phone, exp };
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function readSession() {
  await connection();
  const store = await cookies();
  return opened(store.get(sessionName)?.value, Date.now());
}

export async function readPendingPhone() {
  await connection();
  const store = await cookies();
  return opened(store.get(pendingName)?.value, Date.now())?.phone ?? null;
}

export async function rememberPhone(phone: string) {
  const store = await cookies();
  const exp = Date.now() + pendingSeconds * 1000;
  store.set(pendingName, sealed(phone, exp), cookieOptions(pendingSeconds));
}

export async function startSession(phone: string) {
  const store = await cookies();
  const exp = Date.now() + sessionSeconds * 1000;
  store.set(sessionName, sealed(phone, exp), cookieOptions(sessionSeconds));
  store.delete(pendingName);
}

export async function endSession() {
  const store = await cookies();
  store.delete(sessionName);
  store.delete(pendingName);
}
