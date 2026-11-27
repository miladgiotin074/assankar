import type { ReactNode } from "react";

export function AuthCard({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-screen">
      <span className="auth-mark" aria-hidden="true" />
      <h1>{title}</h1>
      <p>{copy}</p>
      <div className="auth-body">{children}</div>
    </div>
  );
}
