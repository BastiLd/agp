"use client";

import Link from "next/link";
import { usePremium } from "@/contexts/PremiumContext";
import PremiumBadge from "./PremiumBadge";

export default function Header() {
  const { isPremium } = usePremium();

  return (
    <header className="border-b-2 border-black dark:border-white bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold hover:opacity-70 transition-opacity tracking-tight">
          Viele WebApps
        </Link>
        <div className="flex items-center gap-4">
          {isPremium && <PremiumBadge />}
          <Link
            href="/premium"
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity font-semibold uppercase text-sm tracking-wide"
          >
            {isPremium ? "Premium" : "Go Premium"}
          </Link>
        </div>
      </div>
    </header>
  );
}

