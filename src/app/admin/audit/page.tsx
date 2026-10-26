import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { dateFr } from "@/lib/format";
import LiveRefresher from "@/components/LiveRefresher";

export const metadata = { title: "Journal d'audit" };

export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser("admin");
  const q = ((await searchParams).q ?? "").trim();
  const rows = all<{ id: number; at: string; actor: string; action: string; target: string | null; details: string | null }>(
    q ? "SELECT * FROM audit WHERE actor LIKE ?1 OR action LIKE ?1 OR target LIKE ?1 OR details LIKE ?1 ORDER BY id DESC LIMIT 500" : "SELECT * FROM audit ORDER BY id DESC LIMIT 500",
    ...(q ? [`%${q}%`] : []),
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Journal d&apos;audit</h1>
          <p className="text-sm text-stone-500">🔒 Non modifiable : toute modification ou suppression est bloquée au niveau de la base de données.</p>
        </div>
        <LiveRefresher />
      </div>
      <form className="mt-4">
        <input name="q" defaultValue={q} className="input max-w-md" placeholder="Filtrer : acteur, action, n° de dossier…" />
      </form>
      <div className="card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-stone-50 dark:bg-stone-800/50">
            <tr><th className="th">#</th><th className="th">Quand</th><th className="th">Qui</th><th className="th">Quoi</th><th className="th">Cible</th><th className="th">Détails</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td text-stone-400 tabular-nums">{r.id}</td>
                <td className="td whitespace-nowrap text-stone-500">{dateFr(r.at, true)}</td>
                <td className="td">{r.actor}</td>
                <td className="td font-semibold">{r.action}</td>
                <td className="td font-mono text-xs">{r.target}</td>
                <td className="td text-stone-600 dark:text-stone-400">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
