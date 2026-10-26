"use server";
import crypto from "node:crypto";
import { get, run } from "@/lib/db";
import { getUser, actorName } from "@/lib/auth";
import { dossierByNumero, paidAmount, priceOf, maybeComplete } from "@/lib/dossier";
import { PAY_METHODS } from "@/lib/data";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { emit } from "@/lib/events";
import { gnf } from "@/lib/format";

/**
 * Initie un paiement Mobile Money / bancaire. L'opérateur confirme ensuite par notification serveur (webhook) :
 * ici la confirmation est simulée quelques secondes plus tard pour reproduire le parcours réel.
 */
export async function startPayment(input: { numero: string; method: string; amount: number; payer?: string; payerPhone?: string }) {
  const user = await getUser();
  const d = dossierByNumero(input.numero);
  if (!d) return { ok: false, error: "Numéro de dossier introuvable." };
  if (user?.role === "pelerin" && d.user_id !== user.id) return { ok: false, error: "Ce dossier ne vous appartient pas." };
  if (!["valide", "complet"].includes(d.status)) return { ok: false, error: "Le paiement s'ouvre dès que le dossier est validé." };
  if (!PAY_METHODS[input.method]) return { ok: false, error: "Moyen de paiement inconnu." };
  const pending = get<{ n: number }>("SELECT COUNT(*) AS n FROM payments WHERE dossier_id=? AND status='en_attente'", d.id)!.n;
  if (pending) return { ok: false, error: "Un paiement est déjà en attente de confirmation." };
  const remaining = priceOf(d) - paidAmount(d.id);
  const amount = Math.round(Number(input.amount));
  if (!(amount > 0) || amount > remaining) return { ok: false, error: `Montant invalide (reste à payer : ${gnf(remaining)}).` };
  if (amount < Math.min(remaining, 1_000_000)) return { ok: false, error: "Montant minimum par tranche : 1 000 000 GNF." };

  const ref = `PAY-${d.id}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const payer = input.payer?.trim() || user?.name || d.full_name || "Pèlerin";
  run("INSERT INTO payments (ref, dossier_id, amount, method, payer, payer_phone) VALUES (?,?,?,?,?,?)", ref, d.id, amount, input.method, payer, input.payerPhone ?? null);
  audit(user ? actorName(user) : `Proche : ${payer}`, "paiement initié", d.numero, `${ref} · ${gnf(amount)} · ${PAY_METHODS[input.method].label}`);
  emit({ type: "payment", dossierId: d.id, userId: d.user_id, scope: "all" });

  setTimeout(() => confirmPayment(ref), 4000);
  return { ok: true, ref };
}

function confirmPayment(ref: string) {
  const p = get<{ id: number; dossier_id: number; amount: number; method: string; payer: string; status: string }>("SELECT * FROM payments WHERE ref=?", ref);
  if (!p || p.status !== "en_attente") return;
  run("UPDATE payments SET status='confirme', confirmed_at=datetime('now') WHERE id=?", p.id);
  const d = get<{ id: number; numero: string; user_id: number; package_id: string; status: string }>("SELECT * FROM dossiers WHERE id=?", p.dossier_id)!;
  audit(PAY_METHODS[p.method].label, "paiement confirmé (webhook)", d.numero, `${ref} · ${gnf(p.amount)} · rapprochement automatique OK`);
  const left = priceOf(d as never) - paidAmount(d.id);
  notify(
    d.user_id,
    "Paiement reçu 💳",
    `${gnf(p.amount)} reçus (réf. ${ref}) de ${p.payer}. ${left > 0 ? `Reste à payer : ${gnf(left)}.` : "Votre Hadj est entièrement payé. Qu'Allah l'accepte !"}`,
  );
  emit({ type: "payment", dossierId: d.id, userId: d.user_id, scope: "all" });
  maybeComplete(d.id);
}

export async function paymentStatus(ref: string) {
  const p = get<{ status: string }>("SELECT status FROM payments WHERE ref=?", ref);
  return p?.status ?? "inconnu";
}

export async function lookupDossier(numero: string) {
  const d = dossierByNumero(numero);
  if (!d || !["valide", "complet"].includes(d.status)) return { ok: false as const, error: d ? "Ce dossier n'est pas encore validé : le paiement n'est pas ouvert." : "Dossier introuvable." };
  const initials = (d.full_name ?? "").split(" ").map((p, i) => (i === 0 ? p : p[0] + ".")).join(" ");
  return { ok: true as const, name: initials, numero: d.numero, remaining: priceOf(d) - paidAmount(d.id), total: priceOf(d) };
}
