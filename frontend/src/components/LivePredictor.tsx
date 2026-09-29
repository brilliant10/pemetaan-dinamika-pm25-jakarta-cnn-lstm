"use client";

import { useState } from "react";
import { CityOverview, LivePredictionResult } from "@/lib/types";
import { predictOneHourAhead } from "@/lib/api";
import { Cpu, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";

interface LivePredictorProps {
  cities: CityOverview[];
  defaultCityId?: string;
}

export function LivePredictor({ cities, defaultCityId = "jakarta" }: LivePredictorProps) {
  const [selectedCity, setSelectedCity] = useState(defaultCityId);
  const [lagValues, setLagValues] = useState<number[]>([
    38, 36, 35, 34, 33, 35, 42, 55, 68, 72, 70, 65,
    62, 59, 58, 60, 63, 71, 79, 85, 88, 91, 94, 98,
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LivePredictionResult | null>(null);

  // Preset scenarios
  const applyPreset = (type: "spike" | "moderate" | "clean") => {
    if (type === "spike") {
      setLagValues([
        45, 48, 50, 52, 56, 60, 65, 72, 80, 89, 95, 102,
        108, 115, 121, 125, 128, 130, 134, 138, 142, 146, 149, 153,
      ]);
    } else if (type === "moderate") {
      setLagValues([
        32, 34, 35, 36, 38, 41, 45, 48, 52, 50, 48, 45,
        44, 43, 42, 45, 47, 50, 53, 55, 54, 52, 51, 49,
      ]);
    } else {
      setLagValues([
        14, 13, 12, 11, 10, 10, 11, 12, 13, 15, 16, 15,
        14, 14, 13, 12, 13, 14, 15, 16, 15, 14, 13, 12,
      ]);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const pred = await predictOneHourAhead(selectedCity, lagValues);
      setResult(pred);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLagChange = (index: number, val: number) => {
    const updated = [...lagValues];
    updated[index] = Math.max(0, val);
    setLagValues(updated);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Simulator Prediksi 1-Jam ke Depan (One-Hour-Ahead Engine)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Input 24 jam data lag PM2.5 (W=24) untuk mengestimasi konsentrasi jam ke-25 (y_t+1)
          </p>
        </div>

        {/* City selector dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Kota Model:</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.full_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Profil Skenario Cepat:
        </span>
        <button
          onClick={() => applyPreset("spike")}
          className="px-2.5 py-1 rounded-lg text-xs bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 transition font-medium"
        >
          Lonjakan Kritis (Spike)
        </button>
        <button
          onClick={() => applyPreset("moderate")}
          className="px-2.5 py-1 rounded-lg text-xs bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 transition font-medium"
        >
          Kondisi Tipikal Jabodetabek
        </button>
        <button
          onClick={() => applyPreset("clean")}
          className="px-2.5 py-1 rounded-lg text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 transition font-medium"
        >
          Udara Bersih (Pasca Hujan)
        </button>
      </div>

      {/* 24-Hour Input Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            Sekuens Riwayat 24 Jam Terakhir ($t-23$ s/d $t$):
          </span>
          <span className="text-[11px] text-slate-500">Satuan: µg/m³</span>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-3 bg-slate-950 rounded-xl border border-slate-850">
          {lagValues.map((val, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-[9px] text-slate-500 font-mono mb-0.5">
                {idx === 23 ? "t (Now)" : `t-${23 - idx}`}
              </span>
              <input
                type="number"
                value={val}
                onChange={(e) => handleLagChange(idx, Number(e.target.value))}
                className={`w-full py-1 text-center font-mono text-xs rounded border focus:outline-none ${
                  idx === 23
                    ? "bg-cyan-950 text-cyan-300 border-cyan-500 font-bold"
                    : "bg-slate-900 text-slate-200 border-slate-800 focus:border-cyan-500"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handlePredict}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Menghitung Estimasi...
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4" /> Prediksi 1 Jam ke Depan (y_t+1)
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Results Display */}
      {result && (
        <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
            {/* Predicted Value Card */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 shadow-lg text-center">
              <div className="text-xs uppercase font-bold text-cyan-400 mb-1">
                Hasil Prediksi CNN-LSTM-Attention
              </div>
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {result.prediction_cnn_lstm.toFixed(2)}
                <span className="text-sm font-normal text-slate-400 ml-1">µg/m³</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-1">
                <span>Perubahan dari t ({result.input_last_val}):</span>
                <span
                  className={`font-bold ${
                    result.delta_from_last >= 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {result.delta_from_last >= 0 ? `+${result.delta_from_last}` : result.delta_from_last} µg/m³
                </span>
              </div>
            </div>

            {/* AQI Status & Health Advice */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: result.aqi_color }}
                />
                <span className="text-sm font-bold" style={{ color: result.aqi_color }}>
                  {result.aqi_category}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {result.health_advice}
              </p>
              {result.is_spike_predicted ? (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>
                    <strong>Peringatan Lonjakan:</strong> Melebihi ambang P95 ({result.p95_threshold} µg/m³).
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Di bawah ambang batas ekstrem P95 ({result.p95_threshold} µg/m³).</span>
                </div>
              )}
            </div>

            {/* Model Comparison Column */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-slate-300 mb-1 border-b border-slate-800 pb-1">
                Komparasi Model Pembanding:
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Persistence (Naive):</span>
                <span className="text-amber-400 font-mono font-bold">
                  {result.prediction_persistence.toFixed(2)} µg/m³
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Moving Average (k=3):</span>
                <span className="text-purple-400 font-mono font-bold">
                  {result.prediction_ma3.toFixed(2)} µg/m³
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Moving Average (k=6):</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {result.prediction_ma6.toFixed(2)} µg/m³
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Moving Average (k=12):</span>
                <span className="text-rose-400 font-mono font-bold">
                  {result.prediction_ma12.toFixed(2)} µg/m³
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
