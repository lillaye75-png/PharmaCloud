"use client";
import { useState } from "react";
import { setLocale, getLocale, locales } from "@/lib/i18n";
import { Languages } from "lucide-react";

export default function LocaleSwitcher() {
  const [open, setOpen] = useState(false);
  const current = locales.find((l) => l.code === getLocale()) || locales[0];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-pharma-200 hover:bg-white/10 hover:text-white transition-all w-full">
        <Languages size={18} />
        <span>{current.flag} {current.label}</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg bg-white shadow-xl border border-gray-200 overflow-hidden">
          {locales.map((l) => (
            <button key={l.code} onClick={() => { setLocale(l.code); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${l.code === getLocale() ? "bg-pharma-50 text-pharma-700" : "text-gray-700"}`}>
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
