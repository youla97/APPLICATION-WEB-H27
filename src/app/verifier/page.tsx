import { redirect } from "next/navigation";
import { ScanLine } from "lucide-react";

export const metadata = { title: "Vérifier un document" };

async function go(form: FormData) {
  "use server";
  const raw = String(form.get("code") ?? "").trim();
  const code = raw.includes("/verifier/") ? raw.split("/verifier/")[1] : raw;
  redirect(`/verifier/${encodeURIComponent(code || "x")}`);
}

export default function Page() {
  return (
    <div className="pattern-light min-h-[calc(100dvh-68px)] px-4 py-12">
      <form action={go} className="card mx-auto max-w-md space-y-4">
        <ScanLine className="mx-auto size-12 text-emerald-700" />
        <h1 className="text-center text-2xl font-extrabold">Vérifier un document</h1>
        <p className="text-center text-sm text-stone-500">Scannez le QR code d&apos;un reçu, d&apos;une fiche ou d&apos;un badge avec l&apos;appareil photo du téléphone, ou collez ici le lien ou le code.</p>
        <input name="code" className="input font-mono" placeholder="R.PAY-12-1.xxxxxxxxxx" required />
        <button className="btn-primary w-full">Vérifier</button>
      </form>
    </div>
  );
}
