"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { submitHealth } from "@/app/actions/pelerin";

const CONDITIONS = ["Diabète", "Hypertension", "Maladie cardiaque", "Asthme / maladie respiratoire", "Insuffisance rénale", "Mobilité réduite", "Grossesse"];

export default function HealthForm() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="card mt-6 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await submitHealth(form);
          if (!r.ok) return setError(r.error ?? "Erreur");
          router.push("/espace");
          router.refresh();
        });
      }}
    >
      <div>
        <label className="label" htmlFor="men">💉 Date du vaccin méningite (ACYW135) — obligatoire</label>
        <input id="men" type="date" className="input" onChange={(e) => set("meningite", e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="blood">Groupe sanguin</label>
        <select id="blood" className="input" onChange={(e) => set("blood", e.target.value)}>
          <option value="">Je ne sais pas</option>
          {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => <option key={b}>{b}</option>)}
        </select>
      </div>
      <fieldset>
        <legend className="label">Maladies ou situations particulières</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONDITIONS.map((c) => (
            <label key={c} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-stone-200 px-3 has-checked:border-emerald-600 has-checked:bg-emerald-50 dark:border-stone-700 dark:has-checked:bg-emerald-950">
              <input type="checkbox" className="size-5 accent-emerald-700" onChange={(e) => set(c, e.target.checked)} /> {c}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="treat">Traitements en cours</label>
        <textarea id="treat" className="input min-h-20 py-3" placeholder="Ex. Metformine 500 mg matin et soir" onChange={(e) => set("traitements", e.target.value)} />
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <button className="btn-primary w-full text-lg" disabled={pending}>{pending && <Loader2 className="size-5 animate-spin" />} Envoyer à la mission médicale</button>
    </form>
  );
}
