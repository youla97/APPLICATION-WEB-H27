"use client";
import { useState, useTransition } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import { broadcast } from "@/app/actions/staff";

const PRESETS = ["Rassemblement devant l'hôtel à 5h30 pour le départ vers Mina.", "Lapidation : départ du groupe à 15h, restez groupés derrière le drapeau vert.", "Forte chaleur : buvez de l'eau et restez à l'ombre entre 11h et 16h."];

export default function Broadcast({ group }: { group: string }) {
  const [text, setText] = useState("");
  const [all, setAll] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="card h-fit">
      <h2 className="flex items-center gap-2 font-bold"><Megaphone className="size-5 text-emerald-700" /> Diffuser une consigne</h2>
      <div className="mt-3 flex flex-col gap-1.5">
        {PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => setText(p)} className="rounded-lg bg-sand-100 px-3 py-2 text-start text-xs hover:bg-sand-200 dark:bg-stone-800">{p}</button>
        ))}
      </div>
      <textarea className="input mt-3 min-h-24 py-2" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="Message (SMS + notification)" />
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="size-4 accent-emerald-700" /> Envoyer à tous les pèlerins
      </label>
      <button
        className="btn-primary mt-3 w-full"
        disabled={pending || !text.trim()}
        onClick={() => start(async () => { const r = await broadcast(all ? "*" : group, text); setResult(r.ok ? `Envoyé à ${r.count} pèlerin(s).` : "Erreur"); setText(""); })}
      >
        {pending && <Loader2 className="size-5 animate-spin" />} Envoyer {all ? "à tous" : `au ${group}`}
      </button>
      {result && <p className="animate-pop mt-2 text-center text-sm font-semibold text-emerald-700">{result}</p>}
    </section>
  );
}
