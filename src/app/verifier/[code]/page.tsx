import Link from "next/link";
import { ShieldCheck, ShieldX } from "lucide-react";
import { checkCode } from "@/lib/verify";
import { get } from "@/lib/db";
import { dossierByNumero } from "@/lib/dossier";
import { PAY_METHODS, STATUS } from "@/lib/data";
import { dateFr, gnf } from "@/lib/format";

export const metadata = { title: "Vérification de document" };

const mask = (name?: string | null) => (name ?? "").split(" ").map((p, i) => (i === 0 ? p : p[0] + ".")).join(" ");

export default async function Verify({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = checkCode(code);
  let rows: [string, string][] | null = null;
  let title = "";
  if (c?.kind === "R") {
    const p = get<{ ref: string; amount: number; method: string; status: string; confirmed_at: string; dossier_id: number }>("SELECT * FROM payments WHERE ref=?", c.id);
    const d = p && get<{ numero: string; full_name: string }>("SELECT numero, full_name FROM dossiers WHERE id=?", p.dossier_id);
    if (p && d) {
      title = "Reçu de paiement authentique";
      rows = [["Référence", p.ref], ["Pèlerin", mask(d.full_name)], ["Dossier", d.numero], ["Montant", gnf(p.amount)], ["Moyen", PAY_METHODS[p.method]?.label], ["Date", dateFr(p.confirmed_at, true)], ["Statut", p.status === "rembourse" ? "Remboursé" : "Confirmé"]];
    }
  } else if (c && (c.kind === "B" || c.kind === "F")) {
    const d = dossierByNumero(c.id);
    if (d) {
      title = c.kind === "B" ? "Badge pèlerin authentique" : "Fiche d'inscription authentique";
      rows = [["Pèlerin", mask(d.full_name)], ["Dossier", d.numero], ["Statut", STATUS[d.status]?.label], ["Groupe", d.group_name ?? "—"], ["Hôtel La Mecque", d.hotel_mecque ?? "—"], ["Tente Mina", d.tente ?? "—"]];
    }
  }

  return (
    <div className="pattern-light min-h-[calc(100dvh-68px)] px-4 py-12">
      <div className="card animate-pop mx-auto max-w-md text-center">
        {rows ? <ShieldCheck className="mx-auto size-16 text-emerald-600" /> : <ShieldX className="mx-auto size-16 text-red-600" />}
        <h1 className="mt-3 text-2xl font-extrabold">{rows ? title : "Document non reconnu"}</h1>
        <p className="mt-1 text-sm text-stone-500">{rows ? "Ce document a bien été émis par la plateforme Hadj 2027 Guinée." : "Ce QR code est invalide ou a été falsifié."}</p>
        {rows && (
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-start text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-stone-500">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <Link href="/" className="btn-ghost mt-6 w-full">Accueil</Link>
      </div>
    </div>
  );
}
