import Link from "next/link";
import { AlertTriangle, ArrowRight, Bell, CreditCard, FileText, HeartPulse, IdCard, MessageCircle, Plane, Hotel, Users, Tent, Bus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { all } from "@/lib/db";
import { dossierOfUser, paidAmount, paymentsOf, priceOf, progressOf } from "@/lib/dossier";
import { HEALTH_STATUS, PAY_METHODS, pkgById } from "@/lib/data";
import { dateFr, gnf } from "@/lib/format";
import { markNotificationsRead } from "@/app/actions/pelerin";
import StatusBadge, { Pill } from "@/components/StatusBadge";
import ProgressTracker from "@/components/ProgressTracker";
import LiveRefresher from "@/components/LiveRefresher";
import Chat from "@/components/Chat";
import Rating from "./Rating";

export const metadata = { title: "Mon espace" };

export default async function Espace() {
  const user = await requireUser("pelerin");
  const { lang, t } = await getT();
  const d = dossierOfUser(user.id);
  const notifs = all<{ id: number; channel: string; title: string; body: string; read: number; created_at: string }>(
    "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 12",
    user.id,
  );
  const unread = notifs.filter((n) => !n.read).length;
  const done = progressOf(d);

  if (!d || d.status === "brouillon") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Assalamou alaykoum 👋</h1>
          <LiveRefresher />
        </div>
        <div className="pattern animate-fade-up mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-white sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">{d ? `Étape ${d.step} sur 5` : "Bienvenue"}</p>
          <h2 className="mt-2 text-3xl font-extrabold">{d ? "Continuez votre inscription" : "Commencez votre inscription"}</h2>
          <p className="mt-2 text-emerald-50/80">
            {d ? "Vos réponses sont enregistrées automatiquement : reprenez là où vous vous êtes arrêté." : "5 étapes simples · environ 10 minutes · gardez votre passeport à portée de main."}
          </p>
          {d && (
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${(d.step / 5) * 100}%` }} />
            </div>
          )}
          <Link href="/espace/inscription" className="btn-gold mt-6 text-lg">
            {d ? "Reprendre" : t.register} <ArrowRight className="size-5 rtl:rotate-180" />
          </Link>
        </div>
        <div className="card mt-6">
          <ProgressTracker done={done} />
        </div>
      </div>
    );
  }

  const pkg = pkgById(d.package_id);
  const price = priceOf(d);
  const paid = paidAmount(d.id);
  const payments = paymentsOf(d.id);
  const canPay = ["valide", "complet"].includes(d.status) && paid < price;
  const messages = all<{ id: number; from_admin: number; author: string; body: string; created_at: string }>(
    "SELECT * FROM messages WHERE dossier_id=? ORDER BY id",
    d.id,
  );
  const validated = ["valide", "complet"].includes(d.status);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">Assalamou alaykoum,</p>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{d.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono font-semibold">{d.numero}</span>
            <StatusBadge status={d.status} ar={lang === "ar"} />
            <Pill tone="amber">{pkg?.name}</Pill>
          </div>
        </div>
        <LiveRefresher />
      </div>

      {d.status === "rejete" && (
        <div className="animate-pop mt-6 flex flex-col gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center dark:border-red-900 dark:bg-red-950/40">
          <AlertTriangle className="size-8 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-bold text-red-800 dark:text-red-300">Une pièce est à corriger</p>
            <p className="text-red-700 dark:text-red-300/90">{d.rejection_reason}</p>
          </div>
          <Link href="/espace/inscription" className="btn-danger">Corriger</Link>
        </div>
      )}

      <section className="card mt-6">
        <h2 className="mb-4 font-bold">{t.progress}</h2>
        <ProgressTracker done={done} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Paiements */}
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <CreditCard className="size-5 text-emerald-700" /> {t.payments}
            </h2>
            {canPay && (
              <Link href="/espace/paiement" className="btn-primary min-h-10 px-4 text-sm">
                {t.payNow}
              </Link>
            )}
          </div>
          {!validated ? (
            <p className="mt-4 rounded-xl bg-sand-100 p-4 text-sm dark:bg-stone-800">
              ⏳ Le paiement s&apos;ouvrira dès la validation de votre dossier (72 h maximum). Vous serez prévenu par SMS.
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/50">
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{t.paid}</div>
                  <div className="text-xl font-extrabold tabular-nums">{gnf(paid)}</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/40">
                  <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">{t.remaining}</div>
                  <div className="text-xl font-extrabold tabular-nums">{gnf(Math.max(0, price - paid))}</div>
                </div>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000" style={{ width: `${Math.min(100, (paid / price) * 100)}%` }} />
              </div>
              <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="size-2.5 rounded-full" style={{ background: PAY_METHODS[p.method]?.color }} />
                    <div className="flex-1">
                      <div className="font-semibold tabular-nums">{gnf(p.amount)}</div>
                      <div className="text-xs text-stone-500">
                        {PAY_METHODS[p.method]?.label} · {p.payer} · {dateFr(p.created_at, true)}
                      </div>
                    </div>
                    {p.status === "en_attente" ? (
                      <Pill tone="amber">⏳ En attente</Pill>
                    ) : p.status === "rembourse" ? (
                      <Pill>Remboursé</Pill>
                    ) : (
                      <Link href={`/recu/${p.ref}`} className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
                        {t.receipt} →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Notifications */}
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <Bell className="size-5 text-emerald-700" /> {t.notifications}
              {unread > 0 && <span className="chip animate-pop bg-gn-red text-white">{unread}</span>}
            </h2>
            {unread > 0 && (
              <form action={markNotificationsRead}>
                <button className="text-xs font-semibold text-stone-500 hover:text-emerald-700">Tout lire</button>
              </form>
            )}
          </div>
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {notifs.length === 0 && <li className="text-sm text-stone-500">Aucune notification.</li>}
            {notifs.map((n) => (
              <li key={n.id} className={`animate-fade-up rounded-xl p-3 text-sm ${n.read ? "bg-stone-50 dark:bg-stone-800/50" : "bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{n.title}</span>
                  <span className="chip bg-white text-[10px] text-stone-500 uppercase dark:bg-stone-900">{n.channel}</span>
                </div>
                <p className="mt-0.5 text-stone-600 dark:text-stone-400">{n.body}</p>
                <p className="mt-1 text-[11px] text-stone-400">{dateFr(n.created_at, true)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Santé */}
        <section className="card">
          <h2 className="flex items-center gap-2 font-bold">
            <HeartPulse className="size-5 text-emerald-700" /> {t.health}
          </h2>
          <p className="mt-3">
            <Pill tone={["apte", "a_risque"].includes(d.health_status) ? "emerald" : d.health_status === "inapte" ? "red" : "amber"}>
              {HEALTH_STATUS[d.health_status]}
            </Pill>
          </p>
          <p className="mt-2 text-sm text-stone-500">Vaccin contre la méningite (ACYW135) obligatoire. Certificat d&apos;aptitude délivré par la mission médicale.</p>
          {validated && d.health_status === "a_remplir" && (
            <Link href="/espace/sante" className="btn-primary mt-4 w-full">Remplir ma fiche santé</Link>
          )}
          {!validated && <p className="mt-3 text-xs text-stone-400">Disponible après validation du dossier.</p>}
        </section>

        {/* Documents */}
        <section className="card">
          <h2 className="flex items-center gap-2 font-bold">
            <FileText className="size-5 text-emerald-700" /> {t.documents}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/espace/fiche" className="flex items-center justify-between rounded-xl bg-sand-100 px-3 py-3 font-semibold hover:bg-sand-200 dark:bg-stone-800">
                📄 Fiche d&apos;inscription <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </li>
            {payments.filter((p) => p.status === "confirme").map((p) => (
              <li key={p.id}>
                <Link href={`/recu/${p.ref}`} className="flex items-center justify-between rounded-xl bg-sand-100 px-3 py-3 font-semibold hover:bg-sand-200 dark:bg-stone-800">
                  🧾 Reçu {p.ref} <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </li>
            ))}
            <li>
              {d.status === "complet" ? (
                <Link href="/espace/badge" className="flex items-center justify-between rounded-xl bg-emerald-700 px-3 py-3 font-semibold text-white hover:bg-emerald-800">
                  <span className="flex items-center gap-2"><IdCard className="size-4" /> {t.badge}</span> <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              ) : (
                <span className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 py-3 text-stone-400 dark:border-stone-700">
                  <IdCard className="size-4" /> {t.badge} — après paiement complet et visite médicale
                </span>
              )}
            </li>
          </ul>
        </section>

        {/* Logistique */}
        <section className="card">
          <h2 className="flex items-center gap-2 font-bold">
            <Plane className="size-5 text-emerald-700" /> Voyage
          </h2>
          {d.status === "complet" ? (
            <dl className="mt-3 space-y-2.5 text-sm">
              {[
                [Plane, "Vol", d.flight],
                [Hotel, "La Mecque", d.hotel_mecque],
                [Hotel, "Médine", d.hotel_medine],
                [Tent, "Mina", d.tente],
                [Bus, "Transport", d.bus],
                [Users, "Groupe", d.group_name],
              ].map(([Icon, k, v]) => {
                const I = Icon as typeof Plane;
                return (
                  <div key={k as string} className="flex items-start gap-2">
                    <I className="mt-0.5 size-4 text-stone-400" />
                    <dt className="w-20 shrink-0 text-stone-500">{k as string}</dt>
                    <dd className="font-semibold">{(v as string) ?? "—"}</dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-stone-500">Vol, hôtels, tente à Mina et groupe vous seront affectés dès que votre dossier sera complet.</p>
          )}
          <Link href="/accompagnement" className="btn-ghost mt-4 w-full">🕋 {t.rites}</Link>
        </section>

        {/* Messagerie */}
        <section className="card lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <MessageCircle className="size-5 text-emerald-700" /> {t.messages}
          </h2>
          <Chat dossierId={d.id} messages={messages} />
        </section>

        {d.status === "complet" && (
          <section className="card">
            <h2 className="font-bold">⭐ Retour et avis</h2>
            <p className="mt-1 text-sm text-stone-500">De retour au pays ? Notez votre Hadj pour nous aider à améliorer l&apos;organisation.</p>
            <Rating initial={d.rating} />
          </section>
        )}
      </div>
    </div>
  );
}
