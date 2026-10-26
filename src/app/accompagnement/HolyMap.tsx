"use client";
import { useState } from "react";

type Place = { id: string; name: string; city: string; x: number; y: number; info: string };

/** Carte schématique interactive des lieux saints (en production : fond de carte OpenStreetMap hors ligne). */
export default function HolyMap({ places }: { places: Place[] }) {
  const [sel, setSel] = useState<Place>(places[0]);
  return (
    <div className="card mt-4 p-3">
      <svg viewBox="60 100 380 180" className="w-full rounded-xl bg-sand-100 dark:bg-stone-800" role="img" aria-label="Carte des lieux saints">
        <path d="M120 210 C 160 190, 190 200, 230 180 S 300 160, 380 140" fill="none" stroke="#d6c08f" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 10" />
        <path d="M120 210 L 175 245" fill="none" stroke="#d6c08f" strokeWidth="3" strokeDasharray="4 6" />
        <text x="80" y="120" className="fill-stone-400 text-[9px] font-semibold">LA MECQUE</text>
        <text x="350" y="120" className="fill-stone-400 text-[9px] font-semibold">≈ 20 km</text>
        {places.map((p) => {
          const active = sel.id === p.id;
          return (
            <g key={p.id} onClick={() => setSel(p)} className="cursor-pointer" role="button" tabIndex={0} aria-label={p.name} onKeyDown={(e) => e.key === "Enter" && setSel(p)}>
              {active && <circle cx={p.x} cy={p.y} r="14" className="fill-emerald-500/25"><animate attributeName="r" values="8;16;8" dur="1.8s" repeatCount="indefinite" /></circle>}
              <circle cx={p.x} cy={p.y} r={active ? 7 : 5.5} className={active ? "fill-emerald-600" : p.id === "clinique" ? "fill-gn-red" : "fill-stone-600 dark:fill-stone-300"} stroke="white" strokeWidth="2" />
              <text x={p.x} y={p.y - 11} textAnchor="middle" className={`text-[9px] font-bold ${active ? "fill-emerald-800 dark:fill-emerald-300" : "fill-stone-700 dark:fill-stone-300"}`}>{p.name}</text>
            </g>
          );
        })}
      </svg>
      <div key={sel.id} className="animate-fade-up mt-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
        <div className="font-bold">📍 {sel.name}{sel.city && <span className="font-normal text-stone-500"> · {sel.city}</span>}</div>
        <p className="text-sm text-stone-600 dark:text-stone-300">{sel.info}</p>
      </div>
    </div>
  );
}
