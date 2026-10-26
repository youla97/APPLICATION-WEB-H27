import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { PACKAGES, REGIONS } from "./data";

// Base SQLite intégrée à Node (aucune dépendance native). En production : PostgreSQL (cf. cahier des charges §8).
const DB_PATH = path.join(process.cwd(), "data", "hadj.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'pelerin',
  name TEXT,
  region TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS otps (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS dossiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'brouillon',
  step INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL DEFAULT '{}',
  full_name TEXT,
  birth_date TEXT,
  passport_no TEXT,
  region TEXT,
  package_id TEXT,
  photo TEXT,
  rejection_reason TEXT,
  created_by INTEGER,
  agence_id INTEGER,
  health TEXT,
  health_status TEXT NOT NULL DEFAULT 'a_remplir',
  flight TEXT,
  hotel_mecque TEXT,
  hotel_medine TEXT,
  tente TEXT,
  bus TEXT,
  group_name TEXT,
  rating INTEGER,
  rating_comment TEXT,
  submitted_at TEXT,
  validated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE NOT NULL,
  dossier_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  payer TEXT,
  payer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'en_attente',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dossier_id INTEGER NOT NULL,
  from_admin INTEGER NOT NULL DEFAULT 0,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (datetime('now')),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  details TEXT
);
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit
BEGIN SELECT RAISE(ABORT, 'Journal d''audit non modifiable'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit
BEGIN SELECT RAISE(ABORT, 'Journal d''audit non modifiable'); END;
CREATE TABLE IF NOT EXISTS sos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dossier_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  lat REAL,
  lng REAL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'ouvert',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS quotas (
  region TEXT PRIMARY KEY,
  quota INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS agences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  license TEXT NOT NULL,
  quota INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS presences (
  dossier_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  present INTEGER NOT NULL,
  PRIMARY KEY (dossier_id, day)
);
`;

const g = globalThis as unknown as { __hadjDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (g.__hadjDb) return g.__hadjDb;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const conn = new DatabaseSync(DB_PATH);
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  conn.exec(SCHEMA);
  const count = conn.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (count.n === 0) seed(conn);
  g.__hadjDb = conn;
  return conn;
}

export type Row = Record<string, unknown>;

// node:sqlite renvoie des objets à prototype nul : on les convertit en objets simples (sérialisables vers les composants client)
export function all<T = Row>(sql: string, ...params: (string | number | null)[]): T[] {
  return db().prepare(sql).all(...params).map((r) => ({ ...r })) as T[];
}
export function get<T = Row>(sql: string, ...params: (string | number | null)[]): T | undefined {
  const r = db().prepare(sql).get(...params);
  return r ? ({ ...r } as T) : undefined;
}
export function run(sql: string, ...params: (string | number | null)[]) {
  return db().prepare(sql).run(...params);
}

export function newNumero(conn: DatabaseSync = db()): string {
  const r = conn.prepare("SELECT COALESCE(MAX(id),0)+1 AS n FROM dossiers").get() as { n: number };
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HJ27-${String(r.n).padStart(5, "0")}-${rand}`;
}

// ---- Données de démonstration ----
const FIRST = ["Mamadou", "Fatoumata", "Ibrahima", "Aissatou", "Alpha", "Mariama", "Ousmane", "Kadiatou", "Abdoulaye", "Hawa", "Sekou", "Djenabou", "Thierno", "Nènè", "Lansana", "Saran", "Moussa", "Binta", "Elhadj", "Hadja"];
const LAST = ["Diallo", "Bah", "Barry", "Camara", "Sow", "Condé", "Touré", "Keita", "Soumah", "Sylla", "Kourouma", "Baldé", "Kaba", "Cissé", "Fofana", "Bangoura"];

function seed(conn: DatabaseSync) {
  const staff: [string, string, string, string | null][] = [
    ["620000001", "admin", "Admin COGEP", null],
    ["620000002", "agent", "Agent Préfecture Kindia", "Kindia"],
    ["620000003", "medecin", "Dr Aminata Kaba", null],
    ["620000004", "encadreur", "Guide Thierno Bah", null],
    ["620000005", "agence", "Al Baraka Voyages", null],
  ];
  const insUser = conn.prepare("INSERT INTO users (phone, role, name, region) VALUES (?,?,?,?)");
  for (const s of staff) insUser.run(...s);

  const quotas: Record<string, number> = { Conakry: 3200, Boké: 900, Kindia: 1300, Mamou: 900, Labé: 1400, Faranah: 600, Kankan: 1200, "N'Zérékoré": 800, Diaspora: 500 };
  const insQ = conn.prepare("INSERT INTO quotas (region, quota) VALUES (?,?)");
  for (const r of REGIONS) insQ.run(r, quotas[r] ?? 500);

  const insA = conn.prepare("INSERT INTO agences (name, license, quota) VALUES (?,?,?)");
  insA.run("Al Baraka Voyages", "AG-HAJ-2027-014", 350);
  insA.run("Safa Marwa Tours", "AG-HAJ-2027-022", 280);
  insA.run("Nour El Houda", "AG-HAJ-2027-031", 200);

  const statuses = ["soumis", "verification", "valide", "valide", "valide", "complet", "rejete", "brouillon"];
  const insD = conn.prepare(`INSERT INTO dossiers (numero, user_id, status, step, data, full_name, birth_date, passport_no, region, package_id,
    rejection_reason, agence_id, health_status, health, submitted_at, validated_at, created_at, group_name, flight)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insP = conn.prepare(`INSERT INTO payments (ref, dossier_id, amount, method, payer, status, created_at, confirmed_at) VALUES (?,?,?,?,?,?,?,?)`);
  const methods = ["orange", "orange", "mtn", "mtn", "banque"];
  let seedRand = 42;
  const rnd = () => ((seedRand = (seedRand * 16807) % 2147483647) / 2147483647);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const regionWeights = ["Conakry", "Conakry", "Conakry", "Labé", "Labé", "Kindia", "Kankan", "Mamou", "Boké", "N'Zérékoré", "Faranah", "Diaspora"];

  for (let i = 0; i < 140; i++) {
    const phone = `62${String(1000000 + i * 7919).slice(-7)}`;
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const region = pick(regionWeights);
    const uid = Number(insUser.run(phone, "pelerin", name, region).lastInsertRowid);
    const status = pick(statuses);
    const pkg = pick(PACKAGES);
    const day = Math.floor(rnd() * 25);
    const created = new Date(Date.UTC(2026, 9, 1 + day, 8 + Math.floor(rnd() * 10))).toISOString().replace("T", " ").slice(0, 19);
    const birth = `${1945 + Math.floor(rnd() * 40)}-0${1 + Math.floor(rnd() * 9)}-1${Math.floor(rnd() * 9)}`;
    const passport = `O${String(10000000 + Math.floor(rnd() * 8999999))}`;
    const numero = `HJ27-${String(i + 1).padStart(5, "0")}-${Math.floor(rnd() * 46655).toString(36).toUpperCase().padStart(3, "0")}`;
    const [first, ...rest] = name.split(" ");
    const data = JSON.stringify({ firstName: first, lastName: rest.join(" "), birthDate: birth, passportNo: passport, region, packageId: pkg.id, sex: rnd() > 0.5 ? "M" : "F", consent: true });
    const validated = ["valide", "complet"].includes(status);
    const validatedAt = new Date(new Date(created.replace(" ", "T") + "Z").getTime() + (8 + rnd() * 60) * 36e5).toISOString().replace("T", " ").slice(0, 19);
    const healthStatus = status === "complet" ? "apte" : validated && rnd() > 0.5 ? "soumis" : "a_remplir";
    const health = healthStatus === "a_remplir" ? null : JSON.stringify({
      meningite: `2026-0${1 + Math.floor(rnd() * 9)}-1${Math.floor(rnd() * 9)}`,
      blood: pick(["O+", "A+", "B+", "O-", ""]),
      ...(rnd() > 0.65 ? { [pick(["Diabète", "Hypertension", "Mobilité réduite"])]: true } : {}),
    });
    const dossierId = Number(
      insD.run(numero, uid, status, status === "brouillon" ? 2 : 5, data, name, birth, passport, region, pkg.id,
        status === "rejete" ? "Photo d'identité floue, merci d'en fournir une nouvelle." : null,
        rnd() > 0.6 ? 1 + Math.floor(rnd() * 3) : null, healthStatus, health,
        status === "brouillon" ? null : created, validated ? validatedAt : null, created,
        validated ? `Groupe ${1 + Math.floor(rnd() * 12)}` : null,
        status === "complet" ? pick(["GN-H101 · 21 avr. 2027", "GN-H104 · 26 avr. 2027", "GN-H108 · 3 mai 2027"]) : null).lastInsertRowid,
    );
    if (validated) {
      const tranches = status === "complet" ? 3 : 1 + Math.floor(rnd() * 3);
      for (let t = 0; t < tranches; t++) {
        const amount = t === 2 ? pkg.price - 2 * Math.round(pkg.price / 3) : Math.round(pkg.price / 3);
        insP.run(`PAY-${dossierId}-${t + 1}`, dossierId, amount, pick(methods), name, "confirme", created, created);
      }
    }
  }

  const insAudit = conn.prepare("INSERT INTO audit (actor, action, target, details) VALUES (?,?,?,?)");
  insAudit.run("système", "initialisation", "campagne 2027", "Ouverture de la campagne Hadj 2027 (1448 H) en démonstration");
}
