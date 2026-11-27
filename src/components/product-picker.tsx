"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const trackRef = useRef<HTMLDivElement>(null);
  const basketRef = useRef<HTMLElement>(null);
  const dragRef = useRef({ pointer: -1, x: 0, y: 0, dx: 0, lock: "" as "" | "x" | "y", base: 0 });
  const suppressClick = useRef(false);
  const product = products.find((item) => item.id === selected) ?? products[0];
  const inBasket = basket.find((item) => item.productId === product?.id);
  const productIndex = Math.max(0, products.findIndex((item) => item.id === product?.id));

  const productIndexRef = useRef(productIndex);
  const productsRef = useRef(products);
  const selectedRef = useRef(selected);
  productIndexRef.current = productIndex;
  productsRef.current = products;
  selectedRef.current = selected;

  function trackWidth() {
    return trackRef.current?.clientWidth || trackRef.current?.parentElement?.clientWidth || 0;
  }

  function placeTrack(index: number, animate: boolean) {
    const track = trackRef.current;
    const width = trackWidth();
    if (!track || !width) return;
    track.style.transition = animate ? "" : "none";
    track.style.transform = `translate3d(${index * width}px, 0, 0)`;
  }

  function placePixels(px: number, animate: boolean) {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = animate ? "" : "none";
    track.style.transform = `translate3d(${px}px, 0, 0)`;
  }

  function focusCard(id: string) {
    setSelected(id);
    setLocalError("");
    const existing = basket.find((item) => item.productId === id);
    const next = products.find((item) => item.id === id);
    setQuantity(existing?.quantity ?? next?.wages[0]?.packs ?? 0);
  }

  const focusRef = useRef(focusCard);
  focusRef.current = focusCard;

  useLayoutEffect(() => {
    if (dragRef.current.pointer !== -1) return;
    placeTrack(productIndex, true);
  }, [productIndex]);

  useEffect(() => {
    const rail = trackRef.current?.parentElement;
    if (!rail) return;
    const observer = new ResizeObserver(() => {
      if (dragRef.current.pointer !== -1) return;
      placeTrack(productIndexRef.current, false);
    });
    observer.observe(rail);
    return () => observer.disconnect();
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const track = trackRef.current;
    let base = productIndexRef.current * trackWidth();
    if (track) {
      const raw = getComputedStyle(track).transform;
      if (raw && raw !== "none") base = new DOMMatrix(raw).m41;
      track.style.transition = "none";
      track.style.transform = `translate3d(${base}px, 0, 0)`;
    }
    dragRef.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, lock: "", base };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointer !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.lock) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (drag.lock !== "x") return;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (drag.lock !== "x") return;
    event.preventDefault();
    const width = trackWidth() || 1;
    const max = Math.max(0, productsRef.current.length - 1) * width;
    let px = drag.base + dx;
    if (px < 0) px *= 0.32;
    else if (px > max) px = max + (px - max) * 0.32;
    drag.dx = dx;
    placePixels(px, false);
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>, commit: boolean) {
    const drag = dragRef.current;
    if (drag.pointer !== event.pointerId) return;
    const horizontal = drag.lock === "x";
    const dx = drag.dx;
    dragRef.current.pointer = -1;
    if (!horizontal) return;
    if (Math.abs(dx) > 8) suppressClick.current = true;
    const width = trackWidth() || 1;
    const count = productsRef.current.length;
    const maxIndex = Math.max(0, count - 1);
    const origin = Math.round(drag.base / width);
    let next = origin;
    if (commit) {
      const threshold = Math.min(56, width * 0.14);
      if (dx > threshold) next = origin + 1;
      else if (dx < -threshold) next = origin - 1;
      else next = Math.round((drag.base + dx) / width);
    }
    next = Math.max(0, Math.min(maxIndex, next));
    placeTrack(next, true);
    const item = productsRef.current[next];
    if (item && item.id !== selectedRef.current) focusRef.current(item.id);
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
          <section className="pick-rules" aria-label="نکات تحویل و آماده‌سازی">
            <h2>نکات مهم</h2>
            <ul>
              <li>همکار گرامی باید حداکثر طی ۳۰ روز، محصولات تحویل‌گرفته را بسته‌بندی و آمادهٔ تحویل کند.</li>
              <li>اگر زودتر از این مدت محصولات را آماده کنید، می‌توانید محصولات جدید دریافت کنید.</li>
            </ul>
          </section>
        </div>

        <div
          className="pick-rail"
          role="listbox"
          aria-label="محصولات"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => finishDrag(event, true)}
          onPointerCancel={(event) => finishDrag(event, false)}
          onLostPointerCapture={(event) => {
            if (event.target !== event.currentTarget) return;
            finishDrag(event, true);
          }}
          onClickCapture={(event) => {
            if (!suppressClick.current) return;
            suppressClick.current = false;
            event.preventDefault();
            event.stopPropagation();
          }}
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
          <div ref={trackRef} className="pick-track">
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
                draggable={false}
                onClick={() => {
                  if (item.id !== product.id) focusCard(item.id);
                }}
              >
                <span className="pick-photo">
                  {item.image && !broken[item.id] ? (
                    <img
                      src={item.image}
                      alt=""
                      draggable={false}
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
