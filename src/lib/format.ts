export const gnf = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ | /g, " ") + " GNF";

export const dateFr = (s?: string | null, withTime = false) => {
  if (!s) return "—";
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  return d.toLocaleString("fr-FR", withTime ? { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Conakry" } : { dateStyle: "medium", timeZone: "Africa/Conakry" });
};

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const ageOf = (birth?: string | null) => (birth ? Math.floor((Date.now() - new Date(birth).getTime()) / 3.15576e10) : null);
