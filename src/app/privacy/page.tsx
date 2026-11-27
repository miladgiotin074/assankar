import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/frame";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: `اطلاعاتی که ${site.name} برای هماهنگی ${site.keyword} می‌گیرد و شیوه استفاده از آن.`,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `حریم خصوصی | ${site.name}`,
    description: `اطلاعاتی که ${site.name} برای هماهنگی همکاری می‌گیرد و شیوه استفاده از آن.`,
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <Frame hashPrefix="/">
      <article className="band">
        <div className="wrap max-w-3xl">
          <nav aria-label="مسیر" className="text-sm text-muted">
            <Link href="/" className="font-bold text-pine">
              خانه
            </Link>
            <span aria-hidden="true"> / </span>
            <span>حریم خصوصی</span>
          </nav>
          <h1 className="title mt-6">حریم خصوصی درخواست‌ها</h1>
          <div className="copy mt-6 space-y-5 text-muted">
            <p>
              این صفحه توضیح می‌دهد {site.name} با اطلاعاتی که در فرم «{site.keyword}» می‌نویسید چه
              می‌کند.
            </p>
            <p>
              فرم نام، شهر، شماره موبایل، نوع درخواست (همکار خانگی یا سفارش برند) و توضیح اختیاری را
              می‌گیرد. این اطلاعات برای فهمیدن باز بودن مسیر جمع‌آوری و هماهنگی همان درخواست است.
            </p>
            <p>
              داده‌ها فروخته نمی‌شود و برای تبلیغات دیگران به کار نمی‌رود.
            </p>
            <p>
              برای اصلاح یا حذف درخواست، با همان شماره‌ای که ثبت کرده‌اید به دفتر زنگ بزنید یا به{" "}
              <a className="font-bold text-pine" href={`mailto:${site.email}`}>
                {site.email}
              </a>{" "}
              بنویسید و شماره پیگیری را بگویید.
            </p>
          </div>
        </div>
      </article>
    </Frame>
  );
}
