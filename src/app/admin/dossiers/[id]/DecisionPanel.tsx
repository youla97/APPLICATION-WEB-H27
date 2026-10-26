"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, X } from "lucide-react";
import { setDossierStatus } from "@/app/actions/staff";

const REASONS = ["Photo d'identité floue ou non conforme", "Passeport expiré avant fin 2027", "Scan du passeport illisible", "Personne à prévenir injoignable", "Doublon confirmé avec un autre dossier"];

export default function DecisionPanel({ dossierId, status, reason }: { dossierId: number; status: string; reason: string | null }) {
  const router = useRouter();
  const [motif, setMotif] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const act = (s: "verification" | "valide" | "rejete") =>
    start(async () => {
      setError(null);
      const r = await setDossierStatus(dossierId, s, motif);
      if (!r.ok) return setError(r.error ?? "Erreur");
      setMotif("");
      router.refresh();
    });

  if (!["soumis", "verification"].includes(status))
    return (
      <section className="card">
        <h2 className="font-bold">Décision</h2>
        <p className="mt-2 text-sm text-stone-500">
          {status === "rejete" ? `Renvoyé au pèlerin pour correction : « ${reason} »` : "Dossier validé. Le pèlerin peut payer et poursuivre son parcours."}
        </p>
      </section>
    );

  return (
    <section className="card space-y-3 ring-2 ring-amber-300 dark:ring-amber-800">
      <h2 className="font-bold">Décision</h2>
      {status === "soumis" && (
        <button className="btn-ghost w-full" disabled={pending} onClick={() => act("verification")}>
          <Search className="size-4" /> Prendre en vérification
        </button>
      )}
      <button className="btn-primary w-full" disabled={pending} onClick={() => act("valide")}>
        {pending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />} Valider le dossier
      </button>
      <div className="rounded-xl bg-red-50/60 p-3 dark:bg-red-950/30">
        <label className="label" htmlFor="motif">Motif de rejet (envoyé par SMS)</label>
        <select className="input mb-2" value="" onChange={(e) => setMotif(e.target.value)} aria-label="Motifs fréquents">
          <option value="">Motifs fréquents…</option>
          {REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <textarea id="motif" className="input min-h-20 py-2" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Précisez la pièce à corriger" />
        <button className="btn-danger mt-2 w-full" disabled={pending || !motif.trim()} onClick={() => act("rejete")}>
          <X className="size-5" /> Renvoyer pour correction
        </button>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
    </section>
  );
}
