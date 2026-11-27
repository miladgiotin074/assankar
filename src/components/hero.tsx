import Link from "next/link";
import { heroCoverage, heroFlow, site, wageNote } from "@/lib/site";
import { faNum } from "@/lib/format";

const lags = ["lag-1", "lag-2", "lag-3", "lag-4"] as const;

export function Hero() {
  return (
    <section className="relative" aria-labelledby="hero-title">
      <div className="dots pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_86%)]" />
      <div className="wrap relative pt-8 pb-2 lg:pt-14 lg:pb-4">
        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col">
            <p className="kicker rise">همکاری خانگی برای ۱۸ سال به بالا</p>
            <h1 id="hero-title" className="display mt-4 text-balance">
              کار بسته‌بندی در منزل، از انتخاب محصول تا واریز حقوق
            </h1>
            <p className="copy rise lag-2 mt-5 text-muted">
              بعد از ثبت‌نام، خودتان ۱ تا ۳ قلم کالا را انتخاب می‌کنید. تیم باربری {site.name} تا ۳ روز بعد
              محصول را همراه فیلم آموزشی به درب منزل می‌آورد. دستمزد پیش از آنکه کالا را به تیم جمع‌آوری
              بسپارید پرداخت می‌شود.
            </p>
            <Link className="btn rise lag-3 mt-6 w-full sm:w-auto sm:self-start lg:mt-auto" href="/register">
              ثبت‌نام و ورود
            </Link>
          </div>

          <aside className="rise lag-2 h-full" aria-label="آمار همکاری">
            <HeroBoard />
          </aside>
        </div>

        <ol className="flow mt-8 lg:mt-12">
          {heroFlow.map((step, index) => (
            <li key={step.title} className={`flow-item rise ${lags[index] ?? "lag-4"}`}>
              <span className="flow-num">{faNum(index + 1)}</span>
              <div className="min-w-0">
                <p className="font-extrabold">{step.title}</p>
                <p className="mt-1 text-sm leading-7 text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function HeroBoard() {
  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="brand-bar" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-extrabold">تابلوی همکاری</p>
          <p className="rounded-full bg-paper-deep px-3 py-1 text-xs font-bold text-pine">آمار مدل کار</p>
        </div>

        <div className="mt-5 flex flex-1 flex-col justify-center gap-5">
          <div
            className="mx-auto grid size-32 shrink-0 place-items-center rounded-full bg-pine p-2.5 shadow-[0_12px_26px_rgba(12,77,134,0.16)]"
            aria-hidden="true"
          >
            <div className="grid size-full place-items-center rounded-full bg-white text-center">
              <div>
                <p className="text-4xl font-extrabold leading-none">۱۸+</p>
                <p className="mt-1 text-xs font-bold text-muted">حداقل سن</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-wax px-4 py-4 text-white">
            <p className="text-sm font-bold text-white/80">نکته دستمزد</p>
            <p className="mt-2 text-base font-extrabold leading-7">{wageNote}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          {heroCoverage.map((item) => (
            <div key={item.label} className="rounded-2xl border border-line bg-paper-deep p-3">
              <dt className="text-xs font-bold leading-5 text-muted">
                <span className="mb-2 grid size-8 place-items-center rounded-xl bg-white">
                  {item.icon === "box" ? <BoxIcon /> : <MapIcon />}
                </span>
                {item.label}
              </dt>
              <dd className="mt-2 text-base font-extrabold leading-7 text-pine">{item.value}</dd>
              <p className="mt-1 text-xs leading-5 text-muted">{item.text}</p>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-pine" aria-hidden="true">
      <path d="M4.5 8.2 12 4.8l7.5 3.4v7.6L12 19.2 4.5 15.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 11.2 19.5 8.2M12 11.2v8M12 11.2 4.5 8.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-wax" aria-hidden="true">
      <path d="M12 20s5-4.4 5-8.2A5 5 0 0 0 7 11.8C7 15.6 12 20 12 20Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="11.5" r="1.6" fill="currentColor" />
    </svg>
  );
}
