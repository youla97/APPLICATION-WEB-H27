import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { HEALTH_STATUS } from "@/lib/data";
import { setHealth } from "@/app/actions/staff";
import { Pill } from "@/components/StatusBadge";
import { ageOf } from "@/lib/format";
import LiveRefresher from "@/components/LiveRefresher";

export const metadata = { title: "Mission médicale" };

const RISKY = ["Diabète", "Hypertension", "Maladie cardiaque", "Asthme / maladie respiratoire", "Insuffisance rénale", "Mobilité réduite", "Grossesse"];

async function decide(id: number, decision: "apte" | "inapte" | "a_risque", form: FormData) {
  "use server";
  await setHealth(id, decision, String(form.get("note") ?? ""));
}

export default async function Medecin() {
  await requireUser("medecin", "admin");
  const queue = all<{ id: number; numero: string; full_name: string; birth_date: string; health: string; group_name: string | null }>(
    "SELECT id, numero, full_name, birth_date, health, group_name FROM dossiers WHERE health_status='soumis' ORDER BY updated_at",
  );
  const counts = all<{ health_status: string; n: number }>("SELECT health_status, COUNT(*) AS n FROM dossiers WHERE status IN ('valide','complet') GROUP BY health_status");
  const risk = all<{ id: number; numero: string; full_name: string; group_name: string | null; health: string | null }>(
    "SELECT id, numero, full_name, group_name, health FROM dossiers WHERE health_status='a_risque' ORDER BY full_name",
  );
  const sos = get<{ n: number }>("SELECT COUNT(*) AS n FROM sos WHERE status='ouvert' AND kind='malaise'")!.n;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Mission médicale</h1>
        <LiveRefresher />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {Object.entries(HEALTH_STATUS).map(([k, l]) => (
          <div key={k} className="card p-4">
            <div className="text-xs font-semibold text-stone-500">{l}</div>
            <div className="text-2xl font-extrabold tabular-nums">{counts.find((c) => c.health_status === k)?.n ?? 0}</div>
          </div>
        ))}
      </div>
      {sos > 0 && <p className="mt-4 rounded-xl bg-red-50 p-3 font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">🚨 {sos} alerte(s) malaise en cours — voir le tableau de bord terrain.</p>}

      <h2 className="mt-8 text-xl font-bold">Fiches à examiner ({queue.length})</h2>
      <div className="mt-3 space-y-4">
        {queue.length === 0 && <p className="card text-stone-500">Aucune fiche en attente.</p>}
        {queue.map((d) => {
          const h = JSON.parse(d.health || "{}") as Record<string, string | boolean>;
          const conditions = RISKY.filter((c) => h[c]);
          const age = ageOf(d.birth_date) ?? 0;
          return (
            <form key={d.id} action={decide.bind(null, d.id, "apte")} className="card grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{d.full_name}</span>
                  <span className="font-mono text-xs text-stone-500">{d.numero}</span>
                  <Pill tone={age >= 70 ? "amber" : "slate"}>{age} ans</Pill>
                  {conditions.length > 0 && <Pill tone="red">⚠ à risque</Pill>}
                </div>
                <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  <div><dt className="inline text-stone-500">Méningite : </dt><dd className="inline font-semibold">{String(h.meningite ?? "—")}</dd></div>
                  <div><dt className="inline text-stone-500">Groupe sanguin : </dt><dd className="inline font-semibold">{String(h.blood || "inconnu")}</dd></div>
                  <div className="sm:col-span-2"><dt className="inline text-stone-500">Antécédents : </dt><dd className="inline font-semibold">{conditions.join(", ") || "aucun"}</dd></div>
                  <div className="sm:col-span-2"><dt className="inline text-stone-500">Traitements : </dt><dd className="inline">{String(h.traitements || "—")}</dd></div>
                </dl>
                <input name="note" className="input mt-3 min-h-10" placeholder="Note pour le pèlerin (facultatif)" />
              </div>
              <div className="flex flex-col gap-2 md:w-48">
                <button formAction={decide.bind(null, d.id, "apte")} data-decision="apte" className="btn-primary min-h-10 text-sm">Apte</button>
                <button formAction={decide.bind(null, d.id, "a_risque")} data-decision="a_risque" className="btn-gold min-h-10 text-sm">Apte · suivi renforcé</button>
                <button formAction={decide.bind(null, d.id, "inapte")} data-decision="inapte" className="btn-danger min-h-10 text-sm">Non apte</button>
              </div>
            </form>
          );
        })}
      </div>

      <h2 className="mt-8 text-xl font-bold">Pèlerins à risque suivis ({risk.length})</h2>
      <ul className="card mt-3 divide-y divide-stone-100 text-sm dark:divide-stone-800">
        {risk.length === 0 && <li className="py-2 text-stone-500">Aucun.</li>}
        {risk.map((r) => (
          <li key={r.id} className="flex flex-wrap gap-3 py-2">
            <span className="font-semibold">{r.full_name}</span>
            <span className="font-mono text-xs text-stone-500">{r.numero}</span>
            <span className="text-stone-500">{r.group_name}</span>
            <span className="ms-auto text-red-700 dark:text-red-400">{RISKY.filter((c) => JSON.parse(r.health || "{}")[c]).join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
