"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitChoice, type ChoiceState } from "@/app/dashboard/products/actions";
import { faDigits, toman } from "@/lib/format";
import { maxChoices, type CatalogCard, type ChoiceItem } from "@/lib/catalog-shared";

const empty: ChoiceState = { error: "" };

type BasketLine = {
  productId: string;
  quantity: number;
};

export function ProductPicker({
  products,
  initial,
}: {
  products: CatalogCard[];
  initial: ChoiceItem[];
}) {
  const [state, action, pending] = useActionState(submitChoice, empty);
  const [selected, setSelected] = useState(initial[0]?.productId || products[0]?.id || "");
  const [quantity, setQuantity] = useState(initial[0]?.quantity ?? products[0]?.wages[0]?.packs ?? 0);
  const [basket, setBasket] = useState<BasketLine[]>(
    initial.map((item) => ({ productId: item.productId, quantity: item.quantity })),
  );
  const [broken, setBroken] = useState<Record<string, true>>({});
  const [localError, setLocalError] = useState("");
  const railRef = useRef<HTMLDivElement>(null);
  const basketRef = useRef<HTMLElement>(null);
  const openedOn = useRef(selected);
  const product = products.find((item) => item.id === selected) ?? products[0];
  const inBasket = basket.find((item) => item.productId === product?.id);
  const productIndex = Math.max(0, products.findIndex((item) => item.id === product?.id));

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
    const opened = rail.querySelector<HTMLElement>(`[data-id="${CSS.escape(openedOn.current)}"]`);
    if (opened) centerCard(rail, opened);
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
    };
  }, []);

  function focusCard(id: string) {
    setSelected(id);
    setLocalError("");
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
    if (rail && card) centerCard(rail, card, "smooth");
    const existing = basket.find((item) => item.productId === id);
    const next = products.find((item) => item.id === id);
    setQuantity(existing?.quantity ?? next?.wages[0]?.packs ?? 0);
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

  function setWage(packs: number) {
    setLocalError("");
    setQuantity(packs);
    setBasket((current) =>
      current.map((item) => (item.productId === product?.id ? { ...item, quantity: packs } : item)),
    );
  }

  if (!product) return null;
  const wage = product.wages.find((row) => row.packs === quantity) ?? product.wages[0];
  const error = localError || state.error;

  function toggleCurrent() {
    if (!product || !wage) return;
    setLocalError("");
    if (inBasket) {
      setBasket((current) => current.filter((item) => item.productId !== product.id));
      return;
    }
    if (basket.length >= maxChoices) {
      setLocalError("حداکثر سه محصول می‌توانید انتخاب کنید.");
      return;
    }
    setBasket((current) => [...current, { productId: product.id, quantity: wage.packs }]);
    requestAnimationFrame(() => {
      basketRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function removeLine(productId: string) {
    setLocalError("");
    setBasket((current) => current.filter((item) => item.productId !== productId));
  }

  const basketCards = basket.flatMap((line) => {
    const item = products.find((entry) => entry.id === line.productId);
    const row = item?.wages.find((wageRow) => wageRow.packs === line.quantity);
    if (!item || !row) return [];
    return [{ ...line, title: item.title, image: item.image, label: row.label, amount: row.amount }];
  });

  return (
    <form action={action} className="pick-form">
      <div className="pick-scroll">
        <div className="pick-intro">
          <p className="pick-lead">محصول را بکشید، تعداد بسته را بزنید و تا سه مورد اضافه کنید.</p>
          <div className="pick-slots" aria-label={`ظرفیت انتخاب ${faDigits(String(basket.length))} از ${faDigits(String(maxChoices))}`}>
            {Array.from({ length: maxChoices }, (_, index) => (
              <span key={index} className={index < basket.length ? "is-on" : undefined} />
            ))}
            <strong>
              {faDigits(String(basket.length))} از {faDigits(String(maxChoices))}
            </strong>
          </div>
        </div>

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
            const picked = basket.some((line) => line.productId === item.id);
            return (
              <button
                key={item.id}
                type="button"
                data-id={item.id}
                className={on ? (picked ? "pick-card is-on is-picked" : "pick-card is-on") : picked ? "pick-card is-picked" : "pick-card"}
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
                  {picked ? <span className="pick-badge">انتخاب شد</span> : null}
                </span>
                <span className="pick-card-meta">
                  <strong>{item.title}</strong>
                  <small>{picked ? "در فهرست شماست" : "بکشید و تعداد را انتخاب کنید"}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="pick-dots" aria-hidden="true">
          {products.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === productIndex ? "is-on" : undefined}
              onClick={() => focusCard(item.id)}
            />
          ))}
        </div>

        {product.note ? <p className="pick-note">{product.note}</p> : null}

        <section className="pick-panel" aria-label="جدول دستمزد">
          <div className="pick-panel-head">
            <h2>تعداد و دستمزد</h2>
            <span>{product.title}</span>
          </div>
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
                    onClick={() => setWage(row.packs)}
                  >
                    <span className="pick-wage-mark" aria-hidden="true" />
                    <span className="pick-wage-copy">
                      <span>{row.label}</span>
                      <strong>{toman(row.amount)}</strong>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p>برای این محصول هنوز جدول دستمزد ثبت نشده است.</p>
          )}

          <button
            type="button"
            className={inBasket ? "pick-add is-on" : "pick-add"}
            onClick={toggleCurrent}
            disabled={!wage}
          >
            {inBasket ? "حذف از فهرست" : "افزودن به فهرست"}
          </button>
        </section>

        <section ref={basketRef} className={basketCards.length ? "pick-basket is-filled" : "pick-basket"} aria-label="محصولات انتخاب‌شده">
          <div className="pick-basket-head">
            <div>
              <h2>فهرست انتخاب</h2>
              <p>برای ادامه حداقل یک محصول لازم است.</p>
            </div>
            <span>
              {faDigits(String(basketCards.length))}/{faDigits(String(maxChoices))}
            </span>
          </div>
          {basketCards.length ? (
            <ul>
              {basketCards.map((item, index) => (
                <li key={item.productId}>
                  <span className="pick-basket-thumb" aria-hidden="true">
                    {item.image && !broken[item.productId] ? (
                      <img
                        src={item.image}
                        alt=""
                        onError={() => setBroken((current) => ({ ...current, [item.productId]: true }))}
                      />
                    ) : (
                      <PhotoFallback />
                    )}
                    <em>{faDigits(String(index + 1))}</em>
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.label}</small>
                    <b>{toman(item.amount)}</b>
                  </div>
                  <button type="button" aria-label={`حذف ${item.title}`} onClick={() => removeLine(item.productId)}>
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="pick-basket-empty">
              <span aria-hidden="true" />
              <p>هنوز چیزی اضافه نشده. محصول را بکشید و «افزودن به فهرست» را بزنید.</p>
            </div>
          )}
        </section>

        {error ? (
          <p className="pick-alert" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <input type="hidden" name="picks" value={JSON.stringify(basket)} />
      <button className="btn w-full" type="submit" disabled={pending || !basket.length}>
        {pending ? "در حال ثبت" : basket.length ? `ثبت ${faDigits(String(basket.length))} محصول و ادامه` : "حداقل یک محصول انتخاب کنید"}
      </button>
    </form>
  );
}

function centerCard(rail: HTMLElement, card: HTMLElement, behavior: ScrollBehavior = "auto") {
  const delta =
    card.getBoundingClientRect().left +
    card.offsetWidth / 2 -
    (rail.getBoundingClientRect().left + rail.clientWidth / 2);
  if (Math.abs(delta) < 2) return;
  rail.style.scrollSnapType = "none";
  rail.scrollBy({ left: delta, behavior });
  const restore = () => {
    rail.style.scrollSnapType = "";
  };
  if (behavior === "auto") restore();
  else rail.addEventListener("scrollend", restore, { once: true });
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
