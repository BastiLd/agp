import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Excel Formel Retter - KI-generierte Excel & Google Sheets Formeln",
  description:
    "Generiere automatisch Excel- und Google-Sheets-Formeln mit KI. Beschreibe dein Problem in normaler Sprache und erhalte sofort die passende Formel.",
  keywords: [
    "Excel Formeln",
    "Google Sheets Formeln",
    "KI Formeln",
    "Excel Automatisierung",
    "Formel Generator",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

