import json
import logging
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, Optional
from pathlib import Path
from backend.src.config import TRAIN_RATIO, VAL_RATIO, TEST_RATIO, DEFAULT_WINDOW_SIZE

logger = logging.getLogger(__name__)

class PM25MinMaxScaler:
    """
    Min-Max Scaler computed strictly from the training dataset to prevent data leakage.
    Provides transform and inverse_transform back to original units (ug/m3).
    """
    def __init__(self, x_min: Optional[float] = None, x_max: Optional[float] = None):
        self.x_min = x_min
        self.x_max = x_max

    def fit(self, train_values: np.ndarray) -> "PM25MinMaxScaler":
        self.x_min = float(np.min(train_values))
        self.x_max = float(np.max(train_values))
        if self.x_max == self.x_min:
            self.x_max = self.x_min + 1e-6
        logger.info(f"Fitted Min-Max Scaler on Train Set: min={self.x_min:.4f}, max={self.x_max:.4f}")
        return self

    def transform(self, values: np.ndarray) -> np.ndarray:
        if self.x_min is None or self.x_max is None:
            raise ValueError("Scaler must be fitted before transforming data.")
        return (values - self.x_min) / (self.x_max - self.x_min)

    def inverse_transform(self, normalized_values: np.ndarray) -> np.ndarray:
        if self.x_min is None or self.x_max is None:
            raise ValueError("Scaler must be fitted before inverse transforming data.")
        return (normalized_values * (self.x_max - self.x_min)) + self.x_min

    def to_dict(self) -> Dict[str, float]:
        return {"x_min": self.x_min, "x_max": self.x_max}

    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> "PM25MinMaxScaler":
        return cls(x_min=data["x_min"], x_max=data["x_max"])

    def save(self, filepath: Path) -> None:
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, filepath: Path) -> "PM25MinMaxScaler":
        with open(filepath, "r") as f:
            data = json.load(f)
        return cls.from_dict(data)


def handle_missing_values(df: pd.DataFrame, col_name: str = "pm2_5") -> pd.DataFrame:
    """
    Handle missing values using linear interpolation.
    Follows with forward-fill and backward-fill to handle any boundary NaNs.
    """
    df = df.copy()
    initial_nans = df[col_name].isna().sum()
    if initial_nans > 0:
        logger.info(f"Interpolating {initial_nans} missing values in '{col_name}' using linear method...")
        df[col_name] = df[col_name].interpolate(method="linear")
        df[col_name] = df[col_name].bfill().ffill()
    return df


def split_data_chronological(
    df: pd.DataFrame,
    train_ratio: float = TRAIN_RATIO,
    val_ratio: float = VAL_RATIO,
    test_ratio: float = TEST_RATIO
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split time-series data chronologically without shuffling:
    70% Train, 15% Validation, 15% Test.
    """
    n = len(df)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))
    
    train_df = df.iloc[:train_end].copy().reset_index(drop=True)
    val_df = df.iloc[train_end:val_end].copy().reset_index(drop=True)
    test_df = df.iloc[val_end:].copy().reset_index(drop=True)
    
    logger.info(f"Chronological Split: Total={n}, Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    return train_df, val_df, test_df


def create_sliding_windows(
    series: np.ndarray,
    timestamps: np.ndarray,
    window_size: int = DEFAULT_WINDOW_SIZE
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Create sliding windows with length W for one-hour-ahead forecasting (y_{t+1}).
    
    Given series [x_0, x_1, ..., x_{N-1}]:
    Sample 0: X = [x_0, ..., x_{W-1}], y = x_W, target_time = time_W
    Sample 1: X = [x_1, ..., x_W], y = x_{W+1}, target_time = time_{W+1}
    ...
    Returns:
        X: shape (num_samples, window_size, 1)
        y: shape (num_samples, 1)
        target_timestamps: shape (num_samples,)
    """
    X, y, target_times = [], [], []
    n = len(series)
    
    for i in range(n - window_size):
        X.append(series[i : i + window_size])
        y.append(series[i + window_size])
        target_times.append(timestamps[i + window_size])
        
    X_arr = np.array(X, dtype=np.float32).reshape(-1, window_size, 1)
    y_arr = np.array(y, dtype=np.float32).reshape(-1, 1)
    target_times_arr = np.array(target_times)
    
    return X_arr, y_arr, target_times_arr


def prepare_dataset_pipeline(
    df: pd.DataFrame,
    window_size: int = DEFAULT_WINDOW_SIZE
) -> Dict[str, Any]:
    """
    Full preprocessing pipeline:
    1. Linear interpolation on missing values
    2. Chronological split (70% train, 15% val, 15% test)
    3. Fit Min-Max scaler strictly on train set
    4. Transform train, val, and test series
    5. Construct sliding windows (W, 1) -> (1,)
    
    Returns dictionary with all processed arrays, timestamps, and scaler.
    """
    clean_df = handle_missing_values(df, "pm2_5")
    train_df, val_df, test_df = split_data_chronological(clean_df)
    
    # Calculate P95 threshold strictly from the training set
    p95_threshold = float(np.percentile(train_df["pm2_5"].values, 95.0))
    logger.info(f"Training Set 95th Percentile (P95 Spike Threshold): {p95_threshold:.2f} ug/m3")
    
    # Fit scaler strictly on train
    scaler = PM25MinMaxScaler().fit(train_df["pm2_5"].values)
    
    # Normalize series
    train_norm = scaler.transform(train_df["pm2_5"].values)
    val_norm = scaler.transform(val_df["pm2_5"].values)
    test_norm = scaler.transform(test_df["pm2_5"].values)
    
    # Generate windows
    X_train, y_train, times_train = create_sliding_windows(
        train_norm, train_df["timestamp"].values, window_size
    )
    X_val, y_val, times_val = create_sliding_windows(
        val_norm, val_df["timestamp"].values, window_size
    )
    X_test, y_test, times_test = create_sliding_windows(
        test_norm, test_df["timestamp"].values, window_size
    )
    
    # Keep original unnormalized targets for baseline evaluation & ground truth
    y_test_orig = test_df["pm2_5"].values[window_size:]
    y_val_orig = val_df["pm2_5"].values[window_size:]
    y_train_orig = train_df["pm2_5"].values[window_size:]
    
    return {
        "scaler": scaler,
        "p95_threshold": p95_threshold,
        "clean_df": clean_df,
        "train_df": train_df,
        "val_df": val_df,
        "test_df": test_df,
        "X_train": X_train,
        "y_train": y_train,
        "y_train_orig": y_train_orig,
        "times_train": times_train,
        "X_val": X_val,
        "y_val": y_val,
        "y_val_orig": y_val_orig,
        "times_val": times_val,
        "X_test": X_test,
        "y_test": y_test,
        "y_test_orig": y_test_orig,
        "times_test": times_test,
        "window_size": window_size
    }
