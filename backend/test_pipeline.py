import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import unittest
import numpy as np
import pandas as pd
from pathlib import Path

from backend.src.config import CITIES, DEFAULT_WINDOW_SIZE
from backend.src.data_fetcher import get_city_data
from backend.src.preprocessor import (
    handle_missing_values,
    split_data_chronological,
    PM25MinMaxScaler,
    create_sliding_windows,
    prepare_dataset_pipeline
)
from backend.src.model import build_cnn_lstm_attention_model, ScaledDotProductAttention
from backend.src.baselines import predict_persistence, predict_moving_average, evaluate_all_baselines
from backend.src.evaluator import compute_rmse, compute_mae, compute_mape, compute_spike_metrics

class TestPM25Pipeline(unittest.TestCase):

    def test_01_data_loading(self):
        """Test data loading for Jakarta."""
        df = get_city_data("jakarta")
        self.assertIsInstance(df, pd.DataFrame)
        self.assertIn("timestamp", df.columns)
        self.assertIn("pm2_5", df.columns)
        self.assertGreater(len(df), 4000, "Dataset should have at least 4000 hourly points")

    def test_02_linear_interpolation(self):
        """Test handling missing values via linear interpolation."""
        dates = pd.date_range("2023-01-01", periods=10, freq="h")
        values = [10.0, np.nan, 30.0, np.nan, np.nan, 60.0, 70.0, 80.0, 90.0, 100.0]
        test_df = pd.DataFrame({"timestamp": dates, "pm2_5": values})
        clean_df = handle_missing_values(test_df, "pm2_5")
        
        self.assertEqual(clean_df["pm2_5"].isna().sum(), 0)
        self.assertAlmostEqual(clean_df["pm2_5"].iloc[1], 20.0)
        self.assertAlmostEqual(clean_df["pm2_5"].iloc[3], 40.0)
        self.assertAlmostEqual(clean_df["pm2_5"].iloc[4], 50.0)

    def test_03_chronological_split(self):
        """Test strict chronological 70/15/15 splitting without shuffling."""
        n = 1000
        dates = pd.date_range("2023-01-01", periods=n, freq="h")
        df = pd.DataFrame({"timestamp": dates, "pm2_5": np.arange(n, dtype=float)})
        train, val, test = split_data_chronological(df)
        
        self.assertEqual(len(train), 700)
        self.assertEqual(len(val), 150)
        self.assertEqual(len(test), 150)
        # Check order is preserved
        self.assertEqual(train["pm2_5"].iloc[-1] + 1, val["pm2_5"].iloc[0])
        self.assertEqual(val["pm2_5"].iloc[-1] + 1, test["pm2_5"].iloc[0])

    def test_04_minmax_scaler_no_leakage(self):
        """Test Min-Max scaler fitted solely on train data."""
        train_vals = np.array([10.0, 20.0, 50.0])
        scaler = PM25MinMaxScaler().fit(train_vals)
        self.assertEqual(scaler.x_min, 10.0)
        self.assertEqual(scaler.x_max, 50.0)

        # Transform and inverse transform
        norm = scaler.transform(np.array([10.0, 30.0, 50.0]))
        np.testing.assert_allclose(norm, [0.0, 0.5, 1.0])
        inv = scaler.inverse_transform(norm)
        np.testing.assert_allclose(inv, [10.0, 30.0, 50.0])

    def test_05_sliding_windows(self):
        """Test sliding window tensor creation (W=24, one-hour ahead target)."""
        series = np.arange(100, dtype=float)
        timestamps = pd.date_range("2023-01-01", periods=100, freq="h").values
        W = 24
        X, y, t = create_sliding_windows(series, timestamps, window_size=W)
        
        self.assertEqual(X.shape, (100 - W, W, 1))
        self.assertEqual(y.shape, (100 - W, 1))
        self.assertEqual(len(t), 100 - W)
        # First sample check
        np.testing.assert_allclose(X[0, :, 0], series[:W])
        self.assertEqual(y[0, 0], series[W])

    def test_06_baselines(self):
        """Test persistence and moving average calculations."""
        # Window of 24 steps
        sample_window = np.arange(1, 25, dtype=float).reshape(1, 24, 1) # values 1 to 24
        # Persistence: y_hat = 24
        pers = predict_persistence(sample_window)
        self.assertEqual(pers[0, 0], 24.0)

        # MA(3): average of last 3 (22, 23, 24) = 23.0
        ma3 = predict_moving_average(sample_window, k=3)
        self.assertEqual(ma3[0, 0], 23.0)

    def test_07_evaluator_metrics(self):
        """Test RMSE, MAE, MAPE and Spike Detection."""
        y_true = np.array([50.0, 60.0, 100.0, 40.0])
        y_pred = np.array([50.0, 65.0, 90.0, 40.0])
        rmse = compute_rmse(y_true, y_pred)
        mae = compute_mae(y_true, y_pred)
        self.assertAlmostEqual(mae, 3.75)
        self.assertTrue(rmse > 0)

        # Spike detection with threshold 80
        spike_eval = compute_spike_metrics(y_true, y_pred, threshold=80.0)
        self.assertEqual(spike_eval["tp"], 1)
        self.assertEqual(spike_eval["fp"], 0)
        self.assertEqual(spike_eval["fn"], 0)
        self.assertEqual(spike_eval["f1_score"], 1.0)

    def test_08_model_forward_pass(self):
        """Test CNN-LSTM-Attention model architecture builds and does a forward pass."""
        model = build_cnn_lstm_attention_model(window_size=24)
        dummy_x = np.random.randn(2, 24, 1).astype(np.float32)
        out = model(dummy_x)
        self.assertEqual(out.shape, (2, 1))

if __name__ == "__main__":
    unittest.main()
