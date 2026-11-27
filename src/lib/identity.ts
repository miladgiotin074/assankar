import { normalizePhone, toEnglishDigits } from "@/lib/apply";

export type AuthState = { error: string };

export function normalizeNationalId(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "");
}

export function isValidNationalId(value: string) {
  if (!/^\d{10}$/.test(value)) return false;
  if (/^(\d)\1{9}$/.test(value)) return false;

  const digits = value.split("").map(Number);
  const sum = digits.slice(0, 9).reduce((total, digit, index) => total + digit * (10 - index), 0);
  const remainder = sum % 11;
  const check = remainder < 2 ? remainder : 11 - remainder;
  return digits[9] === check;
}

export function isValidMobile(value: string) {
  return /^09\d{9}$/.test(normalizePhone(value));
}
