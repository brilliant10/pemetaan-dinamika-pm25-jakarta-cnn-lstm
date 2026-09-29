export interface SpikeMetrics {
  threshold: number;
  total_actual_spikes: number;
  total_predicted_spikes: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface ModelMetricResult {
  model_name: string;
  rmse: number;
  mae: number;
  mape: number;
  spike_detection: SpikeMetrics;
}

export interface CityMetricsData {
  city_name: string;
  full_name: string;
  p95_threshold: number;
  metrics: {
    cnn_lstm_attention: ModelMetricResult;
    persistence: ModelMetricResult;
    moving_average_3: ModelMetricResult;
    moving_average_6: ModelMetricResult;
    moving_average_12: ModelMetricResult;
  };
  training_history: {
    loss: number[];
    val_loss: number[];
  };
}

export interface CityOverview {
  id: string;
  name: string;
  full_name: string;
  latitude: number;
  longitude: number;
  description: string;
  p95_threshold: number;
  latest_pm25: number;
  aqi_category: string;
  aqi_level: "good" | "moderate" | "unhealthy" | "very_unhealthy" | "hazardous";
  aqi_color: string;
  health_advice: string;
  cnn_lstm_rmse: number;
  cnn_lstm_mae: number;
  cnn_lstm_mape: number;
  cnn_lstm_f1_spike: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  actual: number;
  cnn_lstm: number;
  persistence: number;
  ma3: number;
  ma6: number;
  ma12: number;
  is_actual_spike: boolean;
  is_cnn_spike: boolean;
}

export interface SpikeEpisode {
  timestamp: string;
  actual_pm25: number;
  is_actual_spike: boolean;
  cnn_lstm_pred: number;
  cnn_detected: boolean;
  error: number;
  persistence_pred?: number;
  persistence_detected?: boolean;
  moving_average_3_pred?: number;
  moving_average_3_detected?: boolean;
}

export interface LivePredictionResult {
  city: string;
  city_name: string;
  window_size: number;
  prediction_cnn_lstm: number;
  prediction_persistence: number;
  prediction_ma3: number;
  prediction_ma6: number;
  prediction_ma12: number;
  p95_threshold: number;
  is_spike_predicted: boolean;
  aqi_category: string;
  aqi_level: string;
  aqi_color: string;
  health_advice: string;
  input_last_val: number;
  delta_from_last: number;
}
