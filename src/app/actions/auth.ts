"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { get, run } from "@/lib/db";
import { ROLES } from "@/lib/data";
import { SESSION_COOKIE } from "@/lib/auth";
import { audit } from "@/lib/audit";

const normalize = (p: string) => p.replace(/\D/g, "").replace(/^00224|^224/, "");

export async function requestOtp(phoneRaw: string): Promise<{ ok: boolean; error?: string; demoCode?: string }> {
  const phone = normalize(phoneRaw);
  if (!/^6\d{8}$/.test(phone) && !/^\d{8,15}$/.test(phone)) return { ok: false, error: "Numéro invalide. Exemple : 622 12 34 56" };
  const code = String(crypto.randomInt(100000, 999999));
  run(
    "INSERT INTO otps (phone, code, expires_at, attempts) VALUES (?,?,?,0) ON CONFLICT(phone) DO UPDATE SET code=excluded.code, expires_at=excluded.expires_at, attempts=0",
    phone,
    code,
    Date.now() + 5 * 60_000,
  );
  // Démonstration : le code est renvoyé à l'écran au lieu d'être envoyé par la passerelle SMS.
  return { ok: true, demoCode: code };
}

export async function verifyOtp(phoneRaw: string, code: string): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  const phone = normalize(phoneRaw);
  const otp = get<{ code: string; expires_at: number; attempts: number }>("SELECT * FROM otps WHERE phone = ?", phone);
  if (!otp || otp.expires_at < Date.now()) return { ok: false, error: "Code expiré. Demandez un nouveau code." };
  if (otp.attempts >= 5) return { ok: false, error: "Trop d'essais. Demandez un nouveau code." };
  if (otp.code !== code.trim()) {
    run("UPDATE otps SET attempts = attempts + 1 WHERE phone = ?", phone);
    return { ok: false, error: "Code incorrect." };
  }
  run("DELETE FROM otps WHERE phone = ?", phone);
  let user = get<{ id: number; role: string; name: string | null }>("SELECT id, role, name FROM users WHERE phone = ?", phone);
  if (!user) {
    const id = Number(run("INSERT INTO users (phone, role) VALUES (?, 'pelerin')", phone).lastInsertRowid);
    user = { id, role: "pelerin", name: null };
    audit(phone, "création de compte", phone, "Compte pèlerin créé par OTP");
  }
  const token = crypto.randomBytes(32).toString("hex");
  run("INSERT INTO sessions (token, user_id) VALUES (?,?)", token, user.id);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  if (user.role !== "pelerin") audit(user.name ?? phone, "connexion back-office", ROLES[user.role]?.label);
  return { ok: true, redirectTo: ROLES[user.role]?.home ?? "/espace" };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token = ?", token);
  jar.delete(SESSION_COOKIE);
  redirect("/");
}

export async function setLang(lang: "fr" | "ar") {
  (await cookies()).set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
