"use client";

import { CityMetricsData } from "@/lib/types";
import { TrendingDown, Award, Zap, Target } from "lucide-react";

interface MetricsGridProps {
  metricsData?: CityMetricsData;
}

export function MetricsGrid({ metricsData }: MetricsGridProps) {
  if (!metricsData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-900/50 rounded-xl border border-slate-800" />
        ))}
      </div>
    );
  }

  const { metrics, p95_threshold } = metricsData;
  const cnn = metrics.cnn_lstm_attention;
  const pers = metrics.persistence;
  const ma3 = metrics.moving_average_3;

  // Percentage improvements over persistence baseline
  const rmseImp = ((pers.rmse - cnn.rmse) / pers.rmse) * 100;
  const maeImp = ((pers.mae - cnn.mae) / pers.mae) * 100;
  const f1Imp = ((cnn.spike_detection.f1_score - pers.spike_detection.f1_score) / (pers.spike_detection.f1_score || 1)) * 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. RMSE Card */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition rounded-xl p-4 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Root Mean Squared Error</span>
          <Target className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{cnn.rmse.toFixed(3)}</span>
          <span className="text-xs text-slate-400">µg/m³</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">Baseline Persistence:</span>
          <span className="text-slate-300 font-medium">{pers.rmse.toFixed(3)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">Baseline MA(3):</span>
          <span className="text-slate-300 font-medium">{ma3.rmse.toFixed(3)}</span>
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            rmseImp >= 0 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-400"
          }`}>
            <TrendingDown className="w-3 h-3" />
            {rmseImp >= 0 ? `${rmseImp.toFixed(1)}% Lebih Presisi` : `${Math.abs(rmseImp).toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* 2. MAE Card */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition rounded-xl p-4 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Mean Absolute Error</span>
          <Award className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{cnn.mae.toFixed(3)}</span>
          <span className="text-xs text-slate-400">µg/m³</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">Baseline Persistence:</span>
          <span className="text-slate-300 font-medium">{pers.mae.toFixed(3)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">Baseline MA(3):</span>
          <span className="text-slate-300 font-medium">{ma3.mae.toFixed(3)}</span>
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            maeImp >= 0 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/15 text-rose-400"
          }`}>
            <TrendingDown className="w-3 h-3" />
            {maeImp >= 0 ? `${maeImp.toFixed(1)}% Error Lebih Rendah` : `${Math.abs(maeImp).toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* 3. MAPE Card */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 transition rounded-xl p-4 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">MAPE (Rata-rata % Error)</span>
          <Zap className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{cnn.mape.toFixed(2)}</span>
          <span className="text-xs text-slate-400">%</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">Baseline Persistence:</span>
          <span className="text-slate-300 font-medium">{pers.mape.toFixed(2)}%</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">Baseline MA(3):</span>
          <span className="text-slate-300 font-medium">{ma3.mape.toFixed(2)}%</span>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Akurasi {(100 - cnn.mape).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 4. Spike F1 Card */}
      <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition rounded-xl p-4 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Deteksi Lonjakan (P95 F1)</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
            &ge; {p95_threshold.toFixed(1)} µg/m³
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-400 tracking-tight">
            {cnn.spike_detection.f1_score.toFixed(4)}
          </span>
          <span className="text-xs text-slate-400">F1-Score</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400">Precision:</span>
          <span className="text-slate-300 font-medium">{(cnn.spike_detection.precision * 100).toFixed(1)}%</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">Recall:</span>
          <span className="text-slate-300 font-medium">{(cnn.spike_detection.recall * 100).toFixed(1)}%</span>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {f1Imp >= 0 ? `+${f1Imp.toFixed(1)}% vs Baseline` : `${f1Imp.toFixed(1)}% vs Baseline`}
          </span>
        </div>
      </div>
    </div>
  );
}
