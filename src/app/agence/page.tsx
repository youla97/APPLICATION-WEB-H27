import Link from "next/link";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { pkgById } from "@/lib/data";
import { gnf } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import LiveRefresher from "@/components/LiveRefresher";

export const metadata = { title: "Agence" };

export default async function Agence() {
  const user = await requireUser("agence");
  const ag = get<{ id: number; name: string; license: string; quota: number; active: number }>("SELECT * FROM agences WHERE name=?", user.name ?? "");
  if (!ag) return <p className="card m-8">Aucune agence associée à ce compte.</p>;
  const rows = all<{ id: number; numero: string; full_name: string; status: string; package_id: string; paye: number; group_name: string | null }>(
    `SELECT d.id, d.numero, d.full_name, d.status, d.package_id, d.group_name,
      COALESCE((SELECT SUM(amount) FROM payments p WHERE p.dossier_id=d.id AND p.status='confirme'),0) AS paye
     FROM dossiers d WHERE d.agence_id=? AND d.status <> 'brouillon' ORDER BY d.full_name`,
    ag.id,
  );
  const encaisse = rows.reduce((s, r) => s + r.paye, 0);
  const attendu = rows.filter((r) => ["valide", "complet"].includes(r.status)).reduce((s, r) => s + (pkgById(r.package_id)?.price ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{ag.name}</h1>
          <p className="font-mono text-sm text-stone-500">Agrément {ag.license}</p>
        </div>
        <div className="flex items-center gap-2">
          <LiveRefresher />
          <a href="/api/export?format=complet" className="btn-ghost min-h-10 text-sm"><Download className="size-4" /> Export</a>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card"><div className="text-sm text-stone-500">Quota utilisé</div><div className="text-2xl font-extrabold">{rows.length} / {ag.quota}</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"><div className="h-full bg-emerald-600" style={{ width: `${(rows.length / ag.quota) * 100}%` }} /></div></div>
        <div className="card"><div className="text-sm text-stone-500">Encaissé</div><div className="text-2xl font-extrabold tabular-nums">{gnf(encaisse)}</div></div>
        <div className="card"><div className="text-sm text-stone-500">Reste à encaisser</div><div className="text-2xl font-extrabold tabular-nums">{gnf(Math.max(0, attendu - encaisse))}</div></div>
      </div>
      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800/50"><tr><th className="th">Pèlerin</th><th className="th">Package</th><th className="th">Statut</th><th className="th">Groupe</th><th className="th text-end">Payé</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td"><div className="font-semibold">{r.full_name}</div><div className="font-mono text-xs text-stone-500">{r.numero}</div></td>
                <td className="td">{pkgById(r.package_id)?.name}</td>
                <td className="td"><StatusBadge status={r.status} /></td>
                <td className="td">{r.group_name ?? "—"}</td>
                <td className="td text-end tabular-nums">{gnf(r.paye)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-stone-500">Un proche peut payer avec le numéro de dossier sur <Link href="/payer" className="font-semibold text-emerald-700 underline">la page de paiement</Link>.</p>
    </div>
  );
}
