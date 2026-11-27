import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Collection } from "mongodb";
import { collection } from "@/lib/mongo";

const scrypt = promisify(scryptCallback);
const keyLength = 32;

type UserDoc = {
  phone: string;
  passwordHash: string;
  at: Date;
};

let usersReady: Promise<Collection<UserDoc>> | null = null;

function pepper() {
  return process.env.AUTH_SECRET || "assankar-dev-session";
}

function users() {
  if (!usersReady) {
    usersReady = collection<UserDoc>("users")
      .then(async (col) => {
        await col.createIndex({ phone: 1 }, { unique: true });
        return col;
      })
      .catch((error: unknown) => {
        usersReady = null;
        throw error;
      });
  }
  return usersReady;
}

async function hashPassword(nationalId: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(`${pepper()}\0${nationalId}`, salt, keyLength)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

async function passwordMatches(nationalId: string, stored: string) {
  const [kind, saltText, keyText] = stored.split("$");
  if (kind !== "scrypt" || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, "base64url");
  const actual = (await scrypt(`${pepper()}\0${nationalId}`, Buffer.from(saltText, "base64url"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function isDuplicate(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 11000;
}

export async function hasAccount(phone: string) {
  return Boolean(await (await users()).findOne({ phone }, { projection: { _id: 1 } }));
}

export async function openAccount(phone: string, nationalId: string) {
  const col = await users();
  const existing = await col.findOne({ phone });
  if (!existing) {
    try {
      await col.insertOne({ phone, passwordHash: await hashPassword(nationalId), at: new Date() });
      return { ok: true as const };
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
  }

  const user = existing ?? (await col.findOne({ phone }));
  if (!user || !(await passwordMatches(nationalId, user.passwordHash))) {
    return { ok: false as const, error: "کد ملی برای این شماره درست نیست." };
  }
  return { ok: true as const };
}
