import numpy as np
from typing import Dict, Any, List

def compute_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Squared Error (RMSE)"""
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

def compute_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Error (MAE)"""
    return float(np.mean(np.abs(y_true - y_pred)))

def compute_mape(y_true: np.ndarray, y_pred: np.ndarray, epsilon: float = 1e-5) -> float:
    """Mean Absolute Percentage Error (MAPE in %)"""
    return float(np.mean(np.abs((y_true - y_pred) / (np.abs(y_true) + epsilon))) * 100.0)

def compute_spike_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    threshold: float
) -> Dict[str, Any]:
    """
    Spike Detection Metrics based on 95th percentile (P95) threshold.
    Returns:
        threshold, true_spikes_count, pred_spikes_count,
        precision, recall, f1_score, tp, fp, fn, tn
    """
    true_labels = (y_true >= threshold).astype(int).flatten()
    pred_labels = (y_pred >= threshold).astype(int).flatten()
    
    tp = int(np.sum((true_labels == 1) & (pred_labels == 1)))
    fp = int(np.sum((true_labels == 0) & (pred_labels == 1)))
    fn = int(np.sum((true_labels == 1) & (pred_labels == 0)))
    tn = int(np.sum((true_labels == 0) & (pred_labels == 0)))
    
    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    
    return {
        "threshold": round(threshold, 2),
        "total_actual_spikes": int(np.sum(true_labels)),
        "total_predicted_spikes": int(np.sum(pred_labels)),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4)
    }

def evaluate_model_performance(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    p95_threshold: float,
    model_name: str = "model"
) -> Dict[str, Any]:
    """
    Complete evaluation suite:
    - Regression metrics: RMSE, MAE, MAPE
    - Extreme spike detection: Precision, Recall, F1
    """
    y_true = np.asarray(y_true).flatten()
    y_pred = np.asarray(y_pred).flatten()
    
    rmse = compute_rmse(y_true, y_pred)
    mae = compute_mae(y_true, y_pred)
    mape = compute_mape(y_true, y_pred)
    spike_eval = compute_spike_metrics(y_true, y_pred, p95_threshold)
    
    return {
        "model_name": model_name,
        "rmse": round(rmse, 3),
        "mae": round(mae, 3),
        "mape": round(mape, 2),
        "spike_detection": spike_eval
    }

def extract_spike_episodes(
    timestamps: np.ndarray,
    y_true: np.ndarray,
    predictions_dict: Dict[str, np.ndarray],
    threshold: float
) -> List[Dict[str, Any]]:
    """
    Extract table of time steps where an extreme spike occurred (y_true >= threshold)
    or was predicted by models.
    """
    episodes = []
    y_true_flat = np.asarray(y_true).flatten()
    
    for i, t in enumerate(timestamps):
        actual_val = float(y_true_flat[i])
        is_actual_spike = actual_val >= threshold
        
        # Check if any model predicted spike
        cnn_pred = float(predictions_dict.get("cnn_lstm_attention", [0])[i])
        is_cnn_spike = cnn_pred >= threshold
        
        # We record rows that are actual spikes or high concentration (> 90% of threshold)
        if is_actual_spike or is_cnn_spike:
            row = {
                "timestamp": str(t)[:19].replace("T", " "),
                "actual_pm25": round(actual_val, 2),
                "is_actual_spike": is_actual_spike,
                "cnn_lstm_pred": round(cnn_pred, 2),
                "cnn_detected": is_cnn_spike,
                "error": round(abs(cnn_pred - actual_val), 2)
            }
            # Add persistence and moving average predictions if available
            for k, preds in predictions_dict.items():
                if k not in ["cnn_lstm_attention"]:
                    pred_val = float(preds[i])
                    row[f"{k}_pred"] = round(pred_val, 2)
                    row[f"{k}_detected"] = pred_val >= threshold
            episodes.append(row)
            
    return episodes
