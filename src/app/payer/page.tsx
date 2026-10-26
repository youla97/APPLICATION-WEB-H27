import ProchePay from "./ProchePay";

export const metadata = { title: "Payer pour un proche" };

export default function Page() {
  return (
    <div className="pattern-light min-h-[calc(100dvh-68px)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold">Payer pour un proche 🤝</h1>
        <p className="mt-1 text-stone-500">Famille, parrain ou diaspora : payez le Hadj d&apos;un pèlerin avec son numéro de dossier. Il reçoit un SMS à chaque paiement.</p>
        <div className="mt-6">
          <ProchePay />
        </div>
      </div>
    </div>
  );
}
