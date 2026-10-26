import "server-only";
import { run } from "./db";
import { emit } from "./events";

/** Journal d'audit en ajout seul (UPDATE/DELETE bloqués par trigger). */
export function audit(actor: string, action: string, target?: string, details?: string) {
  run("INSERT INTO audit (actor, action, target, details) VALUES (?,?,?,?)", actor, action, target ?? null, details ?? null);
  emit({ type: "audit", scope: "staff" });
}
