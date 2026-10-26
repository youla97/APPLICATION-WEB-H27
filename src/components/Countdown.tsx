"use client";
import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
};
const nowSeconds = () => Math.floor(Date.now() / 1000);

export default function Countdown({ target, labels }: { target: string; labels: { days: string; hours: string; minutes: string; seconds: string } }) {
  const now = useSyncExternalStore(subscribe, nowSeconds, () => null);
  const diff = Math.max(0, new Date(target).getTime() - (now ?? 0) * 1000);
  const parts = [
    [Math.floor(diff / 864e5), labels.days],
    [Math.floor(diff / 36e5) % 24, labels.hours],
    [Math.floor(diff / 6e4) % 60, labels.minutes],
    [Math.floor(diff / 1e3) % 60, labels.seconds],
  ] as const;
  return (
    <div className="flex gap-2 sm:gap-3">
      {parts.map(([v, l]) => (
        <div key={l} className="min-w-16 rounded-2xl bg-white/10 px-3 py-2.5 text-center ring-1 ring-white/15 backdrop-blur sm:min-w-20">
          <div className="text-2xl font-extrabold tabular-nums sm:text-4xl">{now == null ? "––" : String(v).padStart(2, "0")}</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-100/80">{l}</div>
        </div>
      ))}
    </div>
  );
}
