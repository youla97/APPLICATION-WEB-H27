import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { HEALTH_STATUS } from "@/lib/data";
import { dateFr } from "@/lib/format";
import { resolveSos, togglePresence } from "@/app/actions/staff";
import LiveRefresher from "@/components/LiveRefresher";
import Broadcast from "./Broadcast";

export const metadata = { title: "Encadreur" };

export default async function Encadreur({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  await requireUser("encadreur", "admin");
  const groups = all<{ group_name: string; n: number }>(
    "SELECT group_name, COUNT(*) AS n FROM dossiers WHERE group_name IS NOT NULL AND status IN ('valide','complet') GROUP BY group_name ORDER BY CAST(substr(group_name, 8) AS INTEGER)",
  );
  const g = (await searchParams).g ?? groups[0]?.group_name ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const members = all<{ id: number; numero: string; full_name: string; health_status: string; present: number | null; phone: string }>(
    `SELECT d.id, d.numero, d.full_name, d.health_status, p.present, u.phone FROM dossiers d JOIN users u ON u.id=d.user_id
     LEFT JOIN presences p ON p.dossier_id=d.id AND p.day=? WHERE d.group_name=? AND d.status IN ('valide','complet') ORDER BY d.full_name`,
    today, g,
  );
  const sos = all<{ id: number; kind: string; lat: number | null; lng: number | null; created_at: string; full_name: string; group_name: string }>(
    "SELECT s.*, d.full_name, d.group_name FROM sos s JOIN dossiers d ON d.id=s.dossier_id WHERE s.status='ouvert' ORDER BY s.id DESC",
  );
  const present = members.filter((m) => m.present).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Encadrement terrain</h1>
        <LiveRefresher />
      </div>

      {sos.map((s) => (
        <div key={s.id} className="animate-pop mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-gn-red p-4 text-white shadow-lg">
          <span className="text-2xl">🚨</span>
          <div className="flex-1">
            <div className="font-bold">{s.kind === "perdu" ? "Pèlerin perdu" : "Malaise"} · {s.full_name} ({s.group_name})</div>
            <div className="text-sm text-red-100">{dateFr(s.created_at, true)}{s.lat != null ? ` · ${s.lat.toFixed(4)}, ${s.lng?.toFixed(4)}` : " · position indisponible"}</div>
          </div>
          {s.lat != null && <a className="btn min-h-10 bg-white/15 text-sm text-white" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=17/${s.lat}/${s.lng}`}>Itinéraire</a>}
          <form action={resolveSos.bind(null, s.id)}><button className="btn min-h-10 bg-white text-sm text-red-700">J&apos;y vais</button></form>
        </div>
      ))}

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {groups.map((x) => (
          <Link key={x.group_name} href={`/encadreur?g=${encodeURIComponent(x.group_name)}`} className={`chip shrink-0 px-3 py-1.5 text-sm ${x.group_name === g ? "bg-emerald-700 text-white" : "bg-white ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700"}`}>
            {x.group_name} · {x.n}
          </Link>
        ))}
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Appel du jour · {g}</h2>
            <span className="text-sm font-semibold tabular-nums">{present}/{members.length} présents</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
            <div className="h-full bg-emerald-600 transition-[width]" style={{ width: `${(present / Math.max(1, members.length)) * 100}%` }} />
          </div>
          <ul className="mt-3 space-y-1.5">
            {members.map((m) => (
              <li key={m.id}>
                <form action={togglePresence.bind(null, m.id, today)}>
                  <button className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-start transition ${m.present ? "bg-emerald-50 dark:bg-emerald-950/50" : "bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/50"}`}>
                    <span className={`grid size-7 place-items-center rounded-full text-sm font-bold ${m.present ? "bg-emerald-600 text-white" : "border-2 border-stone-300"}`}>{m.present ? "✓" : ""}</span>
                    <span className="flex-1 font-semibold">{m.full_name}</span>
                    {m.health_status === "a_risque" && <span title={HEALTH_STATUS.a_risque}>🩺</span>}
                    <span className="text-xs text-stone-500">+224 {m.phone}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
        <Broadcast group={g} />
      </div>
    </div>
  );
}
