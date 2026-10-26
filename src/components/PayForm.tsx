"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { startPayment, paymentStatus } from "@/app/actions/payment";
import { gnf } from "@/lib/format";

const METHODS = [
  { id: "orange", label: "Orange Money", bg: "bg-[#ff7900]", text: "text-white", hint: "Validez avec votre code secret (#144#)" },
  { id: "mtn", label: "MTN MoMo", bg: "bg-[#ffcc00]", text: "text-stone-900", hint: "Validez la demande reçue (*440#)" },
  { id: "banque", label: "Carte / virement", bg: "bg-emerald-800", text: "text-white", hint: "Diaspora : carte Visa / Mastercard" },
];

export default function PayForm({ numero, remaining, total, payerDefault, proche = false }: { numero: string; remaining: number; total: number; payerDefault?: string; proche?: boolean }) {
  const tranche = Math.min(remaining, Math.round(total / 3));
  const [method, setMethod] = useState("orange");
  const [amount, setAmount] = useState(tranche);
  const [phone, setPhone] = useState("");
  const [payer, setPayer] = useState(payerDefault ?? "");
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [pending, start] = useTransition();

  // Attente de la confirmation de l'opérateur (notification serveur)
  useEffect(() => {
    if (!ref || status === "confirme") return;
    const id = setInterval(async () => {
      setStatus(await paymentStatus(ref));
    }, 1200);
    return () => clearInterval(id);
  }, [ref, status]);

  if (ref) {
    const ok = status === "confirme";
    return (
      <div className="card animate-pop p-8 text-center">
        {ok ? (
          <>
            <CheckCircle2 className="animate-pop mx-auto size-20 text-emerald-600" />
            <h2 className="mt-4 text-2xl font-extrabold">Paiement confirmé</h2>
            <p className="mt-1 text-stone-500">{gnf(amount)} · réf. {ref}</p>
            <p className="mt-1 text-sm text-stone-500">Un SMS de confirmation a été envoyé{proche ? " au pèlerin" : ""}.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href={`/recu/${ref}`} className="btn-primary">🧾 Voir le reçu</Link>
              {!proche && <Link href="/espace" className="btn-ghost">Retour à mon espace</Link>}
            </div>
          </>
        ) : (
          <>
            <div className="relative mx-auto grid size-24 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-300/40" />
              <Smartphone className="relative size-12 text-amber-600" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold">Validez sur votre téléphone</h2>
            <p className="mt-2 text-stone-500">{METHODS.find((m) => m.id === method)?.hint}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-500"><Loader2 className="size-4 animate-spin" /> En attente de la confirmation de l&apos;opérateur…</p>
            <p className="mt-2 text-xs text-stone-400">Démonstration : la confirmation arrive automatiquement en quelques secondes.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <form
      className="card space-y-5 p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const r = await startPayment({ numero, method, amount, payer, payerPhone: phone });
          if (!r.ok) return setError(r.error ?? "Erreur");
          setRef(r.ref!);
          setStatus("en_attente");
        });
      }}
    >
      <div>
        <span className="label">Moyen de paiement</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              aria-pressed={method === m.id}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-start transition sm:flex-col sm:items-start ${method === m.id ? "border-emerald-600 ring-4 ring-emerald-600/15" : "border-stone-200 dark:border-stone-700"}`}
            >
              <span className={`grid size-11 place-items-center rounded-xl text-sm font-extrabold ${m.bg} ${m.text}`}>{m.label.slice(0, 2).toUpperCase()}</span>
              <span className="font-bold">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Montant</span>
        <div className="mb-2 flex flex-wrap gap-2">
          {[
            ["1 tranche", tranche],
            ["Tout le reste", remaining],
          ].map(([l, v]) => (
            <button key={String(l)} type="button" onClick={() => setAmount(Number(v))} className={`chip px-3 py-1.5 text-sm ${amount === v ? "bg-emerald-700 text-white" : "bg-stone-100 dark:bg-stone-800"}`}>
              {l} · {gnf(Number(v))}
            </button>
          ))}
        </div>
        <div className="relative">
          <input type="number" className="input pe-16 text-xl font-bold tabular-nums" value={amount} min={0} max={remaining} step={1} onChange={(e) => setAmount(Number(e.target.value))} />
          <span className="absolute end-4 top-1/2 -translate-y-1/2 font-semibold text-stone-400">GNF</span>
        </div>
        <p className="mt-1 text-sm text-stone-500">Reste à payer : <b>{gnf(remaining)}</b></p>
      </div>

      {method !== "banque" && (
        <div>
          <label className="label" htmlFor="mm">Numéro {method === "orange" ? "Orange Money" : "MTN MoMo"}</label>
          <input id="mm" className="input" inputMode="tel" placeholder="62x xx xx xx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
      )}
      {proche && (
        <div>
          <label className="label" htmlFor="payer">Votre nom (payeur)</label>
          <input id="payer" className="input" value={payer} onChange={(e) => setPayer(e.target.value)} required />
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{error}</p>}
      <button className="btn-primary w-full text-lg" disabled={pending}>
        {pending && <Loader2 className="size-5 animate-spin" />} Payer {gnf(amount || 0)}
      </button>
      <p className="text-center text-xs text-stone-400">🔒 Paiement sécurisé · reçu avec QR code · rapprochement automatique</p>
    </form>
  );
}
