import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pemetaan Dinamika PM2.5 Jabodetabek | Prediksi CNN-LSTM-Attention",
  description:
    "Sistem Pemetaan Dinamika PM2.5 di Jakarta dan Wilayah Jabodetabek Melalui Prediksi Spasial-Temporal Menggunakan CNN-LSTM dengan Scaled Dot-Product Attention.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p>
              Sistem Prediksi Spasial-Temporal PM2.5 Jabodetabek &bull; Skripsi Teknik Informatika
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Arsitektur CNN-LSTM dengan Scaled Dot-Product Attention &bull; Data Open-Meteo Air Quality (Jan–Jul 2023)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
