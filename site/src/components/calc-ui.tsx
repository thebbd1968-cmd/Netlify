import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * Small building blocks shared by the two public calculators: a labelled number
 * field, a result tile, a worked-numbers row and the shareable-URL plumbing.
 *
 * Everything here is client-side only — no input ever leaves the browser — and
 * every field is `min-w-0`/`w-full` so the two-column input grid can collapse to
 * one column on a 375px phone without producing a horizontal scrollbar.
 */

export interface NumberFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
}

export function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
}: NumberFieldProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-1.5 flex min-w-0 items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
        {prefix ? (
          <span className="shrink-0 pl-3 text-sm text-slate-500 select-none">{prefix}</span>
        ) : null}
        <input
          id={id}
          name={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-slate-900 tabular-nums outline-none placeholder:text-slate-400"
        />
        {suffix ? (
          <span className="shrink-0 pr-3 text-sm text-slate-500 select-none">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

export function ResultTile({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "min-w-0 rounded-xl border-2 border-slate-900 bg-slate-900 p-4 text-white"
          : "min-w-0 rounded-xl border border-slate-200 bg-white p-4"
      }
    >
      <p className={emphasis ? "text-xs font-medium text-slate-300" : "text-xs font-medium text-slate-500"}>
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums break-words">{value}</p>
      {detail ? (
        <p className={emphasis ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-500"}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export function WorkedRow({
  label,
  value,
  formula,
}: {
  label: string;
  value: string;
  formula?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-700">{label}</p>
        {formula ? <p className="mt-0.5 text-xs text-slate-500 break-words">{formula}</p> : null}
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied (or an insecure context): fall back to a
      // prompt-free selection so the visitor can still copy by hand.
      window.prompt("Copy this link:", url);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900"
    >
      {copied ? "Link copied" : "Copy link to these numbers"}
    </button>
  );
}

/**
 * Input state that mirrors into the query string, so any result is shareable as
 * a plain URL (`/tools/arv-calculator?purchase=180000&…`) with no account, no
 * server and no storage. Fields equal to their default are left out of the URL to
 * keep shared links short, and the URL is only rewritten when a field changes.
 */
export function useQueryInputs<T extends Record<string, string>>(defaults: T) {
  const [values, setValues] = useState<T>(defaults);

  // Hydrate from the shared URL once the page is in the browser. Reading
  // window.location in an effect (not during render) keeps server and client
  // markup identical, so hydration never mismatches.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = { ...defaults };
    let changed = false;
    for (const key of Object.keys(defaults)) {
      const raw = params.get(key);
      if (raw !== null && raw.trim() !== "") {
        next[key as keyof T] = raw.trim() as T[keyof T];
        changed = true;
      }
    }
    if (changed) setValues(next);
    // Intentionally runs once: later edits are driven by setField.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const writeUrl = useCallback(
    (next: T) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        const trimmed = String(value).trim();
        if (trimmed !== "" && trimmed !== defaults[key as keyof T]) params.set(key, trimmed);
      }
      const query = params.toString();
      const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState(window.history.state, "", url);
    },
    [defaults],
  );

  const setField = useCallback(
    (key: keyof T, value: string) => {
      const next = { ...values, [key]: value } as T;
      setValues(next);
      writeUrl(next);
    },
    [values, writeUrl],
  );

  const reset = useCallback(() => {
    setValues(defaults);
    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
  }, [defaults]);

  return { values, setField, reset };
}

/** Shared page frame for a calculator: intro copy, then the interactive panel. */
export function ToolSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-6xl px-4 py-10 sm:px-6 ${className}`}>
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
