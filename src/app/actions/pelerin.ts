"use server";
import { revalidatePath } from "next/cache";
import { get, newNumero, run } from "@/lib/db";
import { requireUser, actorName } from "@/lib/auth";
import { dossierOfUser, parseData, type DossierData } from "@/lib/dossier";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { emit } from "@/lib/events";
import { pkgById } from "@/lib/data";

type SubmitResult = { ok: boolean; error?: string; numero?: string };

const REQUIRED: [string, string][] = [
  ["firstName", "prénom"],
  ["lastName", "nom"],
  ["sex", "sexe"],
  ["birthDate", "date de naissance"],
  ["passportNo", "numéro de passeport"],
  ["passportExpiry", "date d'expiration du passeport"],
  ["photo", "photo d'identité"],
  ["region", "région"],
  ["packageId", "package"],
  ["emergencyName", "personne à prévenir"],
  ["emergencyPhone", "téléphone de la personne à prévenir"],
];

function upsertDraft(userId: number, data: DossierData, step: number, createdBy?: number) {
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || null;
  const photo = typeof data.photo === "string" ? data.photo : null;
  const rest = { ...data };
  delete rest.photo;
  const json = JSON.stringify(rest);
  const existing = dossierOfUser(userId);
  if (!existing) {
    run(
      `INSERT INTO dossiers (numero, user_id, step, data, full_name, birth_date, passport_no, region, package_id, photo, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      newNumero(), userId, step, json, fullName, (data.birthDate as string) ?? null, ((data.passportNo as string) ?? "").toUpperCase() || null,
      (data.region as string) ?? null, (data.packageId as string) ?? null, photo, createdBy ?? null,
    );
  } else {
    if (!["brouillon", "rejete"].includes(existing.status)) throw new Error("Dossier déjà envoyé : il ne peut plus être modifié.");
    run(
      `UPDATE dossiers SET step=?, data=?, full_name=?, birth_date=?, passport_no=?, region=?, package_id=?, photo=COALESCE(?, photo), updated_at=datetime('now') WHERE id=?`,
      step, json, fullName, (data.birthDate as string) ?? null, ((data.passportNo as string) ?? "").toUpperCase() || null,
      (data.region as string) ?? null, (data.packageId as string) ?? null, photo, existing.id,
    );
  }
  if (fullName) run("UPDATE users SET name=?, region=? WHERE id=?", fullName, (data.region as string) ?? null, userId);
  return dossierOfUser(userId)!;
}

export async function saveDraft(data: DossierData, step: number) {
  const u = await requireUser("pelerin");
  const d = upsertDraft(u.id, data, step);
  return { ok: true, numero: d.numero, savedAt: new Date().toISOString() };
}

function missingFields(data: DossierData, hasPhoto: boolean) {
  return REQUIRED.filter(([k]) => (k === "photo" ? !hasPhoto : !data[k])).map(([, l]) => l);
}

function checkPassport(data: DossierData) {
  const exp = new Date(String(data.passportExpiry));
  // Passeport valide au moins 6 mois après le retour (fin juin 2027)
  if (exp < new Date("2027-12-31")) return "Votre passeport doit être valide jusqu'au 31 décembre 2027 au moins.";
  return null;
}

/** Envoi (ou renvoi après correction) du dossier, avec détection des doublons. */
export async function submitDossier(data: DossierData): Promise<SubmitResult> {
  const u = await requireUser("pelerin");
  if (!data.consent) return { ok: false, error: "Merci d'accepter l'utilisation de vos données." };
  const d = upsertDraft(u.id, data, 5);
  const merged = { ...parseData(d), ...data };
  const missing = missingFields(merged, Boolean(d.photo));
  if (missing.length) return { ok: false, error: "Champs manquants : " + missing.join(", ") };
  const pErr = checkPassport(merged);
  if (pErr) return { ok: false, error: pErr };
  return finalizeSubmit(d.id, actorName(u), d.status === "rejete");
}

function finalizeSubmit(dossierId: number, actor: string, resubmit: boolean): SubmitResult {
  const d = get<{ id: number; numero: string; user_id: number; passport_no: string; full_name: string; birth_date: string; package_id: string }>(
    "SELECT * FROM dossiers WHERE id=?", dossierId)!;
  const dup = get<{ numero: string }>(
    "SELECT numero FROM dossiers WHERE id <> ? AND status <> 'brouillon' AND (passport_no = ? OR (lower(full_name) = lower(?) AND birth_date = ?))",
    d.id, d.passport_no, d.full_name, d.birth_date,
  );
  run(
    "UPDATE dossiers SET status='soumis', rejection_reason=?, submitted_at=datetime('now'), updated_at=datetime('now') WHERE id=?",
    dup ? `⚠ Doublon possible avec ${dup.numero}` : null,
    d.id,
  );
  audit(actor, resubmit ? "dossier corrigé et renvoyé" : "dossier soumis", d.numero, dup ? `Doublon possible avec ${dup.numero}` : undefined);
  const pkg = pkgById(d.package_id);
  notify(d.user_id, "Dossier reçu ✅", `Votre dossier ${d.numero} a bien été reçu. Package ${pkg?.name}. Délai de vérification : 72 h maximum.`);
  emit({ type: "dossier", dossierId: d.id, userId: d.user_id, scope: "all" });
  revalidatePath("/espace");
  return { ok: true, numero: d.numero };
}

/** Mode assisté : un agent préfectoral inscrit un pèlerin sans smartphone. */
export async function assistedRegistration(data: DossierData & { phone?: string }): Promise<SubmitResult> {
  const agent = await requireUser("agent", "admin");
  const phone = String(data.phone ?? "").replace(/\D/g, "");
  if (!/^6\d{8}$/.test(phone)) return { ok: false, error: "Numéro de téléphone du pèlerin invalide (9 chiffres, commence par 6)." };
  let user = get<{ id: number; role: string }>("SELECT id, role FROM users WHERE phone=?", phone);
  if (user && user.role !== "pelerin") return { ok: false, error: "Ce numéro appartient à un compte du personnel." };
  if (!user) user = { id: Number(run("INSERT INTO users (phone, role) VALUES (?, 'pelerin')", phone).lastInsertRowid), role: "pelerin" };
  const existing = dossierOfUser(user.id);
  if (existing && !["brouillon", "rejete"].includes(existing.status)) return { ok: false, error: `Ce pèlerin a déjà un dossier (${existing.numero}).` };
  const d = upsertDraft(user.id, { ...data, region: data.region ?? agent.region ?? undefined, consent: true }, 5, agent.id);
  const missing = missingFields(parseData(d), Boolean(d.photo)).filter((m) => m !== "photo d'identité");
  if (missing.length) return { ok: false, error: "Champs manquants : " + missing.join(", ") };
  const pErr = checkPassport(parseData(d));
  if (pErr) return { ok: false, error: pErr };
  const r = finalizeSubmit(d.id, actorName(agent) + " – mode assisté", false);
  notify(user.id, "Bienvenue", `Vous êtes inscrit au Hadj 2027. Dossier ${d.numero}. Vous recevrez toutes les informations par SMS.`, ["sms"]);
  revalidatePath("/agent");
  return r;
}

export async function sendMessage(dossierId: number, body: string) {
  const u = await requireUser();
  const text = body.trim().slice(0, 1000);
  if (!text) return;
  const d = get<{ user_id: number; numero: string }>("SELECT user_id, numero FROM dossiers WHERE id=?", dossierId);
  if (!d) return;
  const isStaff = u.role !== "pelerin";
  if (!isStaff && d.user_id !== u.id) return;
  run("INSERT INTO messages (dossier_id, from_admin, author, body) VALUES (?,?,?,?)", dossierId, isStaff ? 1 : 0, isStaff ? "Administration Hadj" : (u.name ?? "Pèlerin"), text);
  if (isStaff) notify(d.user_id, "Nouveau message", text.slice(0, 120), ["app"]);
  emit({ type: "message", dossierId, userId: d.user_id, scope: "all" });
}

export async function markNotificationsRead() {
  const u = await requireUser();
  run("UPDATE notifications SET read=1 WHERE user_id=?", u.id);
  revalidatePath("/espace");
}

export async function submitHealth(form: Record<string, string | boolean>) {
  const u = await requireUser("pelerin");
  const d = dossierOfUser(u.id);
  if (!d || !["valide", "complet"].includes(d.status)) return { ok: false, error: "La fiche santé s'ouvre après la validation du dossier." };
  if (!form.meningite) return { ok: false, error: "Le vaccin contre la méningite est obligatoire. Indiquez la date de vaccination." };
  run("UPDATE dossiers SET health=?, health_status='soumis', updated_at=datetime('now') WHERE id=?", JSON.stringify(form), d.id);
  audit(actorName(u), "fiche santé envoyée", d.numero);
  notify(u.id, "Fiche santé reçue", "La mission médicale va examiner votre fiche et valider votre certificat d'aptitude.", ["app"]);
  emit({ type: "health", dossierId: d.id, userId: u.id, scope: "all" });
  revalidatePath("/espace");
  return { ok: true };
}

export async function triggerSos(kind: string, lat: number | null, lng: number | null) {
  const u = await requireUser("pelerin");
  const d = dossierOfUser(u.id);
  if (!d) return { ok: false };
  run("INSERT INTO sos (dossier_id, kind, lat, lng) VALUES (?,?,?,?)", d.id, kind, lat, lng);
  audit(actorName(u), "alerte SOS", d.numero, `${kind}${lat ? ` @ ${lat.toFixed(5)},${lng?.toFixed(5)}` : " (position indisponible)"}`);
  notify(u.id, "Alerte transmise 🚨", "Votre encadreur et la mission médicale ont reçu votre alerte. Restez où vous êtes.", ["app", "sms"]);
  emit({ type: "sos", scope: "staff" });
  return { ok: true };
}

export async function rateTrip(rating: number, comment: string) {
  const u = await requireUser("pelerin");
  const d = dossierOfUser(u.id);
  if (!d || rating < 1 || rating > 5) return;
  run("UPDATE dossiers SET rating=?, rating_comment=? WHERE id=?", rating, comment.slice(0, 1000), d.id);
  audit(actorName(u), "avis de retour", d.numero, `${rating}/5`);
  emit({ type: "rating", scope: "staff" });
  revalidatePath("/espace");
}
