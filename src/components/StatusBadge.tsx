import { STATUS } from "@/lib/data";

const TONES = {
  slate: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  blue: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function StatusBadge({ status, ar = false }: { status: string; ar?: boolean }) {
  const s = STATUS[status] ?? { label: status, labelAr: status, tone: "slate" };
  return <span className={`chip ${TONES[s.tone as keyof typeof TONES]}`}>{ar ? s.labelAr : s.label}</span>;
}

export function Pill({ tone = "slate", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`chip ${TONES[tone]}`}>{children}</span>;
}
