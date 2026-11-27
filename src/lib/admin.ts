import { readChoices } from "@/lib/catalog";
import {
  countPaymentsByStatus,
  listPayments,
  paymentKindLabel,
  paymentSeries,
  readPayment,
  type PaymentKind,
  type PaymentRecord,
  type PaymentStatus,
} from "@/lib/payment";
import { listProfiles, readProfile, searchProfiles, type ProfileRecord } from "@/lib/profile";
import { faDigits, toman } from "@/lib/format";

export type AdminPaymentRow = {
  phone: string;
  phoneDisplay: string;
  amount: number;
  amountLabel: string;
  status: PaymentStatus;
  kind: PaymentKind;
  kindLabel: string;
  fileId: string;
  at: string;
  reviewedAt: string;
  name: string;
  choiceCount: number;
};

export type AdminPartnerRow = {
  phone: string;
  phoneDisplay: string;
  name: string;
  hasChoices: boolean;
  choiceCount: number;
  choicesAmountLabel: string;
  paymentStatus: PaymentStatus | "none";
  insuranceStatus: PaymentStatus | "none";
  guaranteeStatus: PaymentStatus | "none";
  shippingStatus: PaymentStatus | "none";
  warehouseStatus: PaymentStatus | "none";
  stage: string;
};

export type PartnerFilter = "all" | "pending" | "approved" | "rejected" | "none" | "no-choices";

export type AdminDayPoint = {
  label: string;
  submitted: number;
  approved: number;
  rejected: number;
};

export type AdminStats = {
  pendingPayments: number;
  approvedToday: number;
  approvedTotal: number;
  rejectedTotal: number;
  partners: number;
  partnersWithoutChoices: number;
  recent: AdminPaymentRow[];
  series: AdminDayPoint[];
};

function nameOf(profile: ProfileRecord | null | undefined) {
  if (!profile) return "بدون نام";
  const full = `${profile.firstName} ${profile.lastName}`.trim();
  return full || "بدون نام";
}

function phoneDisplay(phone: string) {
  return faDigits(phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"));
}

function iso(value: Date | undefined) {
  return value ? new Date(value).toISOString() : "";
}

function toPaymentRow(
  payment: PaymentRecord,
  profile: ProfileRecord | null,
  choiceCount: number,
): AdminPaymentRow {
  return {
    phone: payment.phone,
    phoneDisplay: phoneDisplay(payment.phone),
    amount: payment.amount,
    amountLabel: toman(payment.amount),
    status: payment.status,
    kind: payment.kind,
    kindLabel: paymentKindLabel(payment.kind),
    fileId: payment.fileId,
    at: iso(payment.at),
    reviewedAt: iso(payment.reviewedAt),
    name: nameOf(profile),
    choiceCount,
  };
}

async function hydratePayment(payment: PaymentRecord) {
  const [profile, choices] = await Promise.all([readProfile(payment.phone), readChoices(payment.phone)]);
  return toPaymentRow(payment, profile, choices.length);
}

export async function adminStats(): Promise<AdminStats> {
  const counts = await countPaymentsByStatus();
  const profiles = await listProfiles(200);
  let withoutChoices = 0;
  for (const profile of profiles) {
    const choices = await readChoices(profile.phone);
    if (!choices.length) withoutChoices += 1;
  }
  const pendingList = await listPayments({ status: "pending", limit: 6 });
  const [recent, series] = await Promise.all([
    Promise.all(pendingList.map((payment) => hydratePayment(payment))),
    paymentSeries(7),
  ]);
  return {
    pendingPayments: counts.pending,
    approvedToday: counts.approvedToday,
    approvedTotal: counts.approved,
    rejectedTotal: counts.rejected,
    partners: profiles.length,
    partnersWithoutChoices: withoutChoices,
    recent,
    series,
  };
}

export async function adminListPayments(
  status: PaymentStatus | "all" = "pending",
  q = "",
  kind: PaymentKind | "all" = "all",
) {
  const query = q.trim();
  const digits = query.replace(/\D/g, "");
  const byName = /[^\d\s]/.test(query);
  let payments: PaymentRecord[];
  if (byName) {
    const profiles = await searchProfiles(query, 40);
    const phones = profiles.map((profile) => profile.phone);
    const named = phones.length ? await listPayments({ status, kind, phones, limit: 50 }) : [];
    const phoned = digits.length >= 3 ? await listPayments({ status, kind, q: digits, limit: 50 }) : [];
    const merged = new Map<string, PaymentRecord>();
    for (const item of [...named, ...phoned]) merged.set(`${item.phone}:${item.kind}`, item);
    payments = [...merged.values()]
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 50);
  } else {
    payments = await listPayments({ status, kind, q: query, limit: 50 });
  }
  return Promise.all(payments.map((payment) => hydratePayment(payment)));
}

export async function adminPaymentDetail(phone: string, kind: PaymentKind = "registration") {
  const payment = await readPayment(phone, kind);
  if (!payment) return null;
  const profile = await readProfile(phone);
  const choices = await readChoices(phone);
  return {
    payment: toPaymentRow(payment, profile, choices.length),
    profile: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          card: profile.card,
          address: profile.address,
          birth: `${profile.birthYear}/${profile.birthMonth}/${profile.birthDay}`,
        }
      : null,
    choices: choices.map((item) => ({
      productId: item.productId,
      title: item.title,
      label: item.label,
      amountLabel: toman(item.amount),
      image: item.image,
    })),
    receiptUrl: payment.fileId ? `/api/admin/receipts/${payment.fileId}` : "",
  };
}

export async function adminListPartners(q = "", stageFilter: PartnerFilter = "all") {
  const profiles = q.trim() ? await searchProfiles(q, 80) : await listProfiles(80);
  const rows: AdminPartnerRow[] = [];
  for (const profile of profiles) {
    const choices = await readChoices(profile.phone);
    const payment = await readPayment(profile.phone, "registration");
    const insurance = await readPayment(profile.phone, "insurance");
    const guarantee = await readPayment(profile.phone, "guarantee");
    const shipping = await readPayment(profile.phone, "shipping");
    const warehouse = await readPayment(profile.phone, "warehouse");
    const paymentStatus = payment?.status ?? "none";
    const insuranceStatus = insurance?.status ?? "none";
    const guaranteeStatus = guarantee?.status ?? "none";
    const shippingStatus = shipping?.status ?? "none";
    const warehouseStatus = warehouse?.status ?? "none";
    let stage = "پروفایل";
    if (warehouseStatus === "approved") stage = "انبار تأیید شده";
    else if (warehouseStatus === "pending") stage = "منتظر تأیید انبار";
    else if (warehouseStatus === "rejected") stage = "فیش انبار رد شده";
    else if (shippingStatus === "approved") stage = "باربری تأیید شده";
    else if (shippingStatus === "pending") stage = "منتظر تأیید باربری";
    else if (shippingStatus === "rejected") stage = "فیش باربری رد شده";
    else if (guaranteeStatus === "approved") stage = "ضمانت تأیید شده";
    else if (guaranteeStatus === "pending") stage = "منتظر تأیید ضمانت";
    else if (guaranteeStatus === "rejected") stage = "فیش ضمانت رد شده";
    else if (insuranceStatus === "approved") stage = "بیمه تأیید شده";
    else if (insuranceStatus === "pending") stage = "منتظر تأیید بیمه";
    else if (insuranceStatus === "rejected") stage = "فیش بیمه رد شده";
    else if (paymentStatus === "approved") stage = "واریز ثبت‌نام تأیید شده";
    else if (paymentStatus === "pending") stage = "منتظر تأیید فیش";
    else if (paymentStatus === "rejected") stage = "فیش رد شده";
    else if (choices.length) stage = "انتخاب محصول";
    const amount = choices.reduce((sum, item) => sum + item.amount, 0);
    rows.push({
      phone: profile.phone,
      phoneDisplay: phoneDisplay(profile.phone),
      name: nameOf(profile),
      hasChoices: choices.length > 0,
      choiceCount: choices.length,
      choicesAmountLabel: amount ? toman(amount) : "",
      paymentStatus,
      insuranceStatus,
      guaranteeStatus,
      shippingStatus,
      warehouseStatus,
      stage,
    });
  }
  if (stageFilter === "no-choices") return rows.filter((row) => !row.hasChoices);
  if (stageFilter === "all") return rows;
  return rows.filter((row) => row.paymentStatus === stageFilter);
}

export async function adminPartnerDetail(phone: string) {
  const profile = await readProfile(phone);
  if (!profile) return null;
  const choices = await readChoices(phone);
  const payment = await readPayment(phone, "registration");
  const insurance = await readPayment(phone, "insurance");
  const guarantee = await readPayment(phone, "guarantee");
  const shipping = await readPayment(phone, "shipping");
  const warehouse = await readPayment(phone, "warehouse");
  return {
    phone: profile.phone,
    phoneDisplay: phoneDisplay(profile.phone),
    name: nameOf(profile),
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      card: profile.card,
      address: profile.address,
      birth: `${profile.birthYear}/${profile.birthMonth}/${profile.birthDay}`,
    },
    choices: choices.map((item) => ({
      productId: item.productId,
      title: item.title,
      label: item.label,
      amountLabel: toman(item.amount),
      image: item.image,
    })),
    payment: payment ? toPaymentRow(payment, profile, choices.length) : null,
    insurance: insurance ? toPaymentRow(insurance, profile, choices.length) : null,
    guarantee: guarantee ? toPaymentRow(guarantee, profile, choices.length) : null,
    shipping: shipping ? toPaymentRow(shipping, profile, choices.length) : null,
    warehouse: warehouse ? toPaymentRow(warehouse, profile, choices.length) : null,
    receiptUrl: payment?.fileId ? `/api/admin/receipts/${payment.fileId}` : "",
    insuranceReceiptUrl: insurance?.fileId ? `/api/admin/receipts/${insurance.fileId}` : "",
    guaranteeReceiptUrl: guarantee?.fileId ? `/api/admin/receipts/${guarantee.fileId}` : "",
    shippingReceiptUrl: shipping?.fileId ? `/api/admin/receipts/${shipping.fileId}` : "",
    warehouseReceiptUrl: warehouse?.fileId ? `/api/admin/receipts/${warehouse.fileId}` : "",
  };
}
