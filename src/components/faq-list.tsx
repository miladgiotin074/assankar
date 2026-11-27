"use client";

import { useState } from "react";
import { faNum } from "@/lib/format";

export function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);

  return (
    <ol className="faq-list panel divide-y divide-line overflow-hidden">
      {items.map((faq, index) => {
        const isOpen = open === index;
        const buttonId = `faq-q-${index}`;
        const panelId = `faq-a-${index}`;

        return (
          <li key={faq.q} className={isOpen ? "faq-row is-open" : "faq-row"}>
            <h3>
              <button
                id={buttonId}
                type="button"
                className="faq-q"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <span className="faq-num">{faNum(index + 1)}</span>
                <span className="min-w-0 flex-1">{faq.q}</span>
                <Chevron open={isOpen} />
              </button>
            </h3>
            <div id={panelId} className={isOpen ? "faq-panel is-open" : "faq-panel"} role="region" aria-labelledby={buttonId}>
              <div inert={!isOpen}>
                <p className="faq-a text-base leading-8 text-muted">{faq.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={open ? "faq-chevron is-open" : "faq-chevron"} aria-hidden="true">
      <path
        d="M6 9.5 12 15l6-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
