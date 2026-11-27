"use client";

import { useActionState, useState } from "react";
import type { AuthState } from "@/lib/identity";

export function AuthForm({
  action,
  field,
  label,
  hint,
  autoComplete,
  inputMode,
  maxLength,
  submitLabel,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  field: "phone" | "nationalId";
  label: string;
  hint: string;
  autoComplete: string;
  inputMode: "tel" | "numeric";
  maxLength: number;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: "" });
  const [value, setValue] = useState("");
  const invalid = state.error.length > 0;
  const errorId = `${field}-error`;

  return (
    <form action={formAction} className="flex flex-1 flex-col" noValidate>
      <label className="label" htmlFor={field}>
        {label}
      </label>
      <input
        id={field}
        name={field}
        className="field text-end tracking-wide"
        dir="ltr"
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize="off"
        spellCheck={false}
        maxLength={maxLength}
        required
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : `${field}-hint`}
        disabled={pending}
      />
      {invalid ? (
        <p id={errorId} className="mt-2 text-sm font-bold leading-7 text-pine" role="alert">
          {state.error}
        </p>
      ) : (
        <p id={`${field}-hint`} className="mt-2 text-sm leading-7 text-muted">
          {hint}
        </p>
      )}
      <input className="hp" tabIndex={-1} autoComplete="off" name="hp_field" aria-hidden="true" />
      <button className="btn mt-auto w-full" type="submit" disabled={pending}>
        {pending ? "در حال بررسی" : submitLabel}
      </button>
    </form>
  );
}
