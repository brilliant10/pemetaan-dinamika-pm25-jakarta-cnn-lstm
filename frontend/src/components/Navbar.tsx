"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, AlertTriangle, Cpu, BookOpen } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/spikes", label: "Analisis Spike (P95)", icon: AlertTriangle },
    { href: "/predict", label: "Simulator 1-Jam", icon: Cpu },
    { href: "/methodology", label: "Metodologi Skripsi", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <Link href="/" className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition">
                PM2.5 Spatiotemporal Dynamics
              </Link>
              <div className="text-xs text-slate-400 hidden sm:block">
                CNN-LSTM-Attention Jabodetabek (Jan–Jul 2023)
              </div>
            </div>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
