import Link from "next/link";
import { nav, site } from "@/lib/site";
import { Seal } from "@/components/marks";

export function Footer({ hashPrefix = "" }: { hashPrefix?: string }) {
  const href = (id: string) => `${hashPrefix}#${id}`;

  return (
    <footer className="bg-pine-deep text-cream">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.3fr_0.7fr_0.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <Seal />
            <div>
              <p className="text-xs font-bold tracking-[0.2em] whitespace-nowrap text-foam">{site.latin}</p>
              <p className="text-xl font-extrabold whitespace-nowrap">{site.name}</p>
            </div>
          </div>
          <p className="copy mt-5 max-w-md text-cream/75">
            آسان‌کار {site.keyword} را برای افراد ۱۸ سال به بالا انجام می‌دهد. کالا را خود همکار انتخاب
            می‌کند، تیم باربری آن را به درب منزل می‌رساند و تیم جمع‌آوری برای دریافت هماهنگ می‌کند.
          </p>
        </div>

        <nav aria-label="پاورقی">
          <p className="font-bold text-foam">نقشه صفحه</p>
          <ul className="mt-4 space-y-2">
            {nav.map((item) => (
              <li key={item.id}>
                <a className="text-cream/80 transition-colors hover:text-cream" href={href(item.id)}>
                  {item.label}
                </a>
              </li>
            ))}
              <li>
                <Link className="text-cream/80 transition-colors hover:text-cream" href="/privacy">
                  حریم خصوصی
                </Link>
              </li>
          </ul>
        </nav>

        <address className="not-italic">
          <p className="font-bold text-foam">تماس</p>
          <p className="mt-4">
            <a className="text-end text-lg font-bold" href={`tel:${site.phoneTel}`} dir="ltr">
              {site.phoneDisplay}
            </a>
          </p>
          <p className="mt-2 text-cream/70">پشتیبانی تلفنی، ۲۴ ساعته</p>
          <p className="mt-2">
            <a className="text-cream/80 transition-colors hover:text-cream" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </p>
          <p className="mt-3 text-cream/70">
            {site.city} · هماهنگی حضوری فقط با وقت قبلی
          </p>
        </address>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-cream/60">
          <p>
            © {site.year} {site.name}. جزئیات هر همکاری فقط در قرارداد همان سفارش معتبر است.
          </p>
          <a href="#main" className="transition-colors hover:text-cream">
            بازگشت به بالا
          </a>
        </div>
      </div>
    </footer>
  );
}
