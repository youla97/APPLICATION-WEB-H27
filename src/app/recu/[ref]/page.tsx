import { notFound } from "next/navigation";
import Link from "next/link";
import { get } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { dossierById, paidAmount, priceOf } from "@/lib/dossier";
import { PAY_METHODS, pkgById } from "@/lib/data";
import { dateFr, gnf } from "@/lib/format";
import { verifyQr } from "@/lib/verify";
import Logo from "@/components/Logo";
import PrintButton from "@/components/PrintButton";
import type { Payment } from "@/lib/dossier";

export const metadata = { title: "Reçu de paiement" };

export default async function Receipt({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const p = get<Payment>("SELECT * FROM payments WHERE ref=?", ref);
  if (!p || p.status === "en_attente") notFound();
  const d = dossierById(p.dossier_id)!;
  const user = await getUser();
  const qr = await verifyQr("R", p.ref);
  const pkg = pkgById(d.package_id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={user?.role === "pelerin" ? "/espace" : "/"} className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">← Retour</Link>
        <PrintButton />
      </div>
      <article className="card overflow-hidden p-0 text-stone-900 dark:bg-white">
        <div className="flag-bar h-1.5" />
        <div className="pattern flex items-center gap-3 bg-emerald-900 p-5 text-white">
          <Logo className="size-12" />
          <div>
            <div className="text-lg font-extrabold">Reçu de paiement · Hadj 2027</div>
            <div className="text-sm text-emerald-100/80">République de Guinée · SGAR / COGEP</div>
          </div>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-stone-500">Référence</dt><dd className="font-mono font-bold">{p.ref}</dd>
            <dt className="text-stone-500">Date</dt><dd>{dateFr(p.confirmed_at ?? p.created_at, true)}</dd>
            <dt className="text-stone-500">Pèlerin</dt><dd className="font-semibold">{d.full_name}</dd>
            <dt className="text-stone-500">Dossier</dt><dd className="font-mono">{d.numero}</dd>
            <dt className="text-stone-500">Package</dt><dd>{pkg?.name}</dd>
            <dt className="text-stone-500">Payé par</dt><dd>{p.payer}</dd>
            <dt className="text-stone-500">Moyen</dt><dd>{PAY_METHODS[p.method]?.label}</dd>
            <dt className="text-stone-500">Statut</dt>
            <dd className={p.status === "rembourse" ? "font-bold text-red-700" : "font-bold text-emerald-700"}>{p.status === "rembourse" ? "REMBOURSÉ" : "CONFIRMÉ"}</dd>
          </dl>
          <div className="text-center">
            <div className="mx-auto size-36" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="mt-1 text-[11px] text-stone-500">Scannez pour vérifier</p>
          </div>
        </div>
        <div className="mx-6 mb-6 rounded-xl bg-sand-100 p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Montant</span>
            <span className="text-2xl font-extrabold tabular-nums">{gnf(p.amount)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-stone-600">
            <span>Total payé à ce jour</span>
            <span className="tabular-nums">{gnf(paidAmount(d.id))} / {gnf(priceOf(d))}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
