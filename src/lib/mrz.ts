// Lecture de la bande MRZ d'un passeport (format TD3, 2 lignes de 44 caractères) avec contrôle des clés.
const val = (c: string) => (c === "<" ? 0 : /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 55);
export const checkDigit = (s: string) => String(s.split("").reduce((acc, c, i) => acc + val(c) * [7, 3, 1][i % 3], 0) % 10);

export type MrzResult = {
  ok: boolean;
  error?: string;
  lastName?: string;
  firstName?: string;
  passportNo?: string;
  nationality?: string;
  birthDate?: string;
  sex?: string;
  passportExpiry?: string;
};

const toDate = (yymmdd: string, future: boolean) => {
  const yy = Number(yymmdd.slice(0, 2));
  const century = future ? 2000 : yy > 30 ? 1900 : 2000;
  return `${century + yy}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`;
};

export function parseMrz(raw: string): MrzResult {
  const lines = raw.toUpperCase().replace(/[ \t]/g, "").split(/\r?\n/).filter(Boolean);
  if (lines.length !== 2 || lines.some((l) => l.length !== 44)) return { ok: false, error: "La MRZ doit comporter 2 lignes de 44 caractères." };
  const [l1, l2] = lines;
  if (l1[0] !== "P") return { ok: false, error: "Ce document n'est pas un passeport (la ligne 1 doit commencer par P)." };
  const [last, first = ""] = l1.slice(5).split("<<");
  const passportNo = l2.slice(0, 9).replace(/</g, "");
  if (checkDigit(l2.slice(0, 9)) !== l2[9]) return { ok: false, error: "Clé de contrôle du numéro de passeport invalide." };
  if (checkDigit(l2.slice(13, 19)) !== l2[19]) return { ok: false, error: "Clé de contrôle de la date de naissance invalide." };
  if (checkDigit(l2.slice(21, 27)) !== l2[27]) return { ok: false, error: "Clé de contrôle de la date d'expiration invalide." };
  const cap = (s: string) => s.replace(/</g, " ").trim().toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
  return {
    ok: true,
    lastName: cap(last),
    firstName: cap(first),
    passportNo,
    nationality: l2.slice(10, 13),
    birthDate: toDate(l2.slice(13, 19), false),
    sex: l2[20] === "F" ? "F" : "M",
    passportExpiry: toDate(l2.slice(21, 27), true),
  };
}

/** Génère une MRZ valide (utilisée pour simuler le scan en démonstration). */
export function sampleMrz(lastName = "DIALLO", firstName = "MAMADOU<SALIOU") {
  const l1 = `P<GIN${lastName}<<${firstName}`.padEnd(44, "<").slice(0, 44);
  const no = "O03871264";
  const birth = "620314";
  const exp = "310918";
  const body = `${no}${checkDigit(no)}GIN${birth}${checkDigit(birth)}M${exp}${checkDigit(exp)}`;
  const personal = "<<<<<<<<<<<<<<";
  const partial = body + personal + checkDigit(personal);
  const composite = partial.slice(0, 10) + partial.slice(13, 20) + partial.slice(21, 43);
  return `${l1}\n${partial}${checkDigit(composite)}`;
}
