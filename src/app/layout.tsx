import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/cairo";
import "./globals.css";
import { getLang } from "@/lib/lang";
import Header from "@/components/Header";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: { default: "Hadj 2027 Guinée", template: "%s · Hadj 2027 Guinée" },
  description: "Inscription, paiement, suivi du dossier et accompagnement des pèlerins guinéens pour le Hadj 2027 (1448 H).",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Hadj 2027", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#065f46",
  width: "device-width",
  initialScale: 1,
};

const prefsScript = `try{var d=localStorage.getItem('theme');if(d==='dark'||(!d&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');var s=localStorage.getItem('size');if(s)document.documentElement.style.setProperty('--base-size',s+'px')}catch(e){}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">
          Aller au contenu
        </a>
        <Header />
        <main id="main">{children}</main>
        <PwaRegister />
      </body>
    </html>
  );
}
