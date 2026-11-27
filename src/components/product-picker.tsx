"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitChoice, type ChoiceState } from "@/app/dashboard/products/actions";
import { faDigits, toman } from "@/lib/format";
import type { CatalogCard } from "@/lib/catalog";

const empty: ChoiceState = { error: "" };

export function ProductPicker({
  products,
  initialId,
  initialQuantity,
}: {
  products: CatalogCard[];
  initialId: string;
  initialQuantity: number;
}) {
  const [state, action, pending] = useActionState(submitChoice, empty);
  const [selected, setSelected] = useState(initialId || products[0]?.id || "");
  const [quantity, setQuantity] = useState(initialQuantity >= 1 && initialQuantity <= 3 ? initialQuantity : 1);
  const [broken, setBroken] = useState<Record<string, true>>({});
  const railRef = useRef<HTMLDivElement>(null);
  const openedOn = useRef(selected);
  const product = products.find((item) => item.id === selected) ?? products[0];

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let frame = 0;
    const sync = () => {
      const mid = rail.getBoundingClientRect().left + rail.clientWidth / 2;
      let best = "";
      let dist = Number.POSITIVE_INFINITY;
      rail.querySelectorAll<HTMLElement>("[data-id]").forEach((card) => {
        const box = card.getBoundingClientRect();
        const delta = Math.abs(box.left + box.width / 2 - mid);
        if (delta < dist) {
          dist = delta;
          best = card.dataset.id ?? "";
        }
      });
      if (best) setSelected((current) => (current === best ? current : best));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    rail.querySelector<HTMLElement>(`[data-id="${CSS.escape(openedOn.current)}"]`)?.scrollIntoView({
      inline: "center",
      block: "nearest",
    });
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
    };
  }, []);

  function focusCard(id: string) {
    setSelected(id);
    railRef.current
      ?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  function step(next: number) {
    const index = products.findIndex((item) => item.id === product?.id);
    const item = products[index + next];
    if (item) focusCard(item.id);
  }

  if (!product) return null;

  return (
    <form action={action} className="pick-form">
      <div className="pick-scroll">
        <p className="profile-lead">محصول را بکشید تا وسط بیاید، بعد تعداد را از ۱ تا ۳ انتخاب کنید.</p>

        <div
          ref={railRef}
          className="pick-rail"
          role="listbox"
          aria-label="محصولات"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              step(1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              step(-1);
            }
          }}
        >
          {products.map((item) => {
            const on = item.id === product.id;
            return (
              <button
                key={item.id}
                type="button"
                data-id={item.id}
                className={on ? "pick-card is-on" : "pick-card"}
                role="option"
                aria-selected={on}
                onClick={() => focusCard(item.id)}
              >
                <span className="pick-photo">
                  {item.image && !broken[item.id] ? (
                    <img
                      src={item.image}
                      alt=""
                      onError={() => setBroken((current) => ({ ...current, [item.id]: true }))}
                    />
                  ) : (
                    <PhotoFallback />
                  )}
                </span>
                <strong>{item.title}</strong>
                <small>{item.wages.length ? "جدول دستمزد" : "دستمزد بعداً ثبت می‌شود"}</small>
              </button>
            );
          })}
        </div>

        <div className="pick-dots" aria-hidden="true">
          {products.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === product.id ? "is-on" : undefined}
              onClick={() => focusCard(item.id)}
            />
          ))}
        </div>

        <section className="pick-panel" aria-label="جدول دستمزد">
          <h2>جدول دستمزد</h2>
          {product.wages.length ? (
            <table>
              <thead>
                <tr>
                  <th>شرح</th>
                  <th>دستمزد</th>
                </tr>
              </thead>
              <tbody>
                {product.wages.map((row, index) => (
                  <tr key={`${index}-${row.label}`}>
                    <td>{row.label}</td>
                    <td>{toman(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>برای این محصول هنوز جدول دستمزد ثبت نشده است.</p>
          )}
        </section>

        <section className="pick-panel" aria-label="تعداد">
          <h2>تعداد</h2>
          <div className="pick-qty">
            <button type="button" aria-label="بیشتر" disabled={pending || quantity >= 3} onClick={() => setQuantity((value) => Math.min(3, value + 1))}>
              +
            </button>
            <strong>
              {faDigits(String(quantity))}
              <small>قلم</small>
            </strong>
            <button type="button" aria-label="کمتر" disabled={pending || quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
              −
            </button>
          </div>
        </section>

        {state.error ? (
          <p className="text-sm font-bold leading-7 text-pine" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>

      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="quantity" value={quantity} />
      <button className="btn w-full" type="submit" disabled={pending}>
        {pending ? "در حال ثبت" : "ادامه"}
      </button>
    </form>
  );
}

function PhotoFallback() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7.5h10A1.5 1.5 0 0 1 18.5 9v6A1.5 1.5 0 0 1 17 16.5H7A1.5 1.5 0 0 1 5.5 15V9A1.5 1.5 0 0 1 7 7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M8.5 13.5 11 11l2 2 1.2-1.2 2.3 2.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
