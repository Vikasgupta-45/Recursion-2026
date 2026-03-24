"""
Module 7 — Predictive Growth Model (growth_predictor.py)

Ensemble forecaster that combines Prophet, ARIMA, Linear Regression, and
an optional LSTM to predict future view counts.  Each model produces a
60-day forecast; the final output is a weighted average with confidence
bounds.
"""

import logging
from typing import List, Dict, Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prophet forecast
# ---------------------------------------------------------------------------

def _prophet_forecast(df: pd.DataFrame, periods: int = 60) -> pd.DataFrame | None:
    """Returns a DataFrame with columns [ds, yhat, yhat_lower, yhat_upper]."""
    try:
        from prophet import Prophet

        prophet_df = df[["ds", "y"]].copy()
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
        )
        model.fit(prophet_df)
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)
    except Exception as e:
        logger.warning("Prophet forecast failed: %s", e)
        return None


# ---------------------------------------------------------------------------
# ARIMA forecast
# ---------------------------------------------------------------------------

def _arima_forecast(series: pd.Series, periods: int = 60) -> pd.DataFrame | None:
    """SARIMAX(1,1,1) forecast; returns DataFrame with [ds, yhat]."""
    try:
        from statsmodels.tsa.statespace.sarimax import SARIMAX

        model = SARIMAX(series, order=(1, 1, 1), enforce_stationarity=False,
                        enforce_invertibility=False)
        results = model.fit(disp=False, maxiter=200)
        pred = results.get_forecast(steps=periods)
        mean = pred.predicted_mean
        ci = pred.conf_int(alpha=0.2)

        last_date = series.index[-1] if isinstance(series.index, pd.DatetimeIndex) else pd.Timestamp.now()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=periods)

        return pd.DataFrame({
            "ds": future_dates,
            "yhat": mean.values,
            "yhat_lower": ci.iloc[:, 0].values,
            "yhat_upper": ci.iloc[:, 1].values,
        })
    except Exception as e:
        logger.warning("ARIMA forecast failed: %s", e)
        return None


# ---------------------------------------------------------------------------
# Linear regression forecast
# ---------------------------------------------------------------------------

def _linear_regression_forecast(series: pd.Series, periods: int = 60) -> pd.DataFrame:
    """Simple trend-line extrapolation with ±1 std-dev confidence band."""
    X = np.arange(len(series)).reshape(-1, 1)
    y = series.values

    model = LinearRegression()
    model.fit(X, y)

    future_x = np.arange(len(series), len(series) + periods).reshape(-1, 1)
    preds = model.predict(future_x)

    std = float(np.std(y))
    last_date = series.index[-1] if isinstance(series.index, pd.DatetimeIndex) else pd.Timestamp.now()
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=periods)

    return pd.DataFrame({
        "ds": future_dates,
        "yhat": preds,
        "yhat_lower": preds - std,
        "yhat_upper": preds + std,
    })


# ---------------------------------------------------------------------------
# LSTM forecast (optional — graceful skip if TF unavailable)
# ---------------------------------------------------------------------------

def _lstm_forecast(series: pd.Series, periods: int = 60, lookback: int = 30) -> pd.DataFrame | None:
    """Minimal single-layer LSTM; returns DataFrame with [ds, yhat]."""
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense

        values = series.values.astype("float32")
        if len(values) < lookback + 1:
            return None

        # min-max scale
        v_min, v_max = values.min(), values.max()
        scale_range = v_max - v_min if v_max != v_min else 1.0
        scaled = (values - v_min) / scale_range

        X, y = [], []
        for i in range(lookback, len(scaled)):
            X.append(scaled[i - lookback:i])
            y.append(scaled[i])
        X, y = np.array(X), np.array(y)
        X = X.reshape((X.shape[0], X.shape[1], 1))

        model = Sequential([
            LSTM(32, input_shape=(lookback, 1)),
            Dense(1),
        ])
        model.compile(optimizer="adam", loss="mse")
        model.fit(X, y, epochs=20, batch_size=8, verbose=0)

        # autoregressively predict future
        last_window = scaled[-lookback:].tolist()
        preds_scaled: list[float] = []
        for _ in range(periods):
            inp = np.array(last_window[-lookback:]).reshape(1, lookback, 1)
            p = float(model.predict(inp, verbose=0)[0, 0])
            preds_scaled.append(p)
            last_window.append(p)

        preds = np.array(preds_scaled) * scale_range + v_min
        last_date = series.index[-1] if isinstance(series.index, pd.DatetimeIndex) else pd.Timestamp.now()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=periods)

        return pd.DataFrame({
            "ds": future_dates,
            "yhat": preds,
            "yhat_lower": preds * 0.9,
            "yhat_upper": preds * 1.1,
        })
    except Exception as e:
        logger.warning("LSTM forecast skipped: %s", e)
        return None


# ---------------------------------------------------------------------------
# Ensemble combiner
# ---------------------------------------------------------------------------

def _ensemble(forecasts: Dict[str, pd.DataFrame], weights: Dict[str, float]) -> pd.DataFrame:
    """Weighted average of available forecasts aligned on date index."""
    available = {k: v for k, v in forecasts.items() if v is not None and not v.empty}
    if not available:
        raise ValueError("No forecast models succeeded")

    active_weights = {k: weights.get(k, 1.0) for k in available}
    total_w = sum(active_weights.values())

    base_dates = list(available.values())[0]["ds"].values
    combined_yhat = np.zeros(len(base_dates))
    combined_lower = np.zeros(len(base_dates))
    combined_upper = np.zeros(len(base_dates))

    for name, df in available.items():
        w = active_weights[name] / total_w
        combined_yhat += df["yhat"].values * w
        combined_lower += df["yhat_lower"].values * w
        combined_upper += df["yhat_upper"].values * w

    return pd.DataFrame({
        "ds": base_dates,
        "yhat": combined_yhat,
        "yhat_lower": combined_lower,
        "yhat_upper": combined_upper,
    })


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_growth(
    timeseries: List[Dict[str, Any]],
    value_column: str = "views",
    periods: int = 60,
) -> Dict[str, Any]:
    """
    Main entry point for Module 7.

    Parameters
    ----------
    timeseries : list of dicts with keys ``date`` and ``<value_column>``.
    value_column : metric to forecast (``views``, ``subscribers``, etc.).
    periods : number of days to forecast into the future.

    Returns
    -------
    dict with ``forecast`` list, ``current_value``, ``predicted_value``,
    ``confidence_band``, and ``models_used``.
    """
    df = pd.DataFrame(timeseries)
    if df.empty or value_column not in df.columns:
        return {"error": f"No usable '{value_column}' data for prediction"}

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    df.set_index("date", inplace=True)

    series = df[value_column].astype(float)
    current_value = float(series.iloc[-1])

    # Prophet needs (ds, y)
    prophet_input = pd.DataFrame({"ds": series.index, "y": series.values})

    # Run all models
    model_outputs: Dict[str, pd.DataFrame | None] = {
        "prophet": _prophet_forecast(prophet_input, periods),
        "arima": _arima_forecast(series, periods),
        "regression": _linear_regression_forecast(series, periods),
        "lstm": _lstm_forecast(series, periods),
    }

    models_used = [k for k, v in model_outputs.items() if v is not None]

    weights = {"prophet": 0.40, "arima": 0.25, "regression": 0.15, "lstm": 0.20}
    ensemble_df = _ensemble(model_outputs, weights)

    predicted_value = float(ensemble_df["yhat"].iloc[-1])

    # ── Sanity clamp: cap forecasts at 5× current value, floor at 0 ──
    max_reasonable = max(current_value, 1) * 5
    ensemble_df["yhat"] = ensemble_df["yhat"].clip(lower=0, upper=max_reasonable)
    ensemble_df["yhat_lower"] = ensemble_df["yhat_lower"].clip(lower=0, upper=max_reasonable)
    ensemble_df["yhat_upper"] = ensemble_df["yhat_upper"].clip(lower=0, upper=max_reasonable * 1.2)
    predicted_value = float(ensemble_df["yhat"].iloc[-1])

    forecast_records = []
    for _, row in ensemble_df.iterrows():
        forecast_records.append({
            "ds": pd.Timestamp(row["ds"]).strftime("%Y-%m-%d"),
            "yhat": round(float(row["yhat"]), 2),
            "yhat_lower": round(float(row["yhat_lower"]), 2),
            "yhat_upper": round(float(row["yhat_upper"]), 2),
        })

    return {
        "current_value": round(current_value, 2),
        "predicted_value": round(predicted_value, 2),
        "growth_pct": round(((predicted_value - current_value) / max(current_value, 1)) * 100, 2),
        "periods": periods,
        "models_used": models_used,
        "forecast": forecast_records,
    }
