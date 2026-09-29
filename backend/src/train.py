import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import json
import time
import argparse
import logging
import numpy as np
import pandas as pd
import keras
from pathlib import Path
from typing import Dict, Any, List

from backend.src.config import (
    CITIES, DEFAULT_WINDOW_SIZE, SAVED_MODELS_DIR,
    EXPORTS_DIR, FRONTEND_DATA_DIR, MA_WINDOWS,
    DEFAULT_EPOCHS, BATCH_SIZE, PATIENCE_EARLY_STOPPING
)
from backend.src.data_fetcher import get_city_data
from backend.src.preprocessor import prepare_dataset_pipeline
from backend.src.model import build_cnn_lstm_attention_model
from backend.src.baselines import evaluate_all_baselines
from backend.src.evaluator import (
    evaluate_model_performance,
    extract_spike_episodes
)
from backend.src.predictor import get_aqi_category

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def train_city_model(
    city_key: str,
    window_size: int = DEFAULT_WINDOW_SIZE,
    epochs: int = DEFAULT_EPOCHS,
    batch_size: int = BATCH_SIZE,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Train and evaluate CNN-LSTM-Attention model and Baselines for a single city.
    """
    city_info = CITIES[city_key]
    logger.info("=" * 60)
    logger.info(f"STARTING TRAINING PIPELINE FOR: {city_info['name']} ({city_info['full_name']})")
    logger.info(f"Window Size: {window_size} hours | Max Epochs: {epochs} | Batch Size: {batch_size}")
    logger.info("=" * 60)

    # 1. Fetch & Prepare Data
    df = get_city_data(city_key, force_refresh=force_refresh)
    data = prepare_dataset_pipeline(df, window_size=window_size)

    scaler = data["scaler"]
    p95_threshold = data["p95_threshold"]
    X_train, y_train = data["X_train"], data["y_train"]
    X_val, y_val = data["X_val"], data["y_val"]
    X_test, y_test = data["X_test"], data["y_test"]
    y_test_orig = data["y_test_orig"]
    times_test = data["times_test"]

    logger.info(f"Dataset shapes: Train={X_train.shape}, Val={X_val.shape}, Test={X_test.shape}")

    # 2. Build CNN-LSTM-Attention Architecture
    model = build_cnn_lstm_attention_model(window_size=window_size)

    early_stopping = keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=PATIENCE_EARLY_STOPPING,
        restore_best_weights=True,
        verbose=1
    )

    # 3. Train Model
    start_time = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[early_stopping],
        verbose=1
    )
    training_duration = round(time.time() - start_time, 2)
    logger.info(f"Training completed in {training_duration}s for {city_info['name']}")

    # 4. Predict on Test Set (CNN-LSTM-Attention)
    y_pred_test_norm = model.predict(X_test, verbose=0)
    # Inverse transform to original ug/m3
    y_pred_cnn = scaler.inverse_transform(y_pred_test_norm).flatten()
    y_pred_cnn = np.clip(y_pred_cnn, 0.0, None)

    # 5. Predict on Test Set (Baselines)
    # Notice: baselines on normalized vs unnormalized are identical under linear Min-Max transform,
    # but to be mathematically exact, we evaluate on unnormalized test data.
    # Inverse transform X_test back to original scale:
    X_test_orig = scaler.inverse_transform(X_test.squeeze(-1)).reshape(X_test.shape)
    baseline_preds = evaluate_all_baselines(X_test_orig, ma_windows=MA_WINDOWS)

    all_predictions = {
        "cnn_lstm_attention": y_pred_cnn,
        "persistence": baseline_preds["persistence"].flatten(),
        "moving_average_3": baseline_preds["moving_average_3"].flatten(),
        "moving_average_6": baseline_preds["moving_average_6"].flatten(),
        "moving_average_12": baseline_preds["moving_average_12"].flatten(),
    }

    # 6. Comprehensive Metrics Evaluation
    metrics = {}
    for model_name, preds in all_predictions.items():
        eval_result = evaluate_model_performance(
            y_true=y_test_orig,
            y_pred=preds,
            p95_threshold=p95_threshold,
            model_name=model_name
        )
        metrics[model_name] = eval_result
        logger.info(
            f"[{model_name.upper()}] RMSE: {eval_result['rmse']} | "
            f"MAE: {eval_result['mae']} | MAPE: {eval_result['mape']}% | "
            f"Spike F1 ({p95_threshold:.1f} ug/m3): {eval_result['spike_detection']['f1_score']}"
        )

    # 7. Save Model Weights, Scaler, and Metadata
    model_save_path = SAVED_MODELS_DIR / f"{city_key}_model.keras"
    scaler_save_path = SAVED_MODELS_DIR / f"scaler_{city_key}.json"
    meta_save_path = SAVED_MODELS_DIR / f"meta_{city_key}.json"

    model.save(model_save_path)
    scaler.save(scaler_save_path)

    metadata = {
        "city_key": city_key,
        "city_name": city_info["name"],
        "window_size": window_size,
        "p95_threshold": round(p95_threshold, 2),
        "scaler": scaler.to_dict(),
        "training_duration_seconds": training_duration,
        "stopped_epoch": len(history.history["loss"]),
        "train_loss": round(float(history.history["loss"][-1]), 5),
        "val_loss": round(float(history.history["val_loss"][-1]), 5),
    }
    with open(meta_save_path, "w") as f:
        json.dump(metadata, f, indent=2)

    # 8. Extract Time Series Predictions Series (Formatted for Frontend)
    test_points = []
    # Save up to all test points
    for i in range(len(times_test)):
        ts_str = str(times_test[i])[:19].replace("T", " ")
        act_val = round(float(y_test_orig[i]), 2)
        cnn_val = round(float(y_pred_cnn[i]), 2)
        pers_val = round(float(all_predictions["persistence"][i]), 2)
        ma3_val = round(float(all_predictions["moving_average_3"][i]), 2)
        ma6_val = round(float(all_predictions["moving_average_6"][i]), 2)
        ma12_val = round(float(all_predictions["moving_average_12"][i]), 2)

        test_points.append({
            "timestamp": ts_str,
            "actual": act_val,
            "cnn_lstm": cnn_val,
            "persistence": pers_val,
            "ma3": ma3_val,
            "ma6": ma6_val,
            "ma12": ma12_val,
            "is_actual_spike": act_val >= p95_threshold,
            "is_cnn_spike": cnn_val >= p95_threshold
        })

    # 9. Extract Spike Episodes Table
    spike_episodes = extract_spike_episodes(
        timestamps=times_test,
        y_true=y_test_orig,
        predictions_dict=all_predictions,
        threshold=p95_threshold
    )

    return {
        "city_info": city_info,
        "metadata": metadata,
        "metrics": metrics,
        "test_series": test_points,
        "spike_episodes": spike_episodes,
        "history": {
            "loss": [round(float(v), 5) for v in history.history["loss"]],
            "val_loss": [round(float(v), 5) for v in history.history["val_loss"]],
        }
    }


def train_all_cities(
    cities: List[str] = None,
    window_size: int = DEFAULT_WINDOW_SIZE,
    epochs: int = DEFAULT_EPOCHS,
    batch_size: int = BATCH_SIZE,
    force_refresh: bool = False
):
    """
    Run full training pipeline across Jabodetabek cities and export JSON artifacts for Vercel Next.js.
    """
    if cities is None or len(cities) == 0:
        cities = list(CITIES.keys())

    all_city_results = {}
    metrics_summary = {}
    city_overview = []

    for city_key in cities:
        result = train_city_model(
            city_key=city_key,
            window_size=window_size,
            epochs=epochs,
            batch_size=batch_size,
            force_refresh=force_refresh
        )
        all_city_results[city_key] = result
        metrics_summary[city_key] = {
            "city_name": result["city_info"]["name"],
            "full_name": result["city_info"]["full_name"],
            "p95_threshold": result["metadata"]["p95_threshold"],
            "metrics": result["metrics"],
            "training_history": result["history"]
        }

        # Calculate average PM2.5 in test set to give current AQI overview
        avg_pm25 = float(np.mean([pt["actual"] for pt in result["test_series"][-72:]]))
        aqi_info = get_aqi_category(avg_pm25)

        city_overview.append({
            "id": city_key,
            "name": result["city_info"]["name"],
            "full_name": result["city_info"]["full_name"],
            "latitude": result["city_info"]["latitude"],
            "longitude": result["city_info"]["longitude"],
            "description": result["city_info"]["description"],
            "p95_threshold": result["metadata"]["p95_threshold"],
            "latest_pm25": round(avg_pm25, 2),
            "aqi_category": aqi_info["category"],
            "aqi_level": aqi_info["level"],
            "aqi_color": aqi_info["color"],
            "health_advice": aqi_info["advice"],
            "cnn_lstm_rmse": result["metrics"]["cnn_lstm_attention"]["rmse"],
            "cnn_lstm_mae": result["metrics"]["cnn_lstm_attention"]["mae"],
            "cnn_lstm_mape": result["metrics"]["cnn_lstm_attention"]["mape"],
            "cnn_lstm_f1_spike": result["metrics"]["cnn_lstm_attention"]["spike_detection"]["f1_score"]
        })

        # Save city specific prediction time-series and spikes to export folders
        for target_dir in [EXPORTS_DIR, FRONTEND_DATA_DIR]:
            pred_file = target_dir / f"{city_key}_predictions.json"
            spike_file = target_dir / f"{city_key}_spikes.json"
            with open(pred_file, "w") as f:
                json.dump(result["test_series"], f)
            with open(spike_file, "w") as f:
                json.dump(result["spike_episodes"], f, indent=2)

    # Save summary files
    for target_dir in [EXPORTS_DIR, FRONTEND_DATA_DIR]:
        with open(target_dir / "metrics_summary.json", "w") as f:
            json.dump(metrics_summary, f, indent=2)
        with open(target_dir / "city_overview.json", "w") as f:
            json.dump(city_overview, f, indent=2)

    logger.info("=" * 60)
    logger.info("ALL CITIES SUCCESSFULLY TRAINED & ARTIFACTS EXPORTED!")
    logger.info(f"Exports saved to: {EXPORTS_DIR} and {FRONTEND_DATA_DIR}")
    logger.info("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train PM2.5 CNN-LSTM-Attention Models")
    parser.add_argument("--cities", nargs="+", default=[], help="Specific city IDs to train (default: all)")
    parser.add_argument("--window", type=int, default=DEFAULT_WINDOW_SIZE, help="Sliding window size W")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=BATCH_SIZE, help="Batch size")
    parser.add_argument("--force_refresh", action="store_true", help="Force redownload from Open-Meteo API")
    args = parser.parse_args()

    train_all_cities(
        cities=args.cities if args.cities else None,
        window_size=args.window,
        epochs=args.epochs,
        batch_size=args.batch_size,
        force_refresh=args.force_refresh
    )
