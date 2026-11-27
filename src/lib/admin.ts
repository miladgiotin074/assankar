import { readChoices } from "@/lib/catalog";
import { countPaymentsByStatus, listPayments, readPayment, type PaymentRecord, type PaymentStatus } from "@/lib/payment";
import { listProfiles, readProfile, searchProfiles, type ProfileRecord } from "@/lib/profile";
import { faDigits, toman } from "@/lib/format";

export type AdminPaymentRow = {
  phone: string;
  phoneDisplay: string;
  amount: number;
  amountLabel: string;
  status: PaymentStatus;
  fileId: string;
  at: string;
  reviewedAt: string;
  name: string;
};

export type AdminPartnerRow = {
  phone: string;
  phoneDisplay: string;
  name: string;
  hasChoices: boolean;
  paymentStatus: PaymentStatus | "none";
  stage: string;
};

export type AdminStats = {
  pendingPayments: number;
  approvedToday: number;
  approvedTotal: number;
  rejectedTotal: number;
  partners: number;
  partnersWithoutChoices: number;
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

function toPaymentRow(payment: PaymentRecord, profile: ProfileRecord | null): AdminPaymentRow {
  return {
    phone: payment.phone,
    phoneDisplay: phoneDisplay(payment.phone),
    amount: payment.amount,
    amountLabel: toman(payment.amount),
    status: payment.status,
    fileId: payment.fileId,
    at: iso(payment.at),
    reviewedAt: iso(payment.reviewedAt),
    name: nameOf(profile),
  };
}

export async function adminStats(): Promise<AdminStats> {
  const counts = await countPaymentsByStatus();
  const profiles = await listProfiles(200);
  let withoutChoices = 0;
  for (const profile of profiles) {
    const choices = await readChoices(profile.phone);
    if (!choices.length) withoutChoices += 1;
  }
  return {
    pendingPayments: counts.pending,
    approvedToday: counts.approvedToday,
    approvedTotal: counts.approved,
    rejectedTotal: counts.rejected,
    partners: profiles.length,
    partnersWithoutChoices: withoutChoices,
  };
}

export async function adminListPayments(status: PaymentStatus | "all" = "pending", q = "") {
  const payments = await listPayments({ status, q, limit: 50 });
  const rows: AdminPaymentRow[] = [];
  for (const payment of payments) {
    const profile = await readProfile(payment.phone);
    rows.push(toPaymentRow(payment, profile));
  }
  return rows;
}

export async function adminPaymentDetail(phone: string) {
  const payment = await readPayment(phone);
  if (!payment) return null;
  const profile = await readProfile(phone);
  const choices = await readChoices(phone);
  return {
    payment: toPaymentRow(payment, profile),
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

export async function adminListPartners(q = "") {
  const profiles = q.trim() ? await searchProfiles(q, 50) : await listProfiles(50);
  const rows: AdminPartnerRow[] = [];
  for (const profile of profiles) {
    const choices = await readChoices(profile.phone);
    const payment = await readPayment(profile.phone);
    const paymentStatus = payment?.status ?? "none";
    let stage = "پروفایل";
    if (paymentStatus === "approved") stage = "واریز تأیید شده";
    else if (paymentStatus === "pending") stage = "منتظر تأیید فیش";
    else if (paymentStatus === "rejected") stage = "فیش رد شده";
    else if (choices.length) stage = "انتخاب محصول";
    rows.push({
      phone: profile.phone,
      phoneDisplay: phoneDisplay(profile.phone),
      name: nameOf(profile),
      hasChoices: choices.length > 0,
      paymentStatus,
      stage,
    });
  }
  return rows;
}

export async function adminPartnerDetail(phone: string) {
  const profile = await readProfile(phone);
  if (!profile) return null;
  const choices = await readChoices(phone);
  const payment = await readPayment(phone);
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
    payment: payment ? toPaymentRow(payment, profile) : null,
    receiptUrl: payment?.fileId ? `/api/admin/receipts/${payment.fileId}` : "",
  };
}
