import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PremiumProvider } from "@/contexts/PremiumContext";

export const metadata: Metadata = {
  title: "Viele WebApps",
  description: "A collection of interactive web applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PremiumProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </PremiumProvider>
      </body>
    </html>
  );
}

