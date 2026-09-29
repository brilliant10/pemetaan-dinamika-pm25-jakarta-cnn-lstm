"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from "recharts";
import { TimeSeriesPoint } from "@/lib/types";
import { Eye, SlidersHorizontal } from "lucide-react";

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  cityName: string;
  p95Threshold: number;
}

export function TimeSeriesChart({ data, cityName, p95Threshold }: TimeSeriesChartProps) {
  // Visibility toggles for baseline models
  const [showActual, setShowActual] = useState(true);
  const [showCnn, setShowCnn] = useState(true);
  const [showPers, setShowPers] = useState(true);
  const [showMa3, setShowMa3] = useState(false);
  const [showMa6, setShowMa6] = useState(false);
  const [showMa12, setShowMa12] = useState(false);
  const [showP95, setShowP95] = useState(true);

  // Time range slice: 72 hours, 168 hours (7 days), or all test set (~740 hours)
  const [timeRange, setTimeRange] = useState<"72" | "168" | "all">("168");

  const displayData =
    timeRange === "72"
      ? data.slice(-72)
      : timeRange === "168"
      ? data.slice(-168)
      : data;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Perbandingan Deret Waktu: Aktual vs Model ({cityName})
          </h3>
          <p className="text-xs text-slate-400">
            One-Hour-Ahead Forecasting pada Periode Data Uji (Test Set 15% Kronologis)
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setTimeRange("72")}
            className={`px-2.5 py-1 rounded-md transition ${
              timeRange === "72" ? "bg-cyan-600 text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            3 Hari Terakhir
          </button>
          <button
            onClick={() => setTimeRange("168")}
            className={`px-2.5 py-1 rounded-md transition ${
              timeRange === "168" ? "bg-cyan-600 text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`px-2.5 py-1 rounded-md transition ${
              timeRange === "all" ? "bg-cyan-600 text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Semua Data Uji ({data.length} Jam)
          </button>
        </div>
      </div>

      {/* Baseline Model Toggle Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-slate-950/60 rounded-xl border border-slate-850 text-xs">
        <span className="text-slate-400 flex items-center gap-1 px-1 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Tampilkan:
        </span>

        <button
          onClick={() => setShowActual(!showActual)}
          className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
            showActual
              ? "bg-slate-700/80 text-white border-slate-500 font-semibold"
              : "bg-slate-900 text-slate-500 border-slate-800"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-white rounded" />
          Aktual (Ground Truth)
        </button>

        <button
          onClick={() => setShowCnn(!showCnn)}
          className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
            showCnn
              ? "bg-cyan-950 text-cyan-300 border-cyan-500 font-semibold"
              : "bg-slate-900 text-slate-500 border-slate-800"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-cyan-400 rounded" />
          CNN-LSTM-Attention
        </button>

        <button
          onClick={() => setShowPers(!showPers)}
          className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
            showPers
              ? "bg-amber-950 text-amber-300 border-amber-500 font-semibold"
              : "bg-slate-900 text-slate-500 border-slate-800"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-amber-400 rounded" />
          Persistence (Naive)
        </button>

        <button
          onClick={() => setShowMa3(!showMa3)}
          className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
            showMa3
              ? "bg-purple-950 text-purple-300 border-purple-500 font-semibold"
              : "bg-slate-900 text-slate-500 border-slate-800"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-purple-400 rounded" />
          MA (k=3)
        </button>

        <button
          onClick={() => setShowMa6(!showMa6)}
          className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
            showMa6
              ? "bg-emerald-950 text-emerald-300 border-emerald-500 font-semibold"
              : "bg-slate-900 text-slate-500 border-slate-800"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-emerald-400 rounded" />
          MA (k=6)
        </button>

        <button
          onClick={() => setShowMa12(!showMa12)}
          className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
            showMa12
              ? "bg-rose-950 text-rose-300 border-rose-500 font-semibold"
              : "bg-slate-900 text-slate-500 border-slate-800"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-rose-400 rounded" />
          MA (k=12)
        </button>

        <button
          onClick={() => setShowP95(!showP95)}
          className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
            showP95
              ? "bg-red-950 text-red-300 border-red-500 font-semibold"
              : "bg-slate-900 text-slate-500 border-slate-800"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-red-500 rounded" />
          P95 Spike Threshold ({p95Threshold.toFixed(1)})
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timestamp"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              tickFormatter={(str) => {
                // Short date format: '07-15 14:00'
                const parts = str.split(" ");
                if (parts.length >= 2) {
                  return `${parts[0].slice(5)} ${parts[1].slice(0, 5)}`;
                }
                return str;
              }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              domain={[0, "auto"]}
              label={{
                value: "PM2.5 (µg/m³)",
                angle: -90,
                position: "insideLeft",
                fill: "#94a3b8",
                fontSize: 12,
                offset: 15,
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-lg shadow-xl text-xs backdrop-blur-md">
                    <p className="font-bold text-slate-300 mb-1.5 border-b border-slate-800 pb-1">
                      Waktu Target: {label}
                    </p>
                    <div className="space-y-1">
                      {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4">
                          <span style={{ color: entry.color }} className="font-medium">
                            {entry.name}:
                          </span>
                          <span className="font-bold text-white">{Number(entry.value).toFixed(2)} µg/m³</span>
                        </div>
                      ))}
                      {showP95 && (
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-red-400">
                          <span>Threshold P95:</span>
                          <span className="font-bold">{p95Threshold.toFixed(2)} µg/m³</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            {/* P95 Spike Reference Line */}
            {showP95 && (
              <ReferenceLine
                y={p95Threshold}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `P95 Spike: ${p95Threshold.toFixed(1)} µg/m³`,
                  fill: "#ef4444",
                  fontSize: 11,
                  position: "top",
                }}
              />
            )}

            {/* Actual Ground Truth Line */}
            {showActual && (
              <Line
                type="monotone"
                dataKey="actual"
                name="Aktual (Ground Truth)"
                stroke="#f8fafc"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#ffffff" }}
              />
            )}

            {/* CNN-LSTM-Attention Model Line */}
            {showCnn && (
              <Line
                type="monotone"
                dataKey="cnn_lstm"
                name="CNN-LSTM-Attention"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: "#06b6d4" }}
              />
            )}

            {/* Persistence Baseline Line */}
            {showPers && (
              <Line
                type="monotone"
                dataKey="persistence"
                name="Persistence (Naive)"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            )}

            {/* Moving Average 3 */}
            {showMa3 && (
              <Line
                type="monotone"
                dataKey="ma3"
                name="Moving Average (k=3)"
                stroke="#c084fc"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
              />
            )}

            {/* Moving Average 6 */}
            {showMa6 && (
              <Line
                type="monotone"
                dataKey="ma6"
                name="Moving Average (k=6)"
                stroke="#34d399"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
              />
            )}

            {/* Moving Average 12 */}
            {showMa12 && (
              <Line
                type="monotone"
                dataKey="ma12"
                name="Moving Average (k=12)"
                stroke="#fb7185"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
