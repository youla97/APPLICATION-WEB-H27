import "server-only";
import { all, get, run } from "./db";
import { pkgById, HADJ_DATE } from "./data";
import { notify } from "./notify";
import { audit } from "./audit";
import { emit } from "./events";

export type Dossier = {
  id: number;
  numero: string;
  user_id: number;
  status: string;
  step: number;
  data: string;
  full_name: string | null;
  birth_date: string | null;
  passport_no: string | null;
  region: string | null;
  package_id: string | null;
  photo: string | null;
  rejection_reason: string | null;
  created_by: number | null;
  agence_id: number | null;
  health: string | null;
  health_status: string;
  flight: string | null;
  hotel_mecque: string | null;
  hotel_medine: string | null;
  tente: string | null;
  bus: string | null;
  group_name: string | null;
  rating: number | null;
  rating_comment: string | null;
  submitted_at: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: number;
  ref: string;
  dossier_id: number;
  amount: number;
  method: string;
  payer: string | null;
  payer_phone: string | null;
  status: string;
  created_at: string;
  confirmed_at: string | null;
};

export type DossierData = Record<string, string | boolean | undefined>;

export const parseData = (d?: Dossier | null): DossierData => {
  try {
    return d ? JSON.parse(d.data) : {};
  } catch {
    return {};
  }
};

export const dossierOfUser = (userId: number) => get<Dossier>("SELECT * FROM dossiers WHERE user_id = ? ORDER BY id DESC LIMIT 1", userId);
export const dossierById = (id: number) => get<Dossier>("SELECT * FROM dossiers WHERE id = ?", id);
export const dossierByNumero = (n: string) => get<Dossier>("SELECT * FROM dossiers WHERE numero = ?", n.trim().toUpperCase());

export const paymentsOf = (dossierId: number) => all<Payment>("SELECT * FROM payments WHERE dossier_id = ? ORDER BY id DESC", dossierId);

export function paidAmount(dossierId: number) {
  return get<{ s: number }>("SELECT COALESCE(SUM(amount),0) AS s FROM payments WHERE dossier_id = ? AND status = 'confirme'", dossierId)!.s;
}

export function priceOf(d: Dossier) {
  return pkgById(d.package_id)?.price ?? 0;
}

/** Index (0..8) des étapes franchies du parcours pèlerin. */
export function progressOf(d: Dossier | undefined | null) {
  if (!d) return 1;
  const done = [true];
  done.push(d.status !== "brouillon");
  done.push(["valide", "complet"].includes(d.status));
  done.push(priceOf(d) > 0 && paidAmount(d.id) >= priceOf(d));
  done.push(["apte", "a_risque"].includes(d.health_status));
  done.push(d.status === "complet");
  done.push(d.rating != null || Date.now() > new Date(HADJ_DATE).getTime() + 3 * 864e5);
  done.push(d.rating != null);
  let n = 0;
  while (n < done.length && done[n]) n++;
  return n;
}

/** Dossier complet = validé + payé intégralement + apte : on affecte la logistique et on émet le badge. */
export function maybeComplete(dossierId: number) {
  const d = dossierById(dossierId);
  if (!d || d.status !== "valide") return;
  if (paidAmount(d.id) < priceOf(d)) return;
  if (!["apte", "a_risque"].includes(d.health_status)) return;
  const n = d.id;
  const flights = ["GN-H101 · 21 avr. 2027 · 09h40", "GN-H104 · 26 avr. 2027 · 14h10", "GN-H108 · 3 mai 2027 · 08h25"];
  run(
    `UPDATE dossiers SET status='complet', flight=?, hotel_mecque=?, hotel_medine=?, tente=?, bus=?, group_name=COALESCE(group_name, ?), updated_at=datetime('now') WHERE id=?`,
    flights[n % 3],
    d.package_id === "premium" ? "Swissôtel Makkah – ch. " + (400 + (n % 90)) : "Dar Al Eiman – ch. " + (200 + (n % 90)),
    "Al Madinah Hilton – ch. " + (300 + (n % 70)),
    `Mina · secteur 5 · tente ${12 + (n % 8)}`,
    `Bus ${1 + (n % 14)}`,
    `Groupe ${1 + (n % 12)}`,
    n,
  );
  audit("système", "dossier complet", d.numero, "Logistique affectée automatiquement, badge émis");
  notify(d.user_id, "Votre badge est prêt 🪪", `Dossier ${d.numero} complet. Vol ${flights[n % 3]}. Téléchargez votre badge pèlerin dans votre espace.`);
  emit({ type: "dossier", dossierId: n, userId: d.user_id, scope: "all" });
}
