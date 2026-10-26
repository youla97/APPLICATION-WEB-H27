"use client";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { lookupDossier } from "@/app/actions/payment";
import { gnf } from "@/lib/format";
import PayForm from "@/components/PayForm";

type Found = { name: string; numero: string; remaining: number; total: number };

export default function ProchePay() {
  const [numero, setNumero] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (found)
    return (
      <div className="space-y-4">
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm text-stone-500">Pèlerin</div>
            <div className="text-lg font-bold">{found.name}</div>
            <div className="font-mono text-sm">{found.numero}</div>
          </div>
          <div className="text-end">
            <div className="text-sm text-stone-500">Reste à payer</div>
            <div className="text-lg font-extrabold text-emerald-800 dark:text-emerald-400">{gnf(found.remaining)}</div>
          </div>
        </div>
        {found.remaining > 0 ? <PayForm numero={found.numero} remaining={found.remaining} total={found.total} proche /> : <p className="card text-center font-semibold">✅ Ce Hadj est déjà entièrement payé.</p>}
      </div>
    );

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const r = await lookupDossier(numero);
          if (!r.ok) return setError(r.error);
          setFound(r);
        });
      }}
    >
      <label className="label" htmlFor="num">Numéro de dossier du pèlerin</label>
      <input id="num" className="input font-mono text-lg uppercase" placeholder="HJ27-00012-ABC" value={numero} onChange={(e) => setNumero(e.target.value)} required />
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />} Rechercher
      </button>
    </form>
  );
}
