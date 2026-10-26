"use client";

import { useEffect } from "react";

/**
 * Copies each table's column headers onto its cells as data-label, so the phone CSS in
 * globals.css (.admin-main table) can show every row as a card with labelled values.
 * Watches the DOM because admin tables render after client-side fetches.
 */
export function AdminTableLabeler() {
  useEffect(() => {
    const main = document.querySelector(".admin-main");
    if (!main) return;

    const label = () => {
      main.querySelectorAll("table").forEach((table) => {
        const headers = Array.from(table.querySelectorAll(":scope > thead th")).map((th) => (th.textContent ?? "").trim());
        if (headers.length === 0) return;
        table.querySelectorAll(":scope > tbody > tr").forEach((tr) => {
          let col = 0;
          Array.from(tr.children).forEach((cell) => {
            const td = cell as HTMLTableCellElement;
            const text = td.colSpan > 1 ? "" : headers[col] ?? "";
            if (td.dataset.label !== text) td.dataset.label = text;
            col += td.colSpan || 1;
          });
        });
      });
    };

    label();
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; label(); });
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
