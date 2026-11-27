import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProductPicker } from "@/components/product-picker";
import { listProducts, readChoice } from "@/lib/catalog";
import { hasProfile } from "@/lib/profile";
import { readSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "انتخاب محصول",
  robots: { index: false, follow: false },
};

export default function ProductsPage() {
  return (
    <AppShell title="انتخاب محصول" titleAs="h1" backHref="/dashboard" variant="form">
      <Suspense fallback={<div className="h-40" />}>
        <ProductGate />
      </Suspense>
    </AppShell>
  );
}

async function ProductGate() {
  const session = await readSession();
  if (!session) redirect("/register");
  if (!(await hasProfile(session.phone))) redirect("/account/profile");

  const [products, choice] = await Promise.all([listProducts(), readChoice(session.phone)]);

  if (!products.length) {
    return (
      <div className="pick-empty">
        <span className="pick-empty-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M7 8.5h10A1.5 1.5 0 0 1 18.5 10v6A1.5 1.5 0 0 1 17 17.5H7A1.5 1.5 0 0 1 5.5 16v-6A1.5 1.5 0 0 1 7 8.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path d="m8.5 14 2.2-2.2 1.8 1.8 1.1-1.1 2.4 2.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <strong>محصولی برای انتخاب نیست</strong>
        <p>با اضافه شدن محصول در پنل، عکس، عنوان و جدول دستمزد همین‌جا برای انتخاب می‌آید.</p>
      </div>
    );
  }

  const first = products[0];
  return (
    <ProductPicker
      products={products}
      initialId={choice?.productId ?? first.id}
      initialQuantity={choice?.quantity ?? first.wages[0]?.packs ?? 0}
    />
  );
}
