import numpy as np
from typing import Dict

def predict_persistence(X: np.ndarray) -> np.ndarray:
    """
    Persistence (Naive) Forecast:
    \\hat{y}_{t+1} = y_t
    
    Given input tensor X of shape (N, W, 1), the prediction is the last time step x_{W-1}.
    Returns:
        array of shape (N, 1)
    """
    # X shape: (N, W, 1) -> take the last step along axis 1
    return X[:, -1, :].copy()

def predict_moving_average(X: np.ndarray, k: int) -> np.ndarray:
    """
    Moving Average Forecast with window size k:
    \\hat{y}_{t+1} = (1 / k) * \\sum_{i=0}^{k-1} y_{t-i}
    
    Given input tensor X of shape (N, W, 1), takes the mean of the last k time steps.
    Returns:
        array of shape (N, 1)
    """
    window_length = X.shape[1]
    effective_k = min(k, window_length)
    # Take last k steps: X[:, -effective_k:, :]
    return np.mean(X[:, -effective_k:, :], axis=1)

def evaluate_all_baselines(X_test: np.ndarray, ma_windows: list = [3, 6, 12]) -> Dict[str, np.ndarray]:
    """
    Compute predictions for Persistence and Moving Average baselines on test set.
    Returns dictionary mapping baseline name to prediction array of shape (N, 1).
    """
    preds = {
        "persistence": predict_persistence(X_test)
    }
    for k in ma_windows:
        preds[f"moving_average_{k}"] = predict_moving_average(X_test, k=k)
    return preds
