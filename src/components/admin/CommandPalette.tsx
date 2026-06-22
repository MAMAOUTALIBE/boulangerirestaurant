"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Result {
  type: string;
  label: string;
  sub: string;
  href: string;
}

/** Palette de recherche globale, ouverte au ⌘K / Ctrl+K. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Raccourci clavier ⌘K / Ctrl+K + Échap pour fermer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQ("");
      setResults([]);
    }
  }, [open]);

  // Recherche (debounce léger).
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(q)}`,
          {
            cache: "no-store",
          },
        );
        if (res.ok) setResults((await res.json()).results ?? []);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted transition hover:border-gold/60 hover:text-cream"
      >
        <Search className="h-3.5 w-3.5" />
        Rechercher
        <kbd className="rounded border border-white/15 px-1 text-[10px]">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 p-4 pt-[15vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-ink-soft shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Commande, client, plat…"
                className="w-full bg-transparent py-4 text-sm text-cream placeholder:text-muted focus:outline-none"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {q.trim().length >= 2 && results.length === 0 && (
                <li className="px-3 py-3 text-sm text-muted">
                  Aucun résultat.
                </li>
              )}
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => go(r.href)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/5"
                  >
                    <span>
                      <span className="block text-sm text-cream">
                        {r.label}
                      </span>
                      <span className="block text-xs text-muted">{r.sub}</span>
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted">
                      {r.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
