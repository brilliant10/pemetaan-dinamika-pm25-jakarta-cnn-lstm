"use client";

import { useEffect, useState } from "react";
import { CityOverview } from "@/lib/types";
import { getCitiesOverview } from "@/lib/api";
import { LivePredictor } from "@/components/LivePredictor";
import { Cpu, Layers } from "lucide-react";

export default function PredictPage() {
  const [cities, setCities] = useState<CityOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCities() {
      try {
        const data = await getCitiesOverview();
        setCities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCities();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2 w-fit">
          <Cpu className="w-3.5 h-3.5" />
          Interactive Inference Playground
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Simulator Prediksi 1 Jam ke Depan (y_t+1)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Gunakan simulator ini untuk menguji respon model CNN-LSTM-Attention terhadap profil deret waktu 24 jam terakhir (W=24).
          Sistem akan secara instan menghasilkan estimasi konsentrasi jam ke-25, perbandingan dengan baseline persistence &amp; moving average,
          klasifikasi indeks standar ISPU, dan peringatan potensi lonjakan (P95).
        </p>
      </div>

      {/* Main Predictor Component */}
      {cities.length > 0 && <LivePredictor cities={cities} />}

      {/* Pipeline Architecture Walkthrough */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Mekanisme Alur Inferensi Komputasi (Bab 3 Skripsi)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">1</span>
              Input Lags &amp; Scaling
            </div>
            <p className="text-slate-400 leading-relaxed">
              Vektor riwayat X (24 langkah waktu) dinormalisasi dengan nilai x_min dan x_max yang terkunci dari data latih kota bersangkutan untuk mencegah <em>data leakage</em>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">2</span>
              Conv1D + MaxPool
            </div>
            <p className="text-slate-400 leading-relaxed">
              Filter konvolusi 1D (kernel=3, filter=64) mengekstraksi fluktuasi lokal jangka pendek sebelum direduksi dimensinya oleh MaxPooling1D (pool=2).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">3</span>
              LSTM + Attention
            </div>
            <p className="text-slate-400 leading-relaxed">
              LSTM menangkap ketergantungan temporal urutan, diikuti Scaled Dot-Product Attention:
              Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V
              untuk memberi bobot lebih pada jam-jam paling krusial.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">4</span>
              Dense &amp; Inverse Transform
            </div>
            <p className="text-slate-400 leading-relaxed">
              GlobalAveragePooling1D merangkum vektor perhatian dan Dense layer menghasilkan nilai ternormalisasi yang kemudian di-invers kembali ke satuan asli µg/m³.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
