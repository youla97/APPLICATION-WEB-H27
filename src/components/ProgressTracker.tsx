import { PROGRESS_STEPS } from "@/lib/data";

export default function ProgressTracker({ done }: { done: number }) {
  const pct = Math.round((done / PROGRESS_STEPS.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>
          {done}/{PROGRESS_STEPS.length} étapes
        </span>
        <span className="text-emerald-700 dark:text-emerald-400">{pct} %</span>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {PROGRESS_STEPS.map((s, i) => {
          const state = i < done ? "done" : i === done ? "current" : "todo";
          return (
            <li key={s.key} className="flex flex-col items-center text-center">
              <span
                className={`grid size-11 place-items-center rounded-full text-lg transition ${
                  state === "done"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : state === "current"
                      ? "bg-amber-100 ring-2 ring-amber-400 dark:bg-amber-950"
                      : "bg-stone-100 opacity-60 grayscale dark:bg-stone-800"
                }`}
                aria-hidden
              >
                {state === "done" ? "✓" : s.icon}
              </span>
              <span className={`mt-1.5 text-[11px] leading-tight font-semibold ${state === "todo" ? "text-stone-400" : ""}`}>
                {s.label}
                <span className="sr-only"> : {state === "done" ? "terminé" : state === "current" ? "en cours" : "à venir"}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
