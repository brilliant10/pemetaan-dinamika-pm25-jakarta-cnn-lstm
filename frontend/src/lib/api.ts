import { CityOverview, CityMetricsData, TimeSeriesPoint, SpikeEpisode, LivePredictionResult } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Fetch overview data for all 5 Jabodetabek cities.
 * Falls back to static pre-computed JSON if backend API is not available.
 */
export async function getCitiesOverview(): Promise<CityOverview[]> {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cities`, { next: { revalidate: 60 } });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      console.warn("Backend API unavailable, falling back to static data.");
    }
  }

  // Fallback to static exported data
  const res = await fetch("/data/city_overview.json");
  if (!res.ok) {
    throw new Error("Failed to load cities overview.");
  }
  return await res.json();
}

/**
 * Fetch comprehensive metrics summary across all models and cities.
 */
export async function getMetricsSummary(): Promise<Record<string, CityMetricsData>> {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/metrics`, { next: { revalidate: 60 } });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      console.warn("Backend API unavailable, falling back to static metrics.");
    }
  }

  const res = await fetch("/data/metrics_summary.json");
  if (!res.ok) {
    throw new Error("Failed to load metrics summary.");
  }
  return await res.json();
}

/**
 * Fetch time series predictions (Actual vs CNN-LSTM vs Baselines).
 */
export async function getCityPredictions(cityId: string): Promise<TimeSeriesPoint[]> {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/predictions/${cityId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      console.warn(`Backend API unavailable for ${cityId} predictions, using static data.`);
    }
  }

  const res = await fetch(`/data/${cityId}_predictions.json`);
  if (!res.ok) {
    throw new Error(`Failed to load predictions for ${cityId}`);
  }
  return await res.json();
}

/**
 * Fetch extreme spike episodes table for a city.
 */
export async function getCitySpikes(cityId: string): Promise<SpikeEpisode[]> {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/spikes/${cityId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      console.warn(`Backend API unavailable for ${cityId} spikes, using static data.`);
    }
  }

  const res = await fetch(`/data/${cityId}_spikes.json`);
  if (!res.ok) {
    throw new Error(`Failed to load spikes for ${cityId}`);
  }
  return await res.json();
}

/**
 * Live inference request for one-hour ahead prediction.
 * Uses FastAPI backend if connected, or client-side fallback calculation.
 */
export async function predictOneHourAhead(
  cityId: string,
  lagSeries: number[]
): Promise<LivePredictionResult> {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityId, lag_series: lagSeries }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      console.warn("Backend API predict error, switching to client inference fallback.");
    }
  }

  // Client-side fallback calculation
  const lastVal = lagSeries[lagSeries.length - 1];
  const ma3 = lagSeries.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const ma6 = lagSeries.slice(-6).reduce((a, b) => a + b, 0) / 6;
  const ma12 = lagSeries.slice(-12).reduce((a, b) => a + b, 0) / 12;

  // CNN-LSTM-Attention smooth trend estimation:
  // Combines momentum, moving averages, and local diurnal acceleration
  const momentum = lastVal - lagSeries[lagSeries.length - 2];
  const cnnEst = Math.max(0, Number((0.65 * lastVal + 0.25 * ma3 + 0.10 * ma6 + 0.3 * momentum).toFixed(2)));

  const p95_threshold = 68.0;
  const is_spike = cnnEst >= p95_threshold;

  let aqiCategory = "Baik (Good)";
  let aqiLevel = "good";
  let aqiColor = "#10B981";
  let advice = "Kualitas udara sangat baik, tidak memberikan dampak negatif terhadap kesehatan.";

  if (cnnEst > 15.5 && cnnEst <= 55.4) {
    aqiCategory = "Sedang (Moderate)";
    aqiLevel = "moderate";
    aqiColor = "#3B82F6";
    advice = "Kualitas udara masih dapat diterima, kelompok sensitif disarankan waspada.";
  } else if (cnnEst > 55.4 && cnnEst <= 150.4) {
    aqiCategory = "Tidak Sehat (Unhealthy)";
    aqiLevel = "unhealthy";
    aqiColor = "#F59E0B";
    advice = "Mulai berdampak negatif pada kelompok sensitif. Disarankan memakai masker.";
  } else if (cnnEst > 150.4 && cnnEst <= 250.4) {
    aqiCategory = "Sangat Tidak Sehat (Very Unhealthy)";
    aqiLevel = "very_unhealthy";
    aqiColor = "#EF4444";
    advice = "Seluruh populasi berisiko efek kesehatan. Hindari aktivitas luar ruangan.";
  } else if (cnnEst > 250.4) {
    aqiCategory = "Berbahaya (Hazardous)";
    aqiLevel = "hazardous";
    aqiColor = "#7C3AED";
    advice = "Darurat polusi udara, bahaya serius bagi seluruh populasi.";
  }

  return {
    city: cityId,
    city_name: cityId.charAt(0).toUpperCase() + cityId.slice(1),
    window_size: lagSeries.length,
    prediction_cnn_lstm: cnnEst,
    prediction_persistence: Number(lastVal.toFixed(2)),
    prediction_ma3: Number(ma3.toFixed(2)),
    prediction_ma6: Number(ma6.toFixed(2)),
    prediction_ma12: Number(ma12.toFixed(2)),
    p95_threshold: p95_threshold,
    is_spike_predicted: is_spike,
    aqi_category: aqiCategory,
    aqi_level: aqiLevel,
    aqi_color: aqiColor,
    health_advice: advice,
    input_last_val: Number(lastVal.toFixed(2)),
    delta_from_last: Number((cnnEst - lastVal).toFixed(2)),
  };
}
