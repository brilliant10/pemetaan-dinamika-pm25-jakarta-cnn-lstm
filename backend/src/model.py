import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import logging
import keras
from keras import layers, ops
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

@keras.saving.register_keras_serializable(package="PM25Forecast")
class ScaledDotProductAttention(layers.Layer):
    """
    Scaled Dot-Product Attention Layer according to Vaswani et al. & Thesis Bab 3:
    Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V
    
    Extracts informative temporal dependencies by scoring relevance across LSTM time steps.
    """
    def __init__(self, key_dim: int = 32, value_dim: Optional[int] = None, **kwargs):
        super().__init__(**kwargs)
        self.key_dim = key_dim
        self.value_dim = value_dim if value_dim is not None else key_dim

    def build(self, input_shape):
        feature_dim = input_shape[-1]
        self.q_dense = layers.Dense(self.key_dim, name="query_projection")
        self.k_dense = layers.Dense(self.key_dim, name="key_projection")
        self.v_dense = layers.Dense(self.value_dim, name="value_projection")
        super().build(input_shape)

    def call(self, inputs, return_attention_scores: bool = False):
        # inputs shape: (batch_size, time_steps, features)
        Q = self.q_dense(inputs)  # (batch_size, time_steps, key_dim)
        K = self.k_dense(inputs)  # (batch_size, time_steps, key_dim)
        V = self.v_dense(inputs)  # (batch_size, time_steps, value_dim)

        # Scale factor: sqrt(d_k)
        scale = ops.sqrt(ops.cast(self.key_dim, dtype=inputs.dtype))

        # Dot product scores: Q K^T -> (batch_size, time_steps, time_steps)
        scores = ops.matmul(Q, ops.transpose(K, axes=[0, 2, 1])) / scale

        # Softmax over time_steps
        attention_weights = ops.softmax(scores, axis=-1)

        # Context vector: (batch_size, time_steps, value_dim)
        context = ops.matmul(attention_weights, V)

        if return_attention_scores:
            return context, attention_weights
        return context

    def get_config(self):
        config = super().get_config()
        config.update({
            "key_dim": self.key_dim,
            "value_dim": self.value_dim
        })
        return config


def build_cnn_lstm_attention_model(
    window_size: int = 24,
    conv_filters: int = 64,
    conv_kernel: int = 3,
    pool_size: int = 2,
    dropout_rate: float = 0.2,
    lstm_units: int = 64,
    attention_key_dim: int = 32,
    learning_rate: float = 0.001
) -> keras.Model:
    """
    Builds the CNN-LSTM-Attention neural network architecture specified in Bab 3:
    - Layer 1: Input (W, 1)
    - Layer 2: Conv1D (filters=64, kernel=3, relu, padding='same')
    - Layer 3: MaxPooling1D (pool_size=2)
    - Layer 4: Dropout (0.2)
    - Layer 5: LSTM (units=64, return_sequences=True)
    - Layer 6: Scaled Dot-Product Attention (softmax(QK^T / sqrt(d_k)) V)
    - Layer 7: GlobalAveragePooling1D
    - Layer 8: Dense(1, activation='linear')
    """
    # 1. Input Layer: (W, 1)
    inputs = layers.Input(shape=(window_size, 1), name="pm25_lag_input")

    # 2. Conv1D: Feature extraction for local spatiotemporal trends
    x = layers.Conv1D(
        filters=conv_filters,
        kernel_size=conv_kernel,
        padding="same",
        activation="relu",
        name="conv1d_local_features"
    )(inputs)

    # 3. MaxPooling1D: Subsampling & prominent feature reduction
    x = layers.MaxPooling1D(pool_size=pool_size, name="maxpool1d")(x)

    # 4. Dropout: Regularization to prevent overfitting
    x = layers.Dropout(rate=dropout_rate, name="conv_dropout")(x)

    # 5. LSTM Layer: Capturing long-term temporal dependencies
    x = layers.LSTM(
        units=lstm_units,
        return_sequences=True,
        name="lstm_temporal_seq"
    )(x)

    # 6. Scaled Dot-Product Attention: Re-weighting informative time steps
    x = ScaledDotProductAttention(
        key_dim=attention_key_dim,
        name="scaled_dot_product_attention"
    )(x)

    # 7. GlobalAveragePooling1D: Summarize attention sequence into feature vector
    x = layers.GlobalAveragePooling1D(name="global_avg_pool")(x)

    # 8. Dense Output Layer: Predict one-hour-ahead PM2.5 (normalized)
    outputs = layers.Dense(units=1, activation="linear", name="pm25_one_hour_ahead")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="CNN_LSTM_Attention_PM25")

    optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss="mean_squared_error",
        metrics=["mae", "mse"]
    )

    logger.info("Successfully constructed CNN-LSTM-Attention Model:")
    model.summary(print_fn=lambda s: logger.info(s))
    return model
