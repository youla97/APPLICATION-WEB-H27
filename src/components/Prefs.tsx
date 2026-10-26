"use client";
import { useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Languages } from "lucide-react";
import { setLang } from "@/app/actions/auth";

const SIZES = [15, 16, 18, 20];

// Préférences d'affichage stockées côté navigateur (appliquées avant le rendu par le script du layout)
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const changed = () => listeners.forEach((l) => l());
const readDark = () => document.documentElement.classList.contains("dark");
const readSize = () => {
  try {
    return Number(localStorage.getItem("size")) || 16;
  } catch {
    return 16;
  }
};

export default function Prefs({ lang, labels }: { lang: "fr" | "ar"; labels: { textSize: string; darkMode: string; language: string } }) {
  const router = useRouter();
  const dark = useSyncExternalStore(subscribe, readDark, () => false);
  const size = useSyncExternalStore(subscribe, readSize, () => 16);
  const [pending, start] = useTransition();

  const toggleDark = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    changed();
  };

  const bump = (dir: 1 | -1) => {
    const i = Math.min(SIZES.length - 1, Math.max(0, SIZES.indexOf(size) + dir));
    const s = SIZES[i];
    document.documentElement.style.setProperty("--base-size", s + "px");
    try { localStorage.setItem("size", String(s)); } catch {}
    changed();
  };

  const btn = "grid size-10 place-items-center rounded-lg text-white/90 hover:bg-white/10 transition";
  return (
    <div className="flex items-center gap-0.5">
      <button className={btn + " text-sm font-bold"} onClick={() => bump(-1)} aria-label={labels.textSize + " −"} title={labels.textSize}>A−</button>
      <button className={btn + " text-lg font-bold"} onClick={() => bump(1)} aria-label={labels.textSize + " +"} title={labels.textSize}>A+</button>
      <button className={btn} onClick={toggleDark} aria-label={labels.darkMode} title={labels.darkMode} aria-pressed={dark}>
        {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
      <button
        className={btn + " w-auto gap-1 px-2 text-sm font-semibold"}
        disabled={pending}
        onClick={() => start(async () => { await setLang(lang === "fr" ? "ar" : "fr"); router.refresh(); })}
        title={labels.language}
      >
        <Languages className="size-5" />
        <span className="hidden sm:inline">{labels.language}</span>
      </button>
    </div>
  );
}
