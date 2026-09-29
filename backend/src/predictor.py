import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import json
import logging
import numpy as np
import keras
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.src.config import SAVED_MODELS_DIR, CITIES, DEFAULT_WINDOW_SIZE
from backend.src.preprocessor import PM25MinMaxScaler

logger = logging.getLogger(__name__)

def get_aqi_category(pm25_value: float) -> Dict[str, str]:
    """
    Categorize PM2.5 concentration according to Indonesian ISPU (Permen LHK No. 14/2020)
    and WHO air quality thresholds.
    """
    if pm25_value <= 15.5:
        return {
            "category": "Baik (Good)",
            "level": "good",
            "color": "#10B981", # Emerald
            "advice": "Kualitas udara sangat baik, tidak memberikan dampak negatif terhadap kesehatan."
        }
    elif pm25_value <= 55.4:
        return {
            "category": "Sedang (Moderate)",
            "level": "moderate",
            "color": "#3B82F6", # Blue
            "advice": "Kualitas udara masih dapat diterima, kelompok sangat sensitif disarankan mengurangi aktivitas fisik berat."
        }
    elif pm25_value <= 150.4:
        return {
            "category": "Tidak Sehat (Unhealthy)",
            "level": "unhealthy",
            "color": "#F59E0B", # Amber
            "advice": "Mulai berdampak negatif pada kelompok sensitif (anak-anak, lansia, penderita asma). Kenakan masker."
        }
    elif pm25_value <= 250.4:
        return {
            "category": "Sangat Tidak Sehat (Very Unhealthy)",
            "level": "very_unhealthy",
            "color": "#EF4444", # Red
            "advice": "Tingkat polusi tinggi, seluruh populasi berisiko mengalami efek kesehatan. Hindari aktivitas luar ruangan."
        }
    else:
        return {
            "category": "Berbahaya (Hazardous)",
            "level": "hazardous",
            "color": "#7C3AED", # Purple
            "advice": "Tingkat darurat polusi udara, bahaya serius bagi seluruh populasi. Tetap di dalam ruangan dengan penyaring udara."
        }

class CityPredictor:
    """
    Inference engine for a single city's trained CNN-LSTM-Attention model and scaler.
    """
    def __init__(self, city_key: str):
        self.city_key = city_key
        self.model_path = SAVED_MODELS_DIR / f"{city_key}_model.keras"
        self.scaler_path = SAVED_MODELS_DIR / f"scaler_{city_key}.json"
        self.metadata_path = SAVED_MODELS_DIR / f"meta_{city_key}.json"
        
        self.model: Optional[keras.Model] = None
        self.scaler: Optional[PM25MinMaxScaler] = None
        self.metadata: Dict[str, Any] = {}
        self.load()

    def load(self) -> bool:
        """Load trained weights, scaler parameters, and metadata."""
        try:
            if self.scaler_path.exists():
                self.scaler = PM25MinMaxScaler.load(self.scaler_path)
            if self.metadata_path.exists():
                with open(self.metadata_path, "r") as f:
                    self.metadata = json.load(f)
            if self.model_path.exists():
                self.model = keras.models.load_model(self.model_path)
                logger.info(f"Loaded trained model for {self.city_key} from {self.model_path}")
                return True
        except Exception as e:
            logger.warning(f"Could not load model for {self.city_key}: {e}")
        return False

    def predict_one_hour_ahead(self, lag_series: List[float]) -> Dict[str, Any]:
        """
        Given the last W lag values (e.g. 24 hours of PM2.5 in ug/m3),
        predict the PM2.5 concentration for the next hour (t+1).
        """
        expected_w = self.metadata.get("window_size", DEFAULT_WINDOW_SIZE)
        if len(lag_series) < expected_w:
            raise ValueError(f"Need at least {expected_w} lag values, got {len(lag_series)}")
            
        recent_lags = np.array(lag_series[-expected_w:], dtype=np.float32)
        
        # Baselines calculated directly from lag series
        persistence_val = float(recent_lags[-1])
        ma3_val = float(np.mean(recent_lags[-3:]))
        ma6_val = float(np.mean(recent_lags[-6:]))
        ma12_val = float(np.mean(recent_lags[-12:]))
        
        cnn_val = persistence_val # fallback if model not loaded
        if self.model is not None and self.scaler is not None:
            # MinMax normalize using training set min/max
            norm_input = self.scaler.transform(recent_lags).reshape(1, expected_w, 1)
            pred_norm = self.model.predict(norm_input, verbose=0)[0][0]
            # Inverse transform back to ug/m3
            cnn_val = float(self.scaler.inverse_transform(np.array([[pred_norm]]))[0][0])
            cnn_val = max(0.0, cnn_val)

        p95_threshold = self.metadata.get("p95_threshold", 65.0)
        is_spike = cnn_val >= p95_threshold
        aqi_info = get_aqi_category(cnn_val)

        return {
            "city": self.city_key,
            "city_name": CITIES.get(self.city_key, {}).get("name", self.city_key.capitalize()),
            "window_size": expected_w,
            "prediction_cnn_lstm": round(cnn_val, 2),
            "prediction_persistence": round(persistence_val, 2),
            "prediction_ma3": round(ma3_val, 2),
            "prediction_ma6": round(ma6_val, 2),
            "prediction_ma12": round(ma12_val, 2),
            "p95_threshold": round(p95_threshold, 2),
            "is_spike_predicted": is_spike,
            "aqi_category": aqi_info["category"],
            "aqi_level": aqi_info["level"],
            "aqi_color": aqi_info["color"],
            "health_advice": aqi_info["advice"],
            "input_last_val": round(persistence_val, 2),
            "delta_from_last": round(cnn_val - persistence_val, 2)
        }
