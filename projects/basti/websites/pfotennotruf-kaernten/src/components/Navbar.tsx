'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, HeartPulse, Stethoscope } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isDashboard = pathname === '/dashboard';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-red-50 p-2 rounded-xl text-red-500 group-hover:bg-red-100 transition-colors">
              <HeartPulse className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-lg tracking-tight block">
                PfotenNotruf <span className="text-red-500 font-extrabold">Kärnten</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block -mt-1">
                Tierärztliche Notfall-Direktsuche
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-4">
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isHome
                  ? 'bg-slate-100 text-slate-900 shadow-inner'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4" />
                Notfall-Suche
              </span>
            </Link>

            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isDashboard
                  ? 'bg-slate-100 text-slate-900 shadow-inner'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-slate-500" />
                Tierarzt-Dashboard
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
