import Link from "next/link";
import { Download, Siren, Users, CheckCircle2, Wallet, Star, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { REGIONS, STATUS, PACKAGES } from "@/lib/data";
import { dateFr, gnf } from "@/lib/format";
import { resolveSos } from "@/app/actions/staff";
import LiveRefresher from "@/components/LiveRefresher";

export const metadata = { title: "Pilotage" };

// Couleurs d'état (statuts réservés), du brouillon au dossier complet
const STATUS_COLORS: Record<string, string> = {
  brouillon: "#a8a29e",
  soumis: "#0ea5e9",
  verification: "#f59e0b",
  valide: "#10b981",
  complet: "#047857",
  rejete: "#dc2626",
};

export default async function Admin() {
  await requireUser("admin");
  const k = get<{ total: number; deposes: number; valides: number; complets: number; attente: number; rating: number | null; nrating: number }>(`
    SELECT COUNT(*) AS total,
      SUM(status <> 'brouillon') AS deposes,
      SUM(status IN ('valide','complet')) AS valides,
      SUM(status = 'complet') AS complets,
      SUM(status IN ('soumis','verification')) AS attente,
      AVG(rating) AS rating, COUNT(rating) AS nrating
    FROM dossiers`)!;
  const money = get<{ encaisse: number; n: number }>("SELECT COALESCE(SUM(amount),0) AS encaisse, COUNT(*) AS n FROM payments WHERE status='confirme'")!;
  const attendu = all<{ package_id: string; n: number }>("SELECT package_id, COUNT(*) AS n FROM dossiers WHERE status IN ('valide','complet') GROUP BY package_id").reduce(
    (s, r) => s + (PACKAGES.find((p) => p.id === r.package_id)?.price ?? 0) * r.n,
    0,
  );
  const delay = get<{ h: number | null }>("SELECT AVG((julianday(validated_at) - julianday(submitted_at)) * 24) AS h FROM dossiers WHERE validated_at IS NOT NULL AND submitted_at IS NOT NULL")!;
  const byRegion = all<{ region: string; deposes: number; valides: number; quota: number }>(`
    SELECT q.region, q.quota,
      (SELECT COUNT(*) FROM dossiers d WHERE d.region=q.region AND d.status <> 'brouillon') AS deposes,
      (SELECT COUNT(*) FROM dossiers d WHERE d.region=q.region AND d.status IN ('valide','complet')) AS valides
    FROM quotas q`);
  byRegion.sort((a, b) => REGIONS.indexOf(a.region as never) - REGIONS.indexOf(b.region as never));
  const maxDep = Math.max(1, ...byRegion.map((r) => r.deposes));
  const byStatus = all<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM dossiers GROUP BY status");
  const statusOrder = ["brouillon", "soumis", "verification", "valide", "complet", "rejete"];
  const byMethod = all<{ method: string; s: number }>("SELECT method, SUM(amount) AS s FROM payments WHERE status='confirme' GROUP BY method ORDER BY s DESC");
  const sos = all<{ id: number; kind: string; lat: number | null; lng: number | null; created_at: string; full_name: string; numero: string; group_name: string | null }>(`
    SELECT s.*, d.full_name, d.numero, d.group_name FROM sos s JOIN dossiers d ON d.id=s.dossier_id WHERE s.status='ouvert' ORDER BY s.id DESC`);
  const recent = all<{ id: number; at: string; actor: string; action: string; target: string | null }>("SELECT * FROM audit ORDER BY id DESC LIMIT 8");

  const kpis = [
    { icon: Users, label: "Dossiers déposés", value: (k.deposes ?? 0).toLocaleString("fr-FR"), sub: `${k.attente ?? 0} en attente de validation` },
    { icon: CheckCircle2, label: "Dossiers validés", value: (k.valides ?? 0).toLocaleString("fr-FR"), sub: `${k.complets ?? 0} complets (badge émis)` },
    { icon: Wallet, label: "Montant encaissé", value: gnf(money.encaisse), sub: `${Math.round((money.encaisse / Math.max(1, attendu)) * 100)} % de ${gnf(attendu)} attendus` },
    { icon: Clock, label: "Délai moyen de validation", value: delay.h == null ? "—" : `${Math.round(delay.h)} h`, sub: "Objectif : < 72 h" },
    { icon: Star, label: "Satisfaction", value: k.rating ? `${k.rating.toFixed(1)} / 5` : "—", sub: `${k.nrating} avis · objectif ≥ 4/5` },
  ];
  const totalStatus = byStatus.reduce((s, r) => s + r.n, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Tableau de bord</h1>
          <p className="text-stone-500">Campagne Hadj 2027 · mise à jour en temps réel</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LiveRefresher />
          <a href="/api/export?format=complet" className="btn-ghost min-h-10 text-sm"><Download className="size-4" /> Export Excel</a>
          <a href="/api/export?format=vol" className="btn-ghost min-h-10 text-sm"><Download className="size-4" /> Liste passagers</a>
        </div>
      </div>

      {sos.length > 0 && (
        <section className="animate-pop mt-6 rounded-2xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <h2 className="flex items-center gap-2 font-bold text-red-800 dark:text-red-300"><Siren className="size-5 animate-pulse" /> {sos.length} alerte(s) SOS en cours</h2>
          <ul className="mt-3 space-y-2">
            {sos.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 text-sm dark:bg-stone-900">
                <span className="chip bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">{s.kind === "perdu" ? "📍 Pèlerin perdu" : "🩺 Malaise"}</span>
                <span className="font-semibold">{s.full_name}</span>
                <span className="font-mono text-xs text-stone-500">{s.numero}</span>
                <span className="text-stone-500">{s.group_name}</span>
                {s.lat != null && (
                  <a className="text-emerald-700 underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=17/${s.lat}/${s.lng}`}>Voir la position</a>
                )}
                <span className="text-xs text-stone-400">{dateFr(s.created_at, true)}</span>
                <form action={resolveSos.bind(null, s.id)} className="ms-auto">
                  <button className="btn-danger min-h-9 px-3 text-sm">Prendre en charge</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((c) => (
          <div key={c.label} className="card">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-500"><c.icon className="size-4 text-emerald-700" /> {c.label}</div>
            <div className="mt-2 text-2xl font-extrabold tabular-nums">{c.value}</div>
            <div className="mt-1 text-xs text-stone-500">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="font-bold">Dossiers par région</h2>
          <p className="text-sm text-stone-500">Déposés et validés, rapportés au quota régional</p>
          <div className="mt-2 flex gap-4 text-xs text-stone-500">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" /> Déposés</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-emerald-700 dark:bg-emerald-500" /> Validés</span>
          </div>
          <ul className="mt-4 space-y-3">
            {byRegion.map((r) => (
              <li key={r.region} className="group grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm" title={`${r.region} : ${r.deposes} déposés, ${r.valides} validés, quota ${r.quota}`}>
                <span className="truncate font-semibold">{r.region}</span>
                <div className="relative h-5 overflow-hidden rounded-e bg-stone-100 dark:bg-stone-800">
                  <div className="absolute inset-y-0 start-0 rounded-e bg-emerald-200 transition-[width] duration-700 dark:bg-emerald-900" style={{ width: `${(r.deposes / maxDep) * 100}%` }} />
                  <div className="absolute inset-y-0 start-0 rounded-e border-e-2 border-white bg-emerald-700 transition-[width] duration-700 dark:border-stone-900 dark:bg-emerald-500" style={{ width: `${(r.valides / maxDep) * 100}%` }} />
                </div>
                <span className="w-28 text-end tabular-nums text-stone-600 dark:text-stone-400">
                  <b className="text-stone-900 dark:text-stone-100">{r.valides}</b> / {r.deposes} · <span className="text-xs">quota {r.quota.toLocaleString("fr-FR")}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="font-bold">Statut des dossiers</h2>
          <div className="mt-4 flex h-6 gap-[2px] overflow-hidden rounded-md" role="img" aria-label="Répartition des statuts">
            {statusOrder.map((s) => {
              const n = byStatus.find((b) => b.status === s)?.n ?? 0;
              return n ? <div key={s} title={`${STATUS[s].label} : ${n}`} style={{ width: `${(n / totalStatus) * 100}%`, background: STATUS_COLORS[s] }} /> : null;
            })}
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {statusOrder.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className="size-3 rounded-sm" style={{ background: STATUS_COLORS[s] }} />
                <span className="flex-1">{STATUS[s].label}</span>
                <span className="font-semibold tabular-nums">{byStatus.find((b) => b.status === s)?.n ?? 0}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 font-bold">Encaissements par canal</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {byMethod.map((m) => (
              <li key={m.method} className="flex justify-between">
                <span>{m.method === "orange" ? "Orange Money" : m.method === "mtn" ? "MTN MoMo" : "Banque / carte"}</span>
                <span className="font-semibold tabular-nums">{gnf(m.s)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Activité récente</h2>
          <Link href="/admin/audit" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Journal complet →</Link>
        </div>
        <ul className="mt-3 divide-y divide-stone-100 text-sm dark:divide-stone-800">
          {recent.map((a) => (
            <li key={a.id} className="flex flex-wrap gap-x-3 py-2">
              <span className="w-36 shrink-0 text-stone-400">{dateFr(a.at, true)}</span>
              <span className="font-semibold">{a.action}</span>
              <span className="font-mono text-xs text-stone-500">{a.target}</span>
              <span className="ms-auto text-stone-500">{a.actor}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
