import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { addAgence, toggleAgence, updateQuota } from "@/app/actions/staff";
import { Pill } from "@/components/StatusBadge";

export const metadata = { title: "Quotas & agences" };

async function saveQuota(form: FormData) {
  "use server";
  await updateQuota(String(form.get("region")), Number(form.get("quota")));
}

async function newAgence(form: FormData) {
  "use server";
  await addAgence(String(form.get("name") ?? ""), String(form.get("license") ?? ""), Number(form.get("quota") ?? 0));
}

export default async function Parametres() {
  await requireUser("admin");
  const quotas = all<{ region: string; quota: number; used: number }>(`
    SELECT q.region, q.quota, (SELECT COUNT(*) FROM dossiers d WHERE d.region=q.region AND d.status IN ('valide','complet')) AS used FROM quotas q`);
  const agences = all<{ id: number; name: string; license: string; quota: number; active: number; used: number }>(`
    SELECT a.*, (SELECT COUNT(*) FROM dossiers d WHERE d.agence_id=a.id AND d.status <> 'brouillon') AS used FROM agences a ORDER BY a.name`);
  const total = quotas.reduce((s, q) => s + q.quota, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Quotas & agences</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-bold">Quotas par région</h2>
          <p className="text-sm text-stone-500">Quota national : {total.toLocaleString("fr-FR")} places. Un dossier ne peut être validé au-delà du quota.</p>
          <ul className="mt-4 space-y-3">
            {quotas.map((q) => {
              const pct = Math.min(100, (q.used / Math.max(1, q.quota)) * 100);
              return (
                <li key={q.region}>
                  <form action={saveQuota} className="flex items-center gap-3">
                    <input type="hidden" name="region" value={q.region} />
                    <span className="w-28 font-semibold">{q.region}</span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                        <div className={`h-full rounded-full ${pct > 90 ? "bg-red-600" : pct > 70 ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-stone-500">{q.used} validés</span>
                    </div>
                    <input name="quota" type="number" defaultValue={q.quota} min={0} className="input min-h-10 w-24 text-end" aria-label={`Quota ${q.region}`} />
                    <button className="btn-ghost min-h-10 px-3 text-sm">OK</button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="card">
          <h2 className="font-bold">Agences agréées</h2>
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {agences.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1">
                  <div className="font-semibold">{a.name}</div>
                  <div className="font-mono text-xs text-stone-500">{a.license}</div>
                </div>
                <span className="text-sm tabular-nums">{a.used} / {a.quota}</span>
                <Pill tone={a.active ? "emerald" : "red"}>{a.active ? "Active" : "Suspendue"}</Pill>
                <form action={toggleAgence.bind(null, a.id)}>
                  <button className="text-sm font-semibold text-stone-500 hover:text-emerald-700">{a.active ? "Suspendre" : "Réactiver"}</button>
                </form>
              </li>
            ))}
          </ul>
          <form action={newAgence} className="mt-4 grid gap-2 rounded-xl bg-sand-50 p-3 sm:grid-cols-[1fr_1fr_6rem_auto] dark:bg-stone-800/50">
            <input name="name" className="input min-h-10" placeholder="Nom de l'agence" required />
            <input name="license" className="input min-h-10" placeholder="N° d'agrément" required />
            <input name="quota" type="number" className="input min-h-10" placeholder="Quota" required />
            <button className="btn-primary min-h-10 text-sm">Ajouter</button>
          </form>
        </section>
      </div>
    </div>
  );
}
