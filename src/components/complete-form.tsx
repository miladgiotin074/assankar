"use client";

import { useActionState, useState } from "react";
import { submitProfile } from "@/app/account/actions";
import { jalaliMonths } from "@/lib/jalali";

const empty = { error: "", field: "" as const };

export function CompleteForm() {
  const [state, formAction, pending] = useActionState(submitProfile, empty);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sheba, setSheba] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [address, setAddress] = useState("");
  const errorId = "profile-error";

  return (
    <form action={formAction} className="complete-form" noValidate>
      <div className="complete-fields">
        <div className="profile-block" role="group" aria-labelledby="name-label">
          <p id="name-label" className="label">
            <span className="profile-no">۱</span>
            نام و نام خانوادگی
          </p>
          <div className="name-row">
            <input
              id="firstName"
              name="firstName"
              className="field"
              autoComplete="given-name"
              maxLength={40}
              required
              placeholder="نام"
              aria-label="نام"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              aria-invalid={state.field === "firstName"}
              aria-describedby={state.field === "firstName" ? errorId : undefined}
              disabled={pending}
            />
            <input
              id="lastName"
              name="lastName"
              className="field"
              autoComplete="family-name"
              maxLength={40}
              required
              placeholder="نام خانوادگی"
              aria-label="نام خانوادگی"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              aria-invalid={state.field === "lastName"}
              aria-describedby={state.field === "lastName" ? errorId : undefined}
              disabled={pending}
            />
          </div>
        </div>

        <div className="profile-block">
          <label className="label" htmlFor="sheba">
            <span className="profile-no">۲</span>
            شماره شبا
          </label>
          <input
            id="sheba"
            name="sheba"
            className="field text-end tracking-wide"
            dir="ltr"
            inputMode="text"
            autoComplete="off"
            maxLength={32}
            required
            value={sheba}
            onChange={(event) => setSheba(groupSheba(event.target.value))}
            aria-invalid={state.field === "sheba"}
            aria-describedby={state.field === "sheba" ? errorId : "sheba-hint"}
            disabled={pending}
            placeholder="IR00 0000 0000 0000 0000 0000 00"
          />
          <p id="sheba-hint" className="field-hint">
            شماره شبا به نام خودتان.
          </p>
        </div>

        <div className="profile-block" role="group" aria-labelledby="birth-label">
          <p id="birth-label" className="label">
            <span className="profile-no">۳</span>
            تاریخ تولد
          </p>
          <div className="birth-row">
            <input
              id="birthDay"
              name="birthDay"
              className="field text-center"
              inputMode="numeric"
              autoComplete="off"
              maxLength={2}
              placeholder="روز"
              aria-label="روز تولد"
              required
              value={day}
              onChange={(event) => setDay(event.target.value)}
              aria-invalid={state.field === "birth"}
              disabled={pending}
            />
            <select
              id="birthMonth"
              name="birthMonth"
              className="field"
              autoComplete="off"
              aria-label="ماه تولد"
              required
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              aria-invalid={state.field === "birth"}
              disabled={pending}
            >
              <option value="">ماه</option>
              {jalaliMonths.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
            <input
              id="birthYear"
              name="birthYear"
              className="field text-center"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="سال"
              aria-label="سال تولد"
              required
              value={year}
              onChange={(event) => setYear(event.target.value)}
              aria-invalid={state.field === "birth"}
              aria-describedby={state.field === "birth" ? errorId : "birth-hint"}
              disabled={pending}
            />
          </div>
          <p id="birth-hint" className="field-hint">
            تاریخ شمسی. حداقل سن ۱۸ سال است.
          </p>
        </div>

        <div className="profile-block">
          <label className="label" htmlFor="address">
            <span className="profile-no">۴</span>
            آدرس دقیق محل سکونت
          </label>
          <textarea
            id="address"
            name="address"
            className="field"
            autoComplete="street-address"
            rows={4}
            maxLength={400}
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            aria-invalid={state.field === "address"}
            aria-describedby={state.field === "address" ? errorId : "address-hint"}
            disabled={pending}
            placeholder="خیابان، کوچه، پلاک و واحد"
          />
          <p id="address-hint" className="field-hint">
            همان نشانی که کالا باید آنجا تحویل شود.
          </p>
        </div>
      </div>

      {state.error ? (
        <p id={errorId} className="text-sm font-bold leading-7 text-pine" role="alert">
          {state.error}
        </p>
      ) : null}

      <input className="hp" tabIndex={-1} autoComplete="off" name="hp_field" aria-hidden="true" />
      <button className="btn mt-auto w-full" type="submit" disabled={pending}>
        {pending ? "در حال ثبت" : "ادامه"}
      </button>
    </form>
  );
}

function groupSheba(value: string) {
  const cleaned = value.replace(/[^\d۰-۹٠-٩A-Za-z]/g, "").toUpperCase();
  const body = (cleaned.startsWith("IR") ? cleaned.slice(2) : cleaned).replace(/[^\d۰-۹٠-٩]/g, "").slice(0, 24);
  const grouped = body.replace(/(.{4})/g, "$1 ").trim();
  return grouped ? `IR ${grouped}` : "IR ";
}
