import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { PACKAGES, REGIONS } from "@/lib/data";
import { dateFr } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import AssistedForm from "./AssistedForm";

export const metadata = { title: "Inscription assistée" };

export default async function Agent() {
  const user = await requireUser("agent", "admin");
  const mine = all<{ id: number; numero: string; full_name: string; status: string; created_at: string }>(
    "SELECT id, numero, full_name, status, created_at FROM dossiers WHERE created_by=? ORDER BY id DESC LIMIT 20",
    user.id,
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Inscription assistée</h1>
      <p className="text-stone-500">Pour les pèlerins sans smartphone : ils reçoivent toutes les alertes par SMS. Préfecture : <b>{user.region ?? "toutes"}</b></p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <AssistedForm regions={[...REGIONS]} packages={PACKAGES.map((p) => ({ id: p.id, name: p.name }))} defaultRegion={user.region ?? ""} />
        <section className="card h-fit">
          <h2 className="font-bold">Mes inscriptions ({mine.length})</h2>
          <ul className="mt-3 divide-y divide-stone-100 text-sm dark:divide-stone-800">
            {mine.length === 0 && <li className="py-3 text-stone-500">Aucune inscription pour le moment.</li>}
            {mine.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1">
                  <Link href={`/admin/dossiers/${d.id}`} className="font-semibold hover:underline">{d.full_name}</Link>
                  <div className="font-mono text-xs text-stone-500">{d.numero} · {dateFr(d.created_at, true)}</div>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
