import os
from pathlib import Path

# Base Paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = BACKEND_DIR.parent
DATA_RAW_DIR = BACKEND_DIR / "data" / "raw"
DATA_PROCESSED_DIR = BACKEND_DIR / "data" / "processed"
SAVED_MODELS_DIR = BACKEND_DIR / "saved_models"
EXPORTS_DIR = BACKEND_DIR / "exports"
FRONTEND_DATA_DIR = BASE_DIR / "frontend" / "public" / "data"

for path in [DATA_RAW_DIR, DATA_PROCESSED_DIR, SAVED_MODELS_DIR, EXPORTS_DIR, FRONTEND_DATA_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# 5 Cities in Jabodetabek with their spatial coordinates
CITIES = {
    "jakarta": {
        "id": "jakarta",
        "name": "Jakarta",
        "full_name": "DKI Jakarta",
        "latitude": -6.2088,
        "longitude": 106.8456,
        "description": "Pusat metropolis Jakarta dengan kepadatan lalu lintas dan aktivitas komersial tinggi."
    },
    "bogor": {
        "id": "bogor",
        "name": "Bogor",
        "full_name": "Kota Bogor",
        "latitude": -6.5971,
        "longitude": 106.8060,
        "description": "Kawasan dataran tinggi di selatan Jakarta dengan pola presipitasi tinggi."
    },
    "depok": {
        "id": "depok",
        "name": "Depok",
        "full_name": "Kota Depok",
        "latitude": -6.4025,
        "longitude": 106.7942,
        "description": "Kawasan penyangga komuter di antara Jakarta dan Bogor."
    },
    "tangerang": {
        "id": "tangerang",
        "name": "Tangerang",
        "full_name": "Kota Tangerang",
        "latitude": -6.1783,
        "longitude": 106.6319,
        "description": "Kawasan barat dengan koridor industri manufaktur dan mobilitas bandara."
    },
    "bekasi": {
        "id": "bekasi",
        "name": "Bekasi",
        "full_name": "Kota Bekasi",
        "latitude": -6.2383,
        "longitude": 106.9756,
        "description": "Kawasan timur dengan kepadatan kawasan industri dan jalur logistik padat."
    }
}

# Temporal Range for Thesis (Jan - Jul 2023)
START_DATE = "2023-01-01"
END_DATE = "2023-07-31"

# Preprocessing Ratios (70% Train, 15% Validation, 15% Test)
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# Default Sliding Window (W) for One-Hour-Ahead Forecasting
DEFAULT_WINDOW_SIZE = 24
SUPPORTED_WINDOWS = [12, 24, 48]

# Baseline Moving Average Windows
MA_WINDOWS = [3, 6, 12]

# Model Hyperparameters
CONV_FILTERS = 64
CONV_KERNEL_SIZE = 3
POOL_SIZE = 2
DROPOUT_RATE = 0.2
LSTM_UNITS = 64
ATTENTION_HEADS = 2
ATTENTION_KEY_DIM = 32
LEARNING_RATE = 0.001
BATCH_SIZE = 32
DEFAULT_EPOCHS = 35
PATIENCE_EARLY_STOPPING = 10

# Extreme Spike Anomaly Percentile
SPIKE_PERCENTILE = 95.0
