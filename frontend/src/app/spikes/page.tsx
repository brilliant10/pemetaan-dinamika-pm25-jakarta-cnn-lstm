"use client";

import { useEffect, useState } from "react";
import { CityOverview, CityMetricsData, SpikeEpisode } from "@/lib/types";
import { getCitiesOverview, getMetricsSummary, getCitySpikes } from "@/lib/api";
import { CitySelector } from "@/components/CitySelector";
import { SpikeAnalysisCard } from "@/components/SpikeAnalysisCard";
import { AlertTriangle, Flame, ShieldAlert, Award, Info } from "lucide-react";

export default function SpikesPage() {
  const [cities, setCities] = useState<CityOverview[]>([]);
  const [metricsSummary, setMetricsSummary] = useState<Record<string, CityMetricsData>>({});
  const [selectedCityId, setSelectedCityId] = useState<string>("jakarta");
  const [episodes, setEpisodes] = useState<SpikeEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadSpikes() {
      try {
        const spk = await getCitySpikes(selectedCityId);
        setEpisodes(spk);
      } catch (err) {
        console.error(err);
      }
    }
    if (selectedCityId) {
      loadSpikes();
    }
  }, [selectedCityId]);

  const selectedCity = cities.find((c) => c.id === selectedCityId) || cities[0];
  const cityMetrics = metricsSummary[selectedCityId];
  const spikeMetrics = cityMetrics?.metrics.cnn_lstm_attention.spike_detection;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold mb-2 w-fit">
          <Flame className="w-3.5 h-3.5" />
          Metrik Khusus Skripsi &bull; Deteksi Anomali Lonjakan Ekstrem
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Analisis Deteksi Lonjakan Ekstrem PM2.5 (P95 Threshold)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Pada data kualitas udara perkotaan, peristiwa polusi ekstrem terjadi secara sporadis namun membawa risiko kesehatan terbesar.
          Sesuai Bab 3, ambang batas lonjakan dihitung menggunakan <strong>persentil ke-95 (P95)</strong> dari data latih,
          dan performa deteksi dievaluasi melalui <strong>Precision, Recall, dan F1-Score</strong>.
        </p>
      </div>

      {/* City Selector */}
      <CitySelector
        cities={cities}
        selectedCityId={selectedCityId}
        onSelectCity={setSelectedCityId}
      />

      {/* Comparative Model Spike Detection Performance Table */}
      {cityMetrics && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Tabel Komparasi Kemampuan Deteksi Lonjakan ({selectedCity?.name})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Nama Model</th>
                  <th className="py-2.5 px-4">Precision (%)</th>
                  <th className="py-2.5 px-4">Recall (%)</th>
                  <th className="py-2.5 px-4">F1-Score</th>
                  <th className="py-2.5 px-4">True Positive (TP)</th>
                  <th className="py-2.5 px-4">False Alarm (FP)</th>
                  <th className="py-2.5 px-4">Missed Spike (FN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {Object.entries(cityMetrics.metrics).map(([key, res]) => {
                  const isCnn = key === "cnn_lstm_attention";
                  const spk = res.spike_detection;
                  return (
                    <tr
                      key={key}
                      className={
                        isCnn
                          ? "bg-cyan-950/40 font-bold text-cyan-200"
                          : "hover:bg-slate-800/40 text-slate-300"
                      }
                    >
                      <td className="py-3 px-4 font-sans flex items-center gap-2">
                        {isCnn && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                        {key === "cnn_lstm_attention"
                          ? "CNN-LSTM-Attention (Model Inti)"
                          : key === "persistence"
                          ? "Persistence Baseline (y_t)"
                          : key.replace("moving_average_", "Moving Average k=")}
                      </td>
                      <td className="py-3 px-4">{(spk.precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4">{(spk.recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-amber-400 font-bold">{spk.f1_score.toFixed(4)}</td>
                      <td className="py-3 px-4 text-emerald-400">{spk.tp}</td>
                      <td className="py-3 px-4 text-amber-400">{spk.fp}</td>
                      <td className="py-3 px-4 text-rose-400">{spk.fn}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spike Analysis Card with Interactive Episode Table */}
      <SpikeAnalysisCard
        episodes={episodes}
        spikeMetrics={spikeMetrics}
        cityName={selectedCity?.name || "Jakarta"}
        p95Threshold={selectedCity?.p95_threshold || 65.0}
      />

      {/* Explanatory notes */}
      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">
            Interpretasi Klinis & Metodologis Skripsi:
          </p>
          <p>
            1. Model <strong>CNN-LSTM dengan Scaled Dot-Product Attention</strong> mampu memberi bobot lebih tinggi pada langkah waktu saat gradien perubahan PM2.5 meningkat tajam, sehingga menghasilkan False Negative (FN) yang lebih rendah dibandingkan model Moving Average yang cenderung mengalami efek perlambatan (lag-delay).
          </p>
          <p>
            2. Keberhasilan deteksi lonjakan ekstrem ini sangat krusial untuk sistem peringatan dini (early warning system) bagi Dinas Lingkungan Hidup DKI Jakarta dan masyarakat rentan.
          </p>
        </div>
      </div>
    </div>
  );
}
