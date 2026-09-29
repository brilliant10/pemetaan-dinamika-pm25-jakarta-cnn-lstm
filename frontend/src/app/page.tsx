"use client";

import { useEffect, useState } from "react";
import { CityOverview, CityMetricsData, TimeSeriesPoint } from "@/lib/types";
import { getCitiesOverview, getMetricsSummary, getCityPredictions } from "@/lib/api";
import { CitySelector } from "@/components/CitySelector";
import { SpatialMap } from "@/components/SpatialMap";
import { MetricsGrid } from "@/components/MetricsGrid";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";
import { ArrowUpRight, BarChart2, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [cities, setCities] = useState<CityOverview[]>([]);
  const [metricsSummary, setMetricsSummary] = useState<Record<string, CityMetricsData>>({});
  const [selectedCityId, setSelectedCityId] = useState<string>("jakarta");
  const [predictions, setPredictions] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [citiesData, metricsData] = await Promise.all([
          getCitiesOverview(),
          getMetricsSummary(),
        ]);
        setCities(citiesData);
        setMetricsSummary(metricsData);
        if (citiesData.length > 0) {
          setSelectedCityId(citiesData[0].id);
        }
      } catch (err) {
        console.error("Error loading initial overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Load predictions when selected city changes
  useEffect(() => {
    async function loadPredictions() {
      try {
        const preds = await getCityPredictions(selectedCityId);
        setPredictions(preds);
      } catch (err) {
        console.error(`Error loading predictions for ${selectedCityId}:`, err);
      }
    }
    if (selectedCityId) {
      loadPredictions();
    }
  }, [selectedCityId]);

  const selectedCity = cities.find((c) => c.id === selectedCityId) || cities[0];
  const cityMetrics = metricsSummary[selectedCityId];

  return (
    <div className="space-y-6">
      {/* Title & Introduction Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Sistem Prediksi Spasial-Temporal &bull; Bab 3 Skripsi
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pemetaan Dinamika PM2.5 di Jakarta & Jabodetabek
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Prediksi konsentrasi partikulat halus PM2.5 satu jam ke depan (W=24) menggunakan model gabungan{" "}
              <strong className="text-cyan-400">CNN-LSTM dengan Scaled Dot-Product Attention</strong> pada periode Januari–Juli 2023,
              dibandingkan dengan model <span className="text-amber-400">Persistence</span> dan{" "}
              <span className="text-purple-400">Moving Average</span>.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <Link
              href="/spikes"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1.5 shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Studio Spike</span>
            </Link>
            <Link
              href="/predict"
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
            >
              <Cpu className="w-4 h-4" />
              <span>Simulator 1-Jam</span>
            </Link>
          </div>
        </div>

        {/* Quick parameters badges */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span>
            <strong>Observasi:</strong> 5.088 Jam per Kota
          </span>
          <span>&bull;</span>
          <span>
            <strong>Split:</strong> 70% Latih | 15% Validasi | 15% Uji
          </span>
          <span>&bull;</span>
          <span>
            <strong>Jendela Lag:</strong> W=24 Jam
          </span>
          <span>&bull;</span>
          <span>
            <strong>Ambang Lonjakan:</strong> Persentil ke-95 (P95)
          </span>
        </div>
      </div>

      {/* City Navigation Selector */}
      <CitySelector
        cities={cities}
        selectedCityId={selectedCityId}
        onSelectCity={setSelectedCityId}
      />

      {/* Spatial Map & Selected City Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SpatialMap
            cities={cities}
            selectedCityId={selectedCityId}
            onSelectCity={setSelectedCityId}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Profil Lokasi & Status Udara
              </span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
                style={{
                  backgroundColor: `${selectedCity?.aqi_color || "#3b82f6"}20`,
                  color: selectedCity?.aqi_color || "#3b82f6",
                  borderColor: `${selectedCity?.aqi_color || "#3b82f6"}40`,
                }}
              >
                {selectedCity?.aqi_category || "Sedang"}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-white">
              {selectedCity?.full_name || selectedCity?.name}
            </h2>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Koordinat: {selectedCity?.latitude.toFixed(4)}°, {selectedCity?.longitude.toFixed(4)}°
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {selectedCity?.description}
            </p>

            <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-850 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Rata-rata Konsentrasi Akhir (72 Jam):</span>
                <span className="font-bold text-white">
                  {selectedCity?.latest_pm25.toFixed(2)} µg/m³
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Ambang Batas Lonjakan Ekstrem (P95):</span>
                <span className="font-bold text-amber-400">
                  {selectedCity?.p95_threshold.toFixed(2)} µg/m³
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Model CNN-LSTM-Attention RMSE:</span>
                <span className="font-bold text-cyan-400">
                  {selectedCity?.cnn_lstm_rmse.toFixed(3)} µg/m³
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>F1-Score Deteksi Lonjakan:</span>
                <span className="font-bold text-emerald-400">
                  {selectedCity?.cnn_lstm_f1_spike.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 italic">
            &ldquo;{selectedCity?.health_advice}&rdquo;
          </div>
        </div>
      </div>

      {/* Metrics Scorecards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Evaluasi Komparasi Model ({selectedCity?.name})
          </h3>
          <span className="text-xs text-slate-400">Evaluasi pada 15% Data Uji Kronologis</span>
        </div>
        <MetricsGrid metricsData={cityMetrics} />
      </div>

      {/* Main Time Series Chart */}
      <TimeSeriesChart
        data={predictions}
        cityName={selectedCity?.name || "Jakarta"}
        p95Threshold={selectedCity?.p95_threshold || 65.0}
      />
    </div>
  );
}
