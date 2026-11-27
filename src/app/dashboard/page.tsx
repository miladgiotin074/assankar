import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { logout } from "@/app/account/actions";
import Link from "next/link";
import { faDigits } from "@/lib/format";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";
import { heroFlow, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "داشبورد",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <AppShell variant="home" title="داشبورد" end={<LogoutButton />}>
      <Suspense fallback={<div className="dash-fallback" />}>
        <DashboardHome />
      </Suspense>
    </AppShell>
  );
}

function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="dash-logout">
        <span>خروج</span>
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h6A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 10 18.5V17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M13 12H4m0 0 2.5-2.5M4 12l2.5 2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}

async function DashboardHome() {
  const session = await readSession();
  if (!session) redirect("/register");

  const phone = faDigits(session.phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"));
  const ready = await hasProfile(session.phone);
  const stages = workStages(ready);

  return (
    <div className="dash">
      <section className="dash-hero">
        <p className="dash-kicker">حساب همکاری</p>
        <h1>داشبورد</h1>
        <p className="dash-phone" dir="ltr">
          {phone}
        </p>
      </section>

      <div className="dash-sheet">
        {ready ? (
          <div className="dash-cta-wrap is-amber">
            <section className="dash-cta is-amber" aria-label="مرحله باز">
              <span className="dash-cta-no" aria-hidden="true">
                ۲
              </span>
              <span>
                <span className="dash-cta-kicker">مرحله بعد</span>
                <strong>انتخاب محصول</strong>
                <small>از ۱ تا ۳ قلم کالا را خودتان انتخاب می‌کنید.</small>
              </span>
              <span className="dash-cta-go">
                باز شد
                <Chevron />
              </span>
            </section>
          </div>
        ) : (
          <div className="dash-cta-wrap">
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

        <section className="dash-flow" aria-label="مراحل همکاری">
          <h2>مراحل همکاری</h2>
          <ol>
            {stages.map((step, index) => (
              <li key={step.title} className={stageClass(index, ready)}>
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

function workStages(ready: boolean) {
  return [
    { title: "تکمیل ثبت‌نام", text: "نام، شماره کارت، تاریخ تولد و آدرس محل سکونت." },
    {
      title: "انتخاب محصول",
      text: ready ? "از ۱ تا ۳ قلم کالا را خودتان انتخاب می‌کنید." : "بعد از تکمیل ثبت‌نام باز می‌شود.",
    },
    ...heroFlow.slice(1),
  ];
}

function stageClass(index: number, ready: boolean) {
  if (!ready) return index === 0 ? "is-open" : "is-wait";
  if (index === 0) return "is-done";
  if (index === 1) return "is-open";
  return "is-wait";
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M14 6.5 8 12l6 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
