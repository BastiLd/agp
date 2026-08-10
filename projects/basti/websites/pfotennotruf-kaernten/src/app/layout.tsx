import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PfotenNotruf Kärnten – Tierarzt-Notfallsuche",
  description: "Finde schnell eine erreichbare tierärztliche Anlaufstelle in Kärnten mit verifiziertem 24h-Status. Keine medizinische Beratung.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de-AT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        {/* Persistent Legal Disclaimer Footer */}
        <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Wichtiger Sicherheits- und Rechtshinweis
            </p>
            <p className="text-xs max-w-3xl mx-auto leading-relaxed">
              PfotenNotruf Kärnten ist eine studentische Plattform zur Erleichterung der Tierarzt-Suche in Notsituationen. 
              Wir übernehmen <span className="text-red-400 underline">keine Gewähr</span> für die Richtigkeit, Aktualität und Vollständigkeit der Angaben. 
              Die Plattform bietet <span className="text-red-400 underline">keine medizinische Beratung</span> oder Ferndiagnose. 
              Bei lebensbedrohlichen Notfällen oder akuter Lebensgefahr kontaktieren Sie bitte <span className="text-white font-bold underline">sofort telefonisch</span> eine tierärztliche Notfallpraxis oder Klinik!
            </p>
            <div className="text-[10px] text-slate-500 mt-4 pt-4 border-t border-slate-800 font-semibold">
              © {new Date().getFullYear()} PfotenNotruf Kärnten / VetNow. Entwickelt für Jugend Innovativ.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
