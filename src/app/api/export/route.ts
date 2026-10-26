import { getUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { audit } from "@/lib/audit";
import { pkgById, STATUS, HEALTH_STATUS } from "@/lib/data";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Export Excel (CSV ; séparateur point-virgule, BOM UTF-8) — liste des pèlerins, format paramétrable pour Nusuk / compagnie aérienne.
export async function GET(req: Request) {
  const user = await getUser();
  if (!user || !["admin", "agence"].includes(user.role)) return new Response("Accès refusé", { status: 403 });
  const format = new URL(req.url).searchParams.get("format") ?? "complet";
  // Une agence n'exporte que ses propres pèlerins
  const agenceId = user.role === "agence" ? (get<{ id: number }>("SELECT id FROM agences WHERE name=?", user.name ?? "")?.id ?? -1) : null;
  const rows = all<Record<string, string | number | null>>(
    `SELECT d.numero, d.full_name, d.birth_date, d.passport_no, d.region, d.package_id, d.status, d.health_status, d.group_name, d.flight,
            u.phone, COALESCE((SELECT SUM(amount) FROM payments p WHERE p.dossier_id=d.id AND p.status='confirme'),0) AS paye
     FROM dossiers d JOIN users u ON u.id=d.user_id WHERE d.status <> 'brouillon' ${agenceId != null ? "AND d.agence_id = ?" : ""} ORDER BY d.id`,
    ...(agenceId != null ? [agenceId] : []),
  );
  let header: string[];
  let lines: unknown[][];
  if (format === "vol") {
    header = ["NOM COMPLET", "PASSEPORT", "DATE NAISSANCE", "VOL", "GROUPE"];
    lines = rows.filter((r) => r.status === "complet").map((r) => [String(r.full_name).toUpperCase(), r.passport_no, r.birth_date, r.flight, r.group_name]);
  } else {
    header = ["Dossier", "Nom", "Naissance", "Passeport", "Téléphone", "Région", "Package", "Statut", "Santé", "Payé (GNF)", "Reste (GNF)", "Groupe", "Vol"];
    lines = rows.map((r) => {
      const price = pkgById(String(r.package_id))?.price ?? 0;
      return [r.numero, r.full_name, r.birth_date, r.passport_no, r.phone, r.region, pkgById(String(r.package_id))?.name, STATUS[String(r.status)]?.label,
        HEALTH_STATUS[String(r.health_status)], r.paye, price - Number(r.paye), r.group_name, r.flight];
    });
  }
  audit(user.name ?? user.phone, "export", `pèlerins (${format})`, `${lines.length} lignes`);
  const csv = "﻿" + [header, ...lines].map((l) => l.map(esc).join(";")).join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="hadj2027-${format}-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
