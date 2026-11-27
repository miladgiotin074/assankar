import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/frame";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Frame hashPrefix="/">
      <section className="band">
        <div className="wrap">
          <div className="panel rise mx-auto max-w-2xl p-6 sm:p-8">
            <p className="kicker">۴۰۴</p>
            <h1 className="title mt-4">این صفحه در دفتر آسان‌کار نیست</h1>
            <p className="copy mt-4 text-muted">
              اگر برای همکاری آمده‌اید، از صفحه اصلی ثبت‌نام کنید.
            </p>
            <Link className="btn mt-8 w-full sm:w-auto" href="/">
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </section>
    </Frame>
  );
}
