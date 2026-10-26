"use server";
import { revalidatePath } from "next/cache";
import { all, get, run } from "@/lib/db";
import { requireUser, actorName } from "@/lib/auth";
import { dossierById, maybeComplete } from "@/lib/dossier";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { emit } from "@/lib/events";
import { HEALTH_STATUS, STATUS } from "@/lib/data";
import { gnf } from "@/lib/format";

export async function setDossierStatus(dossierId: number, status: "verification" | "valide" | "rejete", reason?: string) {
  const u = await requireUser("admin", "agent");
  const d = dossierById(dossierId);
  if (!d) return { ok: false, error: "Dossier introuvable" };
  if (status === "rejete" && !reason?.trim()) return { ok: false, error: "Indiquez le motif du rejet." };
  if (status === "valide") {
    const q = get<{ quota: number }>("SELECT quota FROM quotas WHERE region=?", d.region ?? "");
    const used = get<{ n: number }>("SELECT COUNT(*) AS n FROM dossiers WHERE region=? AND status IN ('valide','complet')", d.region ?? "")!.n;
    if (q && used >= q.quota) return { ok: false, error: `Quota atteint pour ${d.region} (${q.quota}).` };
  }
  run(
    `UPDATE dossiers SET status=?, rejection_reason=?, validated_at=CASE WHEN ?='valide' THEN datetime('now') ELSE validated_at END, updated_at=datetime('now') WHERE id=?`,
    status, status === "rejete" ? reason!.trim() : null, status, d.id,
  );
  audit(actorName(u), `statut → ${STATUS[status].label}`, d.numero, reason);
  if (status === "valide") notify(d.user_id, "Dossier validé 🎉", `Félicitations ! Votre dossier ${d.numero} est validé. Vous pouvez payer la 1re tranche par Orange Money ou MTN MoMo.`);
  if (status === "rejete") notify(d.user_id, "Pièce à corriger", `Dossier ${d.numero} : ${reason}. Corrigez la pièce depuis votre espace, sans tout ressaisir.`);
  if (status === "verification") notify(d.user_id, "Dossier en vérification", `Votre dossier ${d.numero} est en cours de vérification.`, ["app"]);
  emit({ type: "dossier", dossierId: d.id, userId: d.user_id, scope: "all" });
  revalidatePath("/admin");
  return { ok: true };
}

export async function refundPayment(paymentId: number) {
  const u = await requireUser("admin");
  const p = get<{ id: number; ref: string; dossier_id: number; amount: number; status: string }>("SELECT * FROM payments WHERE id=?", paymentId);
  if (!p || p.status !== "confirme") return;
  run("UPDATE payments SET status='rembourse' WHERE id=?", p.id);
  const d = dossierById(p.dossier_id)!;
  audit(actorName(u), "remboursement", d.numero, `${p.ref} · ${gnf(p.amount)}`);
  notify(d.user_id, "Remboursement effectué", `${gnf(p.amount)} vous ont été remboursés (réf. ${p.ref}).`);
  emit({ type: "payment", dossierId: d.id, userId: d.user_id, scope: "all" });
  revalidatePath("/admin");
}

export async function updateQuota(region: string, quota: number) {
  const u = await requireUser("admin");
  if (!(quota >= 0)) return;
  const old = get<{ quota: number }>("SELECT quota FROM quotas WHERE region=?", region);
  run("UPDATE quotas SET quota=? WHERE region=?", Math.round(quota), region);
  audit(actorName(u), "quota modifié", region, `${old?.quota} → ${Math.round(quota)}`);
  revalidatePath("/admin");
}

export async function addAgence(name: string, license: string, quota: number) {
  const u = await requireUser("admin");
  if (!name.trim() || !license.trim()) return;
  run("INSERT INTO agences (name, license, quota) VALUES (?,?,?)", name.trim(), license.trim().toUpperCase(), Math.max(0, Math.round(quota)));
  audit(actorName(u), "agence ajoutée", name.trim(), `Licence ${license}`);
  revalidatePath("/admin");
}

export async function toggleAgence(id: number) {
  const u = await requireUser("admin");
  run("UPDATE agences SET active = 1 - active WHERE id=?", id);
  const a = get<{ name: string; active: number }>("SELECT name, active FROM agences WHERE id=?", id);
  audit(actorName(u), a?.active ? "agence réactivée" : "agence suspendue", a?.name);
  revalidatePath("/admin");
}

export async function resolveSos(id: number) {
  const u = await requireUser("admin", "encadreur", "medecin");
  run("UPDATE sos SET status='traite' WHERE id=?", id);
  const s = get<{ dossier_id: number }>("SELECT dossier_id FROM sos WHERE id=?", id);
  const d = s && dossierById(s.dossier_id);
  if (d) {
    audit(actorName(u), "alerte SOS traitée", d.numero);
    notify(d.user_id, "Aide en route", `${u.name} a pris en charge votre alerte.`, ["app", "sms"]);
  }
  emit({ type: "sos", scope: "all", userId: d?.user_id });
}

export async function setHealth(dossierId: number, status: "apte" | "inapte" | "a_risque", note: string) {
  const u = await requireUser("medecin", "admin");
  const d = dossierById(dossierId);
  if (!d || !["apte", "inapte", "a_risque"].includes(status)) return;
  run("UPDATE dossiers SET health_status=?, updated_at=datetime('now') WHERE id=?", status, d.id);
  audit(actorName(u), `certificat médical : ${HEALTH_STATUS[status]}`, d.numero, note || undefined);
  notify(
    d.user_id,
    "Visite médicale",
    status === "inapte"
      ? `La mission médicale émet un avis défavorable. ${note || "Contactez-nous pour en parler."}`
      : `Certificat d'aptitude validé${status === "a_risque" ? " avec suivi médical renforcé sur place" : ""}. ${note}`,
  );
  emit({ type: "health", dossierId: d.id, userId: d.user_id, scope: "all" });
  maybeComplete(d.id);
  revalidatePath("/medecin");
}

export async function togglePresence(dossierId: number, day: string) {
  await requireUser("encadreur", "admin");
  const cur = get<{ present: number }>("SELECT present FROM presences WHERE dossier_id=? AND day=?", dossierId, day);
  run(
    "INSERT INTO presences (dossier_id, day, present) VALUES (?,?,?) ON CONFLICT(dossier_id, day) DO UPDATE SET present=excluded.present",
    dossierId, day, cur?.present ? 0 : 1,
  );
  revalidatePath("/encadreur");
}

export async function broadcast(group: string, text: string) {
  const u = await requireUser("encadreur", "admin");
  const body = text.trim().slice(0, 300);
  if (!body) return { ok: false };
  const rows = all<{ user_id: number }>(
    group === "*" ? "SELECT user_id FROM dossiers WHERE status IN ('valide','complet')" : "SELECT user_id FROM dossiers WHERE group_name=? AND status IN ('valide','complet')",
    ...(group === "*" ? [] : [group]),
  );
  for (const r of rows) notify(r.user_id, `Consigne – ${group === "*" ? "tous les pèlerins" : group}`, body, ["app", "sms"]);
  audit(actorName(u), "consigne diffusée", group === "*" ? "tous" : group, `${rows.length} destinataires · ${body}`);
  return { ok: true, count: rows.length };
}

