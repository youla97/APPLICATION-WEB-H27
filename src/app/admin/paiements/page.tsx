import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { PAY_METHODS } from "@/lib/data";
import { dateFr, gnf } from "@/lib/format";
import { Pill } from "@/components/StatusBadge";
import LiveRefresher from "@/components/LiveRefresher";

export const metadata = { title: "Paiements" };

export default async function Paiements() {
  await requireUser("admin");
  const rows = all<{ id: number; ref: string; amount: number; method: string; payer: string; status: string; created_at: string; confirmed_at: string | null; numero: string; dossier_id: number; full_name: string }>(`
    SELECT p.*, d.numero, d.full_name FROM payments p JOIN dossiers d ON d.id=p.dossier_id ORDER BY p.id DESC LIMIT 200`);
  const recon = all<{ method: string; n: number; s: number; pending: number }>(`
    SELECT method, SUM(status='confirme') AS n, SUM(CASE WHEN status='confirme' THEN amount ELSE 0 END) AS s, SUM(status='en_attente') AS pending
    FROM payments GROUP BY method`);
  const refunds = get<{ n: number; s: number }>("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS s FROM payments WHERE status='rembourse'")!;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Paiements & rapprochement</h1>
        <LiveRefresher />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recon.map((r) => (
          <div key={r.method} className="card">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-500">
              <span className="size-3 rounded-full" style={{ background: PAY_METHODS[r.method]?.color }} /> {PAY_METHODS[r.method]?.label}
            </div>
            <div className="mt-2 text-xl font-extrabold tabular-nums">{gnf(r.s)}</div>
            <div className="text-xs text-stone-500">{r.n} transactions rapprochées · {r.pending} en attente</div>
          </div>
        ))}
        <div className="card">
          <div className="text-sm font-semibold text-stone-500">Remboursements</div>
          <div className="mt-2 text-xl font-extrabold tabular-nums">{gnf(refunds.s)}</div>
          <div className="text-xs text-stone-500">{refunds.n} opération(s)</div>
        </div>
      </div>
      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800/50">
            <tr>
              <th className="th">Référence</th><th className="th">Dossier</th><th className="th">Payeur</th><th className="th">Canal</th>
              <th className="th text-end">Montant</th><th className="th">Statut</th><th className="th">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-emerald-50/50 dark:hover:bg-stone-800/50">
                <td className="td font-mono text-xs"><Link href={`/recu/${p.ref}`} className="text-emerald-700 hover:underline dark:text-emerald-400">{p.ref}</Link></td>
                <td className="td"><Link href={`/admin/dossiers/${p.dossier_id}`} className="font-semibold">{p.full_name}</Link><div className="font-mono text-xs text-stone-500">{p.numero}</div></td>
                <td className="td">{p.payer}</td>
                <td className="td">{PAY_METHODS[p.method]?.label}</td>
                <td className="td text-end font-semibold tabular-nums">{gnf(p.amount)}</td>
                <td className="td"><Pill tone={p.status === "confirme" ? "emerald" : p.status === "rembourse" ? "slate" : "amber"}>{p.status === "confirme" ? "Rapproché" : p.status === "rembourse" ? "Remboursé" : "En attente"}</Pill></td>
                <td className="td text-stone-500">{dateFr(p.confirmed_at ?? p.created_at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
