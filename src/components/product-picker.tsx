"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitChoice, type ChoiceState } from "@/app/dashboard/products/actions";
import { toman } from "@/lib/format";
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
  const [quantity, setQuantity] = useState(initialQuantity);
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

  useEffect(() => {
    if (!product || product.wages.some((row) => row.packs === quantity)) return;
    setQuantity(product.wages[0]?.packs ?? 0);
  }, [product, quantity]);

  if (!product) return null;
  const wage = product.wages.find((row) => row.packs === quantity) ?? product.wages[0];

  return (
    <form action={action} className="pick-form">
      <div className="pick-scroll">
        <p className="profile-lead">محصول را بکشید تا وسط بیاید، بعد تعداد بسته را از جدول دستمزد انتخاب کنید.</p>

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

        {product.note ? <p className="pick-note">{product.note}</p> : null}

        <section className="pick-panel" aria-label="جدول دستمزد">
          <h2>تعداد و دستمزد</h2>
          {product.wages.length ? (
            <div className="pick-wages" role="radiogroup" aria-label="تعداد بسته">
              {product.wages.map((row) => {
                const on = row.packs === wage?.packs;
                return (
                  <button
                    key={row.packs}
                    type="button"
                    className={on ? "is-on" : undefined}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setQuantity(row.packs)}
                  >
                    <span>{row.label}</span>
                    <strong>{toman(row.amount)}</strong>
                  </button>
                );
              })}
            </div>
          ) : (
            <p>برای این محصول هنوز جدول دستمزد ثبت نشده است.</p>
          )}
        </section>

        {state.error ? (
          <p className="text-sm font-bold leading-7 text-pine" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>

      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="quantity" value={wage?.packs ?? ""} />
      <button className="btn w-full" type="submit" disabled={pending || !wage}>
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
