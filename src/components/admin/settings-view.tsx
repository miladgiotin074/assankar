"use client";

import { useEffect, useState } from "react";
import { AdminSkeleton, buzz } from "@/components/admin/admin-kit";
import { faDigits, faNum } from "@/lib/format";
import type { AppSettings } from "@/lib/settings";

type WageDraft = { packs: string; amount: string };
type ProductDraft = {
  id?: string;
  title: string;
  image: string;
  note: string;
  order: string;
  active: boolean;
  wages: WageDraft[];
};

type AdminProductRow = {
  id: string;
  title: string;
  image: string;
  note: string;
  active: boolean;
  order: number;
  wages: { packs: number; amount: number; label: string }[];
};

const emptyProduct = (): ProductDraft => ({
  title: "",
  image: "",
  note: "",
  order: "0",
  active: true,
  wages: [{ packs: "100", amount: "1000000" }],
});

function moneyInput(value: number) {
  return String(value);
}

export function AdminSettingsView() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct());
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      fetch("/api/admin/settings", { credentials: "same-origin" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "خطا در تنظیمات");
        return data as AppSettings;
      }),
      fetch("/api/admin/products", { credentials: "same-origin" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "خطا در محصولات");
        return (data.items || []) as AdminProductRow[];
      }),
    ])
      .then(([nextSettings, nextProducts]) => {
        setSettings(nextSettings);
        setProducts(nextProducts);
        setError("");
      })
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  if (error && !settings) return <div className="admin-empty">{error}</div>;
  if (!settings) return <AdminSkeleton rows={6} />;

  const saveSettings = async () => {
    setSavingSettings(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...settings,
          warehouseOptions: settings.warehouseOptions
            .map((row) => ({ ...row, label: row.label.trim() }))
            .filter((row) => row.label),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ذخیره نشد");
      setSettings(data as AppSettings);
      setNotice("تنظیمات ذخیره شد.");
      buzz("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره نشد");
      buzz("error");
    } finally {
      setSavingSettings(false);
    }
  };

  const saveProduct = async () => {
    setSavingProduct(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          title: draft.title,
          image: draft.image,
          note: draft.note,
          order: Number(draft.order) || 0,
          active: draft.active,
          wages: draft.wages.map((row) => ({
            packs: Number(row.packs),
            amount: Number(row.amount),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "محصول ذخیره نشد");
      setDraft(emptyProduct());
      setEditingId(null);
      setNotice(editingId ? "محصول به‌روز شد." : "محصول ثبت شد.");
      buzz("success");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "محصول ذخیره نشد");
      buzz("error");
    } finally {
      setSavingProduct(false);
    }
  };

  const toggleProduct = async (item: AdminProductRow) => {
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "وضعیت محصول عوض نشد");
      return;
    }
    load();
  };

  return (
    <div className="admin-stack">
      {error ? <div className="admin-empty">{error}</div> : null}
      {notice ? <div className="admin-toast is-ok">{notice}</div> : null}

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>مبالغ مراحل</h2>
          <p>رقم هر مرحله واریز را اینجا عوض کنید</p>
        </div>
        <div className="admin-form-grid">
          {(
            [
              ["registrationFee", "ثبت‌نام"],
              ["insuranceFee", "بیمه"],
              ["guaranteeFee", "ضمانت کالا"],
              ["shippingFee", "باربری"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="admin-field">
              <span>{label}</span>
              <input
                dir="ltr"
                inputMode="numeric"
                value={moneyInput(settings[key])}
                onChange={(event) =>
                  setSettings({ ...settings, [key]: Number(event.target.value.replace(/\D/g, "") || 0) })
                }
              />
              <small>{faNum(settings[key])} تومان</small>
            </label>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>گزینه‌های هزینهٔ انبار</h2>
          <p>مدت و مبلغ را ویرایش، اضافه یا حذف کنید</p>
        </div>
        <div className="admin-wage-box">
          {settings.warehouseOptions.map((row, index) => (
            <div key={`${row.id}-${index}`} className="admin-wage-row admin-option-row">
              <input
                placeholder="عنوان (مثل ۶ ماهه)"
                value={row.label}
                onChange={(event) => {
                  const warehouseOptions = [...settings.warehouseOptions];
                  warehouseOptions[index] = { ...row, label: event.target.value };
                  setSettings({ ...settings, warehouseOptions });
                }}
              />
              <input
                dir="ltr"
                inputMode="numeric"
                placeholder="مبلغ"
                value={moneyInput(row.amount)}
                onChange={(event) => {
                  const warehouseOptions = [...settings.warehouseOptions];
                  warehouseOptions[index] = {
                    ...row,
                    amount: Number(event.target.value.replace(/\D/g, "") || 0),
                  };
                  setSettings({ ...settings, warehouseOptions });
                }}
              />
              <small>{faNum(row.amount)} تومان</small>
              {settings.warehouseOptions.length > 1 ? (
                <button
                  type="button"
                  className="admin-link-btn"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      warehouseOptions: settings.warehouseOptions.filter((_, i) => i !== index),
                    })
                  }
                >
                  حذف
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="admin-link-btn"
            onClick={() =>
              setSettings({
                ...settings,
                warehouseOptions: [
                  ...settings.warehouseOptions,
                  {
                    id: `opt${Date.now().toString(36)}`,
                    label: "",
                    amount: 0,
                  },
                ],
              })
            }
          >
            افزودن گزینه
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>پشتیبانی و کارت واریز</h2>
          <p>آیدی تلگرام و مشخصات کارت مقصد</p>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>آیدی پشتیبانی تلگرام</span>
            <input
              dir="ltr"
              value={settings.telegramUser}
              onChange={(event) => setSettings({ ...settings, telegramUser: event.target.value.replace(/^@/, "") })}
            />
          </label>
          <label className="admin-field">
            <span>شماره کارت مقصد</span>
            <input
              dir="ltr"
              inputMode="numeric"
              value={settings.payoutCard}
              onChange={(event) => setSettings({ ...settings, payoutCard: event.target.value.replace(/\D/g, "").slice(0, 19) })}
            />
          </label>
          <label className="admin-field">
            <span>نام صاحب کارت</span>
            <input
              value={settings.payoutHolder}
              onChange={(event) => setSettings({ ...settings, payoutHolder: event.target.value })}
            />
          </label>
          <label className="admin-field">
            <span>نام بانک</span>
            <input value={settings.payoutBank} onChange={(event) => setSettings({ ...settings, payoutBank: event.target.value })} />
          </label>
        </div>
        <button type="button" className="admin-primary" disabled={savingSettings} onClick={saveSettings}>
          {savingSettings ? "در حال ذخیره…" : "ذخیره تنظیمات"}
        </button>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>{editingId ? "ویرایش محصول" : "ثبت محصول"}</h2>
          <p>عنوان، عکس، جدول دستمزد</p>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field is-wide">
            <span>عنوان</span>
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <label className="admin-field is-wide">
            <span>آدرس عکس</span>
            <input
              dir="ltr"
              value={draft.image}
              onChange={(event) => setDraft({ ...draft, image: event.target.value })}
              placeholder="/products/example.jpg"
            />
          </label>
          <label className="admin-field is-wide">
            <span>توضیح کوتاه</span>
            <input value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
          </label>
          <label className="admin-field">
            <span>ترتیب نمایش</span>
            <input
              dir="ltr"
              inputMode="numeric"
              value={draft.order}
              onChange={(event) => setDraft({ ...draft, order: event.target.value.replace(/\D/g, "") })}
            />
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
            />
            <span>فعال در داشبورد</span>
          </label>
        </div>

        <div className="admin-wage-box">
          <div className="admin-panel-head">
            <h2>جدول دستمزد</h2>
            <button
              type="button"
              className="admin-link-btn"
              onClick={() => setDraft({ ...draft, wages: [...draft.wages, { packs: "", amount: "" }] })}
            >
              ردیف جدید
            </button>
          </div>
          {draft.wages.map((row, index) => (
            <div key={index} className="admin-wage-row">
              <input
                dir="ltr"
                inputMode="numeric"
                placeholder="تعداد بسته"
                value={row.packs}
                onChange={(event) => {
                  const wagesRows = [...draft.wages];
                  wagesRows[index] = { ...row, packs: event.target.value.replace(/\D/g, "") };
                  setDraft({ ...draft, wages: wagesRows });
                }}
              />
              <input
                dir="ltr"
                inputMode="numeric"
                placeholder="دستمزد"
                value={row.amount}
                onChange={(event) => {
                  const wagesRows = [...draft.wages];
                  wagesRows[index] = { ...row, amount: event.target.value.replace(/\D/g, "") };
                  setDraft({ ...draft, wages: wagesRows });
                }}
              />
              {draft.wages.length > 1 ? (
                <button
                  type="button"
                  className="admin-link-btn"
                  onClick={() => setDraft({ ...draft, wages: draft.wages.filter((_, i) => i !== index) })}
                >
                  حذف
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="admin-actions-row">
          <button type="button" className="admin-primary" disabled={savingProduct} onClick={saveProduct}>
            {savingProduct ? "در حال ذخیره…" : editingId ? "ذخیره تغییرات محصول" : "ثبت محصول"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="admin-secondary"
              onClick={() => {
                setEditingId(null);
                setDraft(emptyProduct());
              }}
            >
              انصراف
            </button>
          ) : null}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>محصولات</h2>
          <p>{faDigits(String(products.length))} مورد</p>
        </div>
        <div className="admin-list">
          {products.map((item) => (
            <article key={item.id} className="admin-list-card">
              <div>
                <strong>{item.title}</strong>
                <p>
                  {item.active ? "فعال" : "غیرفعال"} · {faDigits(String(item.wages.length))} ردیف دستمزد
                </p>
              </div>
              <div className="admin-actions-row">
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    setEditingId(item.id);
                    setDraft({
                      id: item.id,
                      title: item.title,
                      image: item.image,
                      note: item.note,
                      order: String(item.order || 0),
                      active: item.active,
                      wages: item.wages.map((row) => ({ packs: String(row.packs), amount: String(row.amount) })),
                    });
                  }}
                >
                  ویرایش
                </button>
                <button type="button" className="admin-secondary" onClick={() => toggleProduct(item)}>
                  {item.active ? "غیرفعال" : "فعال"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
