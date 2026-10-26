import Link from "next/link";
import { Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { REGIONS, STATUS, pkgById } from "@/lib/data";
import { dateFr, gnf } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import LiveRefresher from "@/components/LiveRefresher";

export const metadata = { title: "Dossiers" };

type Row = { id: number; numero: string; full_name: string; region: string; package_id: string; status: string; submitted_at: string; paye: number; rejection_reason: string | null; phone: string };

export default async function Dossiers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("admin", "agent");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? (user.role === "admin" ? "a_traiter" : "");
  const region = user.role === "agent" ? (user.region ?? "") : (sp.region ?? "");

  const where: string[] = ["d.status <> 'brouillon'"];
  const params: string[] = [];
  if (q) {
    where.push("(d.numero LIKE ? OR d.full_name LIKE ? OR d.passport_no LIKE ? OR u.phone LIKE ?)");
    params.push(...Array(4).fill(`%${q}%`));
  }
  if (status === "a_traiter") where.push("d.status IN ('soumis','verification')");
  else if (status === "doublons") where.push("d.rejection_reason LIKE '⚠ Doublon%'");
  else if (status) { where.push("d.status = ?"); params.push(status); }
  if (region) { where.push("d.region = ?"); params.push(region); }

  const rows = all<Row>(
    `SELECT d.id, d.numero, d.full_name, d.region, d.package_id, d.status, d.submitted_at, d.rejection_reason, u.phone,
      COALESCE((SELECT SUM(amount) FROM payments p WHERE p.dossier_id=d.id AND p.status='confirme'),0) AS paye
     FROM dossiers d JOIN users u ON u.id=d.user_id WHERE ${where.join(" AND ")} ORDER BY d.submitted_at ASC LIMIT 300`,
    ...params,
  );

  const tabs = [
    ["a_traiter", "À traiter"],
    ["", "Tous"],
    ["valide", "Validés"],
    ["complet", "Complets"],
    ["rejete", "À corriger"],
    ["doublons", "Doublons"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Dossiers {user.role === "agent" && <span className="text-lg text-stone-500">· {user.region}</span>}</h1>
        <LiveRefresher />
      </div>
      <form className="mt-5 flex flex-wrap gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
          <input name="q" defaultValue={q} className="input ps-12" placeholder="Rechercher : nom, n° de dossier, passeport, téléphone…" />
        </div>
        <input type="hidden" name="status" value={status} />
        {user.role === "admin" && (
          <select name="region" defaultValue={region} className="input w-auto">
            <option value="">Toutes les régions</option>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        )}
        <button className="btn-primary">Filtrer</button>
      </form>
      <nav className="mt-4 flex flex-wrap gap-2">
        {tabs.map(([v, l]) => (
          <Link key={v} href={`/admin/dossiers?status=${v}&q=${encodeURIComponent(q)}&region=${encodeURIComponent(region)}`} className={`chip px-3 py-1.5 text-sm ${status === v ? "bg-emerald-700 text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:ring-stone-700"}`}>
            {l}
          </Link>
        ))}
      </nav>
      <div className="card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800/50">
            <tr>
              <th className="th">Dossier</th>
              <th className="th">Pèlerin</th>
              <th className="th">Région</th>
              <th className="th">Package</th>
              <th className="th">Statut</th>
              <th className="th text-end">Payé</th>
              <th className="th">Déposé</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="td py-10 text-center text-stone-500">Aucun dossier ne correspond.</td></tr>
            )}
            {rows.map((r) => {
              const price = pkgById(r.package_id)?.price ?? 1;
              return (
                <tr key={r.id} className="transition hover:bg-emerald-50/50 dark:hover:bg-stone-800/50">
                  <td className="td font-mono text-xs"><Link href={`/admin/dossiers/${r.id}`} className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">{r.numero}</Link></td>
                  <td className="td">
                    <Link href={`/admin/dossiers/${r.id}`} className="font-semibold">{r.full_name}</Link>
                    {r.rejection_reason?.startsWith("⚠") && <div className="text-xs font-semibold text-amber-700">{r.rejection_reason}</div>}
                  </td>
                  <td className="td">{r.region}</td>
                  <td className="td">{pkgById(r.package_id)?.name}</td>
                  <td className="td"><StatusBadge status={r.status} /></td>
                  <td className="td text-end tabular-nums" title={gnf(r.paye)}>
                    <div className="ms-auto h-1.5 w-20 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"><div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, (r.paye / price) * 100)}%` }} /></div>
                    <span className="text-xs text-stone-500">{Math.round((r.paye / price) * 100)} %</span>
                  </td>
                  <td className="td text-stone-500">{dateFr(r.submitted_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone-500">{rows.length} dossier(s) · {Object.keys(STATUS).length} statuts possibles</p>
    </div>
  );
}
