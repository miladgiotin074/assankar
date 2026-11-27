export type ApplyPath = "home" | "brand";

export type ApplyPayload = {
  name: string;
  city: string;
  phone: string;
  path: ApplyPath;
  note: string;
};

export type ApplyField = "name" | "city" | "phone" | "path" | "note" | "consent";

export type ApplyIssue = {
  ok: false;
  message: string;
  field: ApplyField;
};

const personName = /^[\u0600-\u06FF\u200ca-zA-Z\s-]{2,60}$/;
const hasLetter = /[\u0600-\u06FFa-zA-Z]/;

export function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizePhone(value: string) {
  let phone = toEnglishDigits(value).replace(/[\s\-()]/g, "");
  if (phone.startsWith("+98")) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith("0098")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("98") && phone.length === 12) phone = `0${phone.slice(2)}`;
  return phone;
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function validateApply(input: {
  name?: unknown;
  city?: unknown;
  phone?: unknown;
  path?: unknown;
  note?: unknown;
  consent?: unknown;
}): ApplyIssue | { ok: true; value: ApplyPayload } {
  const name = asText(input.name).replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  const city = asText(input.city).replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  const phone = normalizePhone(asText(input.phone));
  const note = asText(input.note).replace(/[<>]/g, "").trim();
  const path = input.path;

  if (!personName.test(name) || !hasLetter.test(name)) {
    return { ok: false, field: "name", message: "نام را با حروف و حداقل دو نویسه بنویسید." };
  }
  if (!personName.test(city) || !hasLetter.test(city)) {
    return { ok: false, field: "city", message: "شهر را بنویسید." };
  }
  if (!/^09\d{9}$/.test(phone)) {
    return { ok: false, field: "phone", message: "شماره موبایل را با ۰۹ و یازده رقم بنویسید." };
  }
  if (path !== "home" && path !== "brand") {
    return { ok: false, field: "path", message: "مشخص کنید همکار خانگی هستید یا سفارش برند دارید." };
  }
  if (note.length > 500) {
    return { ok: false, field: "note", message: "توضیح را کوتاه‌تر از پانصد نویسه بنویسید." };
  }
  if (input.consent !== true) {
    return {
      ok: false,
      field: "consent",
      message: "تأیید کنید که شرایط همکاری را خوانده‌اید.",
    };
  }

  return { ok: true, value: { name, city, phone, path, note } };
}
