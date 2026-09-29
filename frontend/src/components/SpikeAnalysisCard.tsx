"use client";

import { useState } from "react";
import { SpikeEpisode, SpikeMetrics } from "@/lib/types";
import { AlertCircle, CheckCircle2, XCircle, Search, Flame } from "lucide-react";

interface SpikeAnalysisCardProps {
  episodes: SpikeEpisode[];
  spikeMetrics?: SpikeMetrics;
  cityName: string;
  p95Threshold: number;
}

export function SpikeAnalysisCard({
  episodes,
  spikeMetrics,
  cityName,
  p95Threshold,
}: SpikeAnalysisCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "actual" | "detected" | "missed">("all");

  const filteredEpisodes = episodes.filter((ep) => {
    const matchesSearch = ep.timestamp.includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterMode === "actual") return ep.is_actual_spike;
    if (filterMode === "detected") return ep.is_actual_spike && ep.cnn_detected;
    if (filterMode === "missed") return ep.is_actual_spike && !ep.cnn_detected;
    return true;
  });

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <Flame className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-white">
              Studio Deteksi Lonjakan Ekstrem (P95 Spike Detection)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluasi kemampuan model dalam memprediksi konsentrasi kritis di atas persentil ke-95 data latih ({cityName}: &ge; {p95Threshold.toFixed(1)} µg/m³)
          </p>
        </div>

        {spikeMetrics && (
          <div className="flex items-center gap-2">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Spike F1-Score</div>
              <div className="text-lg font-bold text-amber-400">{spikeMetrics.f1_score.toFixed(4)}</div>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Precision</div>
              <div className="text-lg font-bold text-cyan-400">{(spikeMetrics.precision * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Recall</div>
              <div className="text-lg font-bold text-emerald-400">{(spikeMetrics.recall * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Confusion Matrix Visual */}
      {spikeMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>True Positive (TP)</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1">{spikeMetrics.tp}</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Lonjakan berhasil terdeteksi</div>
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl">
            <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
              <span>True Negative (TN)</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1">{spikeMetrics.tn}</div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">Jam normal terprediksi tepat</div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
              <span>False Positive (FP)</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1">{spikeMetrics.fp}</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Alarm palsu (false alarm)</div>
          </div>

          <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
              <span>False Negative (FN)</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1">{spikeMetrics.fn}</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">Lonjakan terlewatkan (missed)</div>
          </div>
        </div>
      )}

      {/* Episode Table Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari tanggal atau jam (YYYY-MM-DD)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-2.5 py-1 rounded-md transition ${
              filterMode === "all" ? "bg-slate-700 text-white font-medium" : "text-slate-400 hover:text-white"
            }`}
          >
            Semua Episode ({episodes.length})
          </button>
          <button
            onClick={() => setFilterMode("detected")}
            className={`px-2.5 py-1 rounded-md transition ${
              filterMode === "detected" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"
            }`}
          >
            Terdeteksi Tepat (TP)
          </button>
          <button
            onClick={() => setFilterMode("missed")}
            className={`px-2.5 py-1 rounded-md transition ${
              filterMode === "missed" ? "bg-rose-600 text-white font-medium" : "text-slate-400 hover:text-white"
            }`}
          >
            Terlewatkan (FN)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800 backdrop-blur-sm">
            <tr>
              <th className="py-2.5 px-3">Waktu Target</th>
              <th className="py-2.5 px-3">Aktual PM2.5</th>
              <th className="py-2.5 px-3">Prediksi CNN-LSTM</th>
              <th className="py-2.5 px-3">Persistence Baseline</th>
              <th className="py-2.5 px-3">Selisih Error</th>
              <th className="py-2.5 px-3">Status Deteksi Model</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredEpisodes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                  Tidak ada rekaman episode yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filteredEpisodes.slice(0, 100).map((ep, idx) => {
                const isCorrect = ep.is_actual_spike && ep.cnn_detected;
                const isMissed = ep.is_actual_spike && !ep.cnn_detected;

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-300">{ep.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-white">
                      <span className={ep.is_actual_spike ? "text-red-400 font-bold" : ""}>
                        {ep.actual_pm25.toFixed(2)} µg/m³
                      </span>
                    </td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">
                      {ep.cnn_lstm_pred.toFixed(2)} µg/m³
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {ep.persistence_pred !== undefined ? `${ep.persistence_pred.toFixed(2)} µg/m³` : "-"}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      ± {ep.error.toFixed(2)} µg/m³
                    </td>
                    <td className="py-2 px-3">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-sans font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Berhasil Deteksi
                        </span>
                      ) : isMissed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-sans font-semibold">
                          <XCircle className="w-3 h-3" /> Terlewatkan (FN)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-sans font-semibold">
                          <AlertCircle className="w-3 h-3" /> Alarm Palsu (FP)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
