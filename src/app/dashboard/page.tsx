import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashScroll } from "@/components/dash-scroll";
import { logout, resetAccount } from "@/app/account/actions";
import Link from "next/link";
import { readChoices, type ChoiceItem } from "@/lib/catalog";
import { faDigits, toman } from "@/lib/format";
import { readPayment, type PaymentStatus } from "@/lib/payment";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";
import { heroFlow, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "داشبورد",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <AppShell variant="home" title="داشبورد" end={<AccountTools />}>
      <Suspense fallback={<div className="dash-fallback" />}>
        <DashboardHome />
      </Suspense>
    </AppShell>
  );
}

function AccountTools() {
  return (
    <div className="dash-tools">
      <form action={resetAccount}>
        <button type="submit" className="dash-reset">
          ریست
        </button>
      </form>
      <form action={logout}>
        <button type="submit" className="dash-logout" aria-label="خروج">
          خروج
        </button>
      </form>
    </div>
  );
}

async function DashboardHome() {
  const session = await readSession();
  if (!session) redirect("/register");

  const phone = faDigits(session.phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"));
  const ready = await hasProfile(session.phone);
  const choices = ready ? await readChoices(session.phone) : [];
  const chosen = choices.length > 0;
  const payment = chosen ? await readPayment(session.phone) : null;
  const payStatus = payment?.status ?? "none";
  const paid = payStatus === "approved";
  const stages = workStages(ready, choices, payStatus);

  return (
    <div className="dash">
      <DashScroll />
      <section className="dash-hero">
        <p className="dash-kicker">حساب همکاری</p>
        <h1>داشبورد</h1>
        <p className="dash-phone" dir="ltr">
          {phone}
        </p>
      </section>

      <div className="dash-sheet">
        {chosen && payStatus === "pending" && payment ? (
          <section id="dash-next" className="dash-wait" aria-label="وضعیت پرداخت">
            <div className="dash-wait-head">
              <span className="dash-wait-icon" aria-hidden="true">
                <span className="dash-wait-pulse" />
              </span>
              <div className="dash-wait-copy">
                <p className="dash-wait-kicker">وضعیت واریز</p>
                <strong>منتظر تأیید ادمین</strong>
                <p>
                  فیش شما دریافت شد و در صف بررسی پشتیبانی است. تا تأیید نهایی لازم نیست دوباره واریز کنید.
                </p>
              </div>
              <span className="dash-wait-badge">در صف بررسی</span>
            </div>

            <ol className="dash-wait-track" aria-label="مراحل بررسی فیش">
              <li className="is-done">
                <span aria-hidden="true" />
                <div>
                  <strong>فیش ارسال شد</strong>
                  <small>عکس واریز روی سرور ذخیره شده است.</small>
                </div>
              </li>
              <li className="is-now">
                <span aria-hidden="true" />
                <div>
                  <strong>بررسی ادمین</strong>
                  <small>پشتیبانی فیش و مبلغ را چک می‌کند.</small>
                </div>
              </li>
              <li>
                <span aria-hidden="true" />
                <div>
                  <strong>تأیید و ادامه</strong>
                  <small>بعد از تأیید، مرحلهٔ بعد باز می‌شود.</small>
                </div>
              </li>
            </ol>

            <div className="dash-wait-meta">
              <div>
                <span>مبلغ ثبت‌شده</span>
                <strong>{toman(payment.amount)}</strong>
              </div>
              <div>
                <span>زمان ارسال</span>
                <strong>{faDigits(formatPayTime(payment.at))}</strong>
              </div>
            </div>

            <div className="dash-wait-actions">
              <Link href="/dashboard/payment" className="dash-wait-primary">
                مشاهدهٔ فیش
              </Link>
              <a
                className="dash-wait-secondary"
                href={`https://t.me/${site.telegramUser}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                پیام به پشتیبانی
              </a>
            </div>
          </section>
        ) : null}

        {chosen && payStatus === "rejected" ? (
          <section id="dash-next" className="dash-pay-status is-bad" aria-label="وضعیت پرداخت">
            <span className="dash-pay-status-mark" aria-hidden="true" />
            <div>
              <strong>نیاز به ارسال دوباره فیش</strong>
              <p>فیش قبلی تأیید نشد. لطفاً عکس واضح‌تری از واریز درست بفرستید.</p>
              <Link href="/dashboard/payment" className="dash-pay-status-link">
                ارسال فیش جدید
              </Link>
            </div>
          </section>
        ) : null}

        {chosen && paid ? (
          <section id="dash-next" className="dash-pay-status is-ok" aria-label="وضعیت پرداخت">
            <span className="dash-pay-status-mark" aria-hidden="true" />
            <div>
              <strong>واریز تأیید شد</strong>
              <p>هزینهٔ ثبت‌نام تأیید شده است و می‌توانید مرحلهٔ بعد را ادامه دهید.</p>
            </div>
          </section>
        ) : null}

        {chosen ? (
          payStatus === "none" || payStatus === "rejected" ? (
            <div id={payStatus === "none" ? "dash-next" : undefined} className="dash-cta-wrap is-violet">
              <Link href="/dashboard/payment" className="dash-cta is-violet">
                <span className="dash-cta-no" aria-hidden="true">
                  ۳
                </span>
                <span>
                  <span className="dash-cta-kicker">مرحله بعد</span>
                  <strong>واریز هزینهٔ ثبت‌نام</strong>
                  <small>
                    {payStatus === "rejected"
                      ? "فیش قبلی رد شد؛ دوباره واریز و ارسال کنید."
                      : "مبلغ را واریز کنید و عکس فیش را بفرستید."}
                  </small>
                </span>
                <span className="dash-cta-go">
                  واریز
                  <Chevron />
                </span>
              </Link>
            </div>
          ) : null
        ) : ready ? (
          <div id="dash-next" className="dash-cta-wrap is-amber">
            <Link href="/dashboard/products" className="dash-cta is-amber">
              <span className="dash-cta-no" aria-hidden="true">
                ۲
              </span>
              <span>
                <span className="dash-cta-kicker">مرحله بعد</span>
                <strong>انتخاب محصول</strong>
                <small>یک تا سه محصول را با تعداد بسته انتخاب کنید.</small>
              </span>
              <span className="dash-cta-go">
                انتخاب
                <Chevron />
              </span>
            </Link>
          </div>
        ) : (
          <div id="dash-next" className="dash-cta-wrap">
            <Link href="/account/profile" className="dash-cta">
              <span className="dash-cta-no" aria-hidden="true">
                ۱
              </span>
              <span>
                <span className="dash-cta-kicker">اولین مرحله</span>
                <strong>تکمیل ثبت‌نام</strong>
                <small>نام، شماره کارت، تاریخ تولد و آدرس</small>
              </span>
              <span className="dash-cta-go">
                شروع
                <Chevron />
              </span>
            </Link>
          </div>
        )}

        {chosen ? (
          <section className="dash-picks" aria-label="محصولات انتخاب‌شده">
            <div className="dash-picks-head">
              <div>
                <p className="dash-picks-kicker">انتخاب شما</p>
                <h2>محصولات انتخاب‌شده</h2>
                <p className="dash-picks-count">
                  {faDigits(String(choices.length))} محصول با تعداد بسته ثبت شده است.
                </p>
              </div>
              <Link href="/dashboard/products" className="dash-picks-edit">
                ویرایش
              </Link>
            </div>
            <ul>
              {choices.map((item, index) => (
                <li key={item.productId}>
                  <span className="dash-picks-thumb" aria-hidden="true">
                    {item.image ? <img src={item.image} alt="" /> : <span>{faDigits(String(index + 1))}</span>}
                    <em>{faDigits(String(index + 1))}</em>
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.label}</p>
                    <b>{toman(item.amount)}</b>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="dash-flow" aria-label="مراحل همکاری">
          <h2>مراحل همکاری</h2>
          <ol>
            {stages.map((step, index) => (
              <li key={step.title} className={stageClass(index, ready, chosen, paid)}>
                <span className="dash-no">{faDigits(String(index + 1))}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <a className="dash-help" href={`https://t.me/${site.telegramUser}`} target="_blank" rel="noopener noreferrer">
          <span>
            <strong>پشتیبانی</strong>
            <small>تلگرام، ۲۴ ساعته</small>
          </span>
          <Chevron />
        </a>
      </div>
    </div>
  );
}

function formatPayTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function workStages(ready: boolean, choices: ChoiceItem[], payStatus: PaymentStatus | "none") {
  const chosen = choices.length > 0;
  return [
    { title: "تکمیل ثبت‌نام", text: "نام، شماره کارت، تاریخ تولد و آدرس محل سکونت." },
    {
      title: "انتخاب محصول",
      text: !ready
        ? "بعد از تکمیل ثبت‌نام باز می‌شود."
        : chosen
          ? `${faDigits(String(choices.length))} محصول با تعداد بسته ثبت شده است.`
          : "یک تا سه محصول را با تعداد بسته انتخاب کنید.",
    },
    {
      title: "واریز هزینهٔ ثبت‌نام",
      text: !chosen
        ? "بعد از انتخاب محصول باز می‌شود."
        : payStatus === "approved"
          ? "واریز تأیید شده است."
          : payStatus === "pending"
            ? "فیش در صف بررسی ادمین است؛ فعلاً صبر کنید."
            : payStatus === "rejected"
              ? "فیش رد شد؛ ارسال دوباره لازم است."
              : "مبلغ را واریز کنید و عکس فیش را بفرستید.",
    },
    ...heroFlow.slice(1),
  ];
}

function stageClass(index: number, ready: boolean, chosen: boolean, paid: boolean) {
  if (!ready) return index === 0 ? "is-open" : "is-wait";
  if (!chosen) {
    if (index === 0) return "is-done";
    if (index === 1) return "is-open";
    return "is-wait";
  }
  if (!paid) {
    if (index <= 1) return "is-done";
    if (index === 2) return "is-open";
    return "is-wait";
  }
  if (index <= 2) return "is-done";
  if (index === 3) return "is-open";
  return "is-wait";
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M14 6.5 8 12l6 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
