import json
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.src.config import CITIES, EXPORTS_DIR, SAVED_MODELS_DIR, DEFAULT_WINDOW_SIZE
from backend.src.predictor import CityPredictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Jabodetabek PM2.5 CNN-LSTM-Attention Forecasting API",
    description=(
        "Backend API untuk pemetaan dan prediksi konsentrasi PM2.5 di wilayah Jabodetabek "
        "(Jakarta, Bogor, Depok, Tangerang, Bekasi) menggunakan model CNN-LSTM dengan Scaled Dot-Product Attention."
    ),
    version="1.0.0"
)

# Enable CORS for Next.js development and Vercel production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Predictor Cache
predictors = {}

def get_predictor_for_city(city_key: str) -> CityPredictor:
    if city_key not in CITIES:
        raise HTTPException(status_code=404, detail=f"City '{city_key}' not found. Supported: {list(CITIES.keys())}")
    if city_key not in predictors:
        predictors[city_key] = CityPredictor(city_key)
    return predictors[city_key]

class PredictionRequest(BaseModel):
    city: str = Field(..., description="ID kota (jakarta, bogor, depok, tangerang, bekasi)")
    lag_series: List[float] = Field(..., description="Daftar nilai PM2.5 W jam terakhir (ug/m3)")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Jabodetabek PM2.5 Spatiotemporal Forecast API",
        "models": "CNN-LSTM with Scaled Dot-Product Attention",
        "supported_cities": list(CITIES.keys()),
        "endpoints": [
            "/api/health",
            "/api/cities",
            "/api/metrics",
            "/api/metrics/{city}",
            "/api/predictions/{city}",
            "/api/spikes/{city}",
            "/api/predict"
        ]
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": "healthy"}

@app.get("/api/cities")
def get_cities():
    """Retrieve overview of all 5 cities, spatial coordinates, and current status."""
    overview_file = EXPORTS_DIR / "city_overview.json"
    if overview_file.exists():
        with open(overview_file, "r") as f:
            return json.load(f)
    # Fallback to config if exports don't exist yet
    return [
        {
            "id": k,
            "name": v["name"],
            "full_name": v["full_name"],
            "latitude": v["latitude"],
            "longitude": v["longitude"],
            "description": v["description"]
        }
        for k, v in CITIES.items()
    ]

@app.get("/api/metrics")
def get_all_metrics():
    """Retrieve full comparative metrics summary (RMSE, MAE, MAPE, P95 Spike F1) for all cities."""
    metrics_file = EXPORTS_DIR / "metrics_summary.json"
    if not metrics_file.exists():
        raise HTTPException(status_code=404, detail="Metrics not yet computed. Please run train.py first.")
    with open(metrics_file, "r") as f:
        return json.load(f)

@app.get("/api/metrics/{city}")
def get_city_metrics(city: str):
    """Retrieve metrics and training loss for a specific city."""
    city_key = city.lower()
    if city_key not in CITIES:
        raise HTTPException(status_code=404, detail=f"City '{city}' not recognized.")
        
    metrics_file = EXPORTS_DIR / "metrics_summary.json"
    if not metrics_file.exists():
        raise HTTPException(status_code=404, detail="Metrics not yet generated.")
    with open(metrics_file, "r") as f:
        all_metrics = json.load(f)
    if city_key not in all_metrics:
        raise HTTPException(status_code=404, detail=f"No metrics for {city_key}")
    return all_metrics[city_key]

@app.get("/api/predictions/{city}")
def get_city_predictions(
    city: str,
    limit: Optional[int] = Query(None, description="Limit number of recent test records returned")
):
    """Retrieve test set time-series predictions (Actual vs CNN-LSTM vs Baselines)."""
    city_key = city.lower()
    pred_file = EXPORTS_DIR / f"{city_key}_predictions.json"
    if not pred_file.exists():
        raise HTTPException(status_code=404, detail=f"Predictions file for {city_key} not found. Run train.py first.")
    with open(pred_file, "r") as f:
        data = json.load(f)
    if limit is not None and limit > 0:
        return data[-limit:]
    return data

@app.get("/api/spikes/{city}")
def get_city_spikes(city: str):
    """Retrieve table of extreme spike episodes (P95 threshold events)."""
    city_key = city.lower()
    spike_file = EXPORTS_DIR / f"{city_key}_spikes.json"
    if not spike_file.exists():
        raise HTTPException(status_code=404, detail=f"Spikes data for {city_key} not found.")
    with open(spike_file, "r") as f:
        return json.load(f)

@app.post("/api/predict")
def predict_one_hour(request: PredictionRequest):
    """
    Live prediction endpoint: accepts historical PM2.5 lag series (e.g. 24 hours)
    and computes one-hour-ahead forecast using trained CNN-LSTM-Attention model.
    """
    city_key = request.city.lower()
    predictor = get_predictor_for_city(city_key)
    try:
        result = predictor.predict_one_hour_ahead(request.lag_series)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
