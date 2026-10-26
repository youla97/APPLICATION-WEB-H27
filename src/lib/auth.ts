import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get } from "./db";
import { ROLES } from "./data";

export type User = { id: number; phone: string; role: string; name: string | null; region: string | null };

export const SESSION_COOKIE = "hadj_session";

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return (
    get<User>(
      "SELECT u.id, u.phone, u.role, u.name, u.region FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
      token,
    ) ?? null
  );
}

export async function requireUser(...roles: string[]): Promise<User> {
  const u = await getUser();
  if (!u) redirect("/connexion");
  if (roles.length && !roles.includes(u.role)) redirect(ROLES[u.role]?.home ?? "/");
  return u;
}

export const actorName = (u: User) => `${u.name ?? u.phone} (${ROLES[u.role]?.label ?? u.role})`;
