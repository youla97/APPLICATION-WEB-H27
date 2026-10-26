import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { dossierById, paidAmount, parseData, paymentsOf, priceOf } from "@/lib/dossier";
import { HEALTH_STATUS, PAY_METHODS, pkgById } from "@/lib/data";
import { ageOf, dateFr, gnf } from "@/lib/format";
import { refundPayment } from "@/app/actions/staff";
import StatusBadge, { Pill } from "@/components/StatusBadge";
import LiveRefresher from "@/components/LiveRefresher";
import Chat from "@/components/Chat";
import DecisionPanel from "./DecisionPanel";

export const metadata = { title: "Dossier" };

export default async function DossierDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("admin", "agent");
  const d = dossierById(Number((await params).id));
  if (!d || (user.role === "agent" && d.region !== user.region)) notFound();
  const data = parseData(d);
  const phone = get<{ phone: string }>("SELECT phone FROM users WHERE id=?", d.user_id)?.phone;
  const payments = paymentsOf(d.id);
  const history = all<{ id: number; at: string; actor: string; action: string; details: string | null }>("SELECT * FROM audit WHERE target=? ORDER BY id DESC", d.numero);
  const messages = all<{ id: number; from_admin: number; author: string; body: string; created_at: string }>("SELECT * FROM messages WHERE dossier_id=? ORDER BY id", d.id);
  const createdBy = d.created_by ? get<{ name: string }>("SELECT name FROM users WHERE id=?", d.created_by)?.name : null;
  const passportOk = data.passportExpiry ? new Date(String(data.passportExpiry)) >= new Date("2027-12-31") : false;
  const age = ageOf(d.birth_date);

  const checks: [string, boolean][] = [
    ["Photo d'identité fournie", Boolean(d.photo)],
    ["Passeport valide jusqu'à fin 2027", passportOk],
    ["MRZ lue et contrôlée", Boolean(data.mrz)],
    ["Personne à prévenir renseignée", Boolean(data.emergencyName && data.emergencyPhone)],
    ["Consentement données personnelles", Boolean(data.consent)],
    ["Aucun doublon détecté", !d.rejection_reason?.startsWith("⚠")],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/admin/dossiers" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">← Dossiers</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {d.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.photo} alt="" className="size-16 rounded-2xl object-cover" />
          ) : (
            <div className="grid size-16 place-items-center rounded-2xl bg-sand-200 text-2xl dark:bg-stone-800">🧑</div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold">{d.full_name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono">{d.numero}</span>
              <StatusBadge status={d.status} />
              {createdBy && <Pill tone="blue">Mode assisté · {createdBy}</Pill>}
            </div>
          </div>
        </div>
        <LiveRefresher />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card">
            <h2 className="font-bold">Informations</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ["Téléphone", `+224 ${phone}`],
                ["Sexe / âge", `${data.sex === "F" ? "Femme" : "Homme"} · ${age ?? "?"} ans`],
                ["Naissance", `${dateFr(d.birth_date)} à ${data.birthPlace ?? "—"}`],
                ["Adresse", data.address],
                ["Passeport", `${d.passport_no} · exp. ${dateFr(String(data.passportExpiry ?? ""))}`],
                ["Région", d.region],
                ["Package", `${pkgById(d.package_id)?.name} · ${gnf(priceOf(d))}`],
                ["Urgence", `${data.emergencyName ?? "—"} (${data.emergencyRelation || "—"}) · ${data.emergencyPhone ?? ""}`],
                ["Santé", HEALTH_STATUS[d.health_status]],
                ["Groupe / vol", `${d.group_name ?? "—"} · ${d.flight ?? "—"}`],
              ].map(([k, v]) => (
                <div key={k as string} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-stone-500">{k}</dt>
                  <dd className="font-semibold">{String(v ?? "—")}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card">
            <h2 className="font-bold">Contrôle des pièces</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {checks.map(([l, ok]) => (
                <li key={l} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"}`}>
                  {ok ? "✓" : "✗"} {l}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Paiements</h2>
              <span className="text-sm font-semibold tabular-nums">{gnf(paidAmount(d.id))} / {gnf(priceOf(d))}</span>
            </div>
            <ul className="mt-3 divide-y divide-stone-100 text-sm dark:divide-stone-800">
              {payments.length === 0 && <li className="py-2 text-stone-500">Aucun paiement.</li>}
              {payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
                  <span className="font-mono text-xs">{p.ref}</span>
                  <span className="font-semibold tabular-nums">{gnf(p.amount)}</span>
                  <span className="text-stone-500">{PAY_METHODS[p.method]?.label} · {p.payer}</span>
                  <Pill tone={p.status === "confirme" ? "emerald" : p.status === "rembourse" ? "slate" : "amber"}>{p.status}</Pill>
                  {user.role === "admin" && p.status === "confirme" && (
                    <form action={refundPayment.bind(null, p.id)} className="ms-auto">
                      <button className="text-xs font-semibold text-red-700 hover:underline">Rembourser</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 className="mb-3 font-bold">Messagerie avec le pèlerin</h2>
            <Chat dossierId={d.id} messages={messages} staffView />
          </section>
        </div>

        <div className="space-y-6">
          <DecisionPanel dossierId={d.id} status={d.status} reason={d.rejection_reason} />
          <section className="card">
            <h2 className="font-bold">Historique (audit)</h2>
            <ol className="mt-3 space-y-3 border-s-2 border-stone-200 ps-4 text-sm dark:border-stone-700">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -start-[22px] top-1.5 size-2.5 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-stone-900" />
                  <div className="font-semibold">{h.action}</div>
                  {h.details && <div className="text-stone-600 dark:text-stone-400">{h.details}</div>}
                  <div className="text-xs text-stone-400">{dateFr(h.at, true)} · {h.actor}</div>
                </li>
              ))}
              {history.length === 0 && <li className="text-stone-500">Dossier importé (données de démonstration).</li>}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
