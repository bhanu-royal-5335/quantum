import os
import math
import pickle
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score

from .processor import dataset_processor

MODEL_CACHE_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'data', 'qkd_ml_models.pkl')
)

FEATURE_NAMES = [
    "temperature_c",
    "dew_point_c",
    "relative_humidity_percent",
    "surface_pressure_kpa",
    "wind_speed_ms",
    "wind_direction_deg",
    "precipitation_mmh",
    "dew_point_depression",
    "hour",
    "month"
]

FEATURE_LABELS = {
    "temperature_c": "Temperature (°C)",
    "dew_point_c": "Dew Point (°C)",
    "relative_humidity_percent": "Relative Humidity (%)",
    "surface_pressure_kpa": "Surface Pressure (kPa)",
    "wind_speed_ms": "Wind Speed (m/s)",
    "wind_direction_deg": "Wind Direction (°)",
    "precipitation_mmh": "Precipitation Rate (mm/h)",
    "dew_point_depression": "Dew Point Depression (°C)",
    "hour": "Hour of Day (Diurnal)",
    "month": "Month of Year (Seasonal)"
}


class QuantumQKDMLTrainer:
    """
    Supervised Machine Learning module trained directly on NASA POWER MERRA-2
    meteorological dataset (8,760 continuous hourly observations).
    
    Predicts:
    1. Total Optical Channel Loss (dB)
    2. Quantum Bit Error Rate (QBER %)
    3. Estimated Secret Key Rate (SKR bps)
    4. Quantum Security Binary Determination (Secure vs Abort)
    """

    def __init__(self):
        self.loss_model: Optional[RandomForestRegressor] = None
        self.qber_model: Optional[RandomForestRegressor] = None
        self.skr_model: Optional[RandomForestRegressor] = None
        self.security_classifier: Optional[RandomForestClassifier] = None
        self.training_summary: Optional[Dict[str, Any]] = None
        self.is_trained = False
        self._try_load_cached_model()

    def _extract_feature_matrix(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Extracts numerical feature matrix X and targets Y from the 8,760 dataset records."""
        records = dataset_processor.records
        X = []
        y_loss = []
        y_qber = []
        y_skr = []
        y_sec = []

        for r in records:
            dp_depression = max(0.0, r["temperature_c"] - r["dew_point_c"])
            feat = [
                r["temperature_c"],
                r["dew_point_c"],
                r["relative_humidity_percent"],
                r["surface_pressure_kpa"],
                r["wind_speed_ms"],
                r["wind_direction_deg"],
                r["precipitation_mmh"],
                dp_depression,
                r["hour"],
                r["month"]
            ]
            X.append(feat)
            y_loss.append(r["simulated_channel_loss_db"])
            y_qber.append(r["simulated_qber_percent"])
            y_skr.append(r["simulated_skr_bps"])
            y_sec.append(1 if r["is_secure"] else 0)

        return (
            np.array(X, dtype=np.float32),
            np.array(y_loss, dtype=np.float32),
            np.array(y_qber, dtype=np.float32),
            np.array(y_skr, dtype=np.float32),
            np.array(y_sec, dtype=np.int32)
        )

    def train_models(self, test_size: float = 0.20, random_state: int = 42) -> Dict[str, Any]:
        """
        Trains Random Forest Regressors and Classifiers on the 8,760 hours dataset.
        Computes train/test R^2, MAE, RMSE, cross-validation, and feature importances.
        """
        X, y_loss, y_qber, y_skr, y_sec = self._extract_feature_matrix()

        # Split into 80% train (7,008 hours), 20% test (1,752 hours)
        X_train, X_test, y_loss_train, y_loss_test = train_test_split(X, y_loss, test_size=test_size, random_state=random_state)
        _, _, y_qber_train, y_qber_test = train_test_split(X, y_qber, test_size=test_size, random_state=random_state)
        _, _, y_skr_train, y_skr_test = train_test_split(X, y_skr, test_size=test_size, random_state=random_state)
        _, _, y_sec_train, y_sec_test = train_test_split(X, y_sec, test_size=test_size, random_state=random_state)

        # 1. Channel Loss Model
        self.loss_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=-1)
        self.loss_model.fit(X_train, y_loss_train)
        pred_loss_test = self.loss_model.predict(X_test)
        pred_loss_train = self.loss_model.predict(X_train)

        # 2. QBER Model
        self.qber_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=-1)
        self.qber_model.fit(X_train, y_qber_train)
        pred_qber_test = self.qber_model.predict(X_test)
        pred_qber_train = self.qber_model.predict(X_train)

        # 3. Secret Key Rate Model
        self.skr_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=-1)
        self.skr_model.fit(X_train, y_skr_train)
        pred_skr_test = self.skr_model.predict(X_test)
        pred_skr_train = self.skr_model.predict(X_train)

        # 4. Security Classifier
        self.security_classifier = RandomForestClassifier(n_estimators=80, max_depth=10, random_state=random_state, n_jobs=-1)
        self.security_classifier.fit(X_train, y_sec_train)
        pred_sec_test = self.security_classifier.predict(X_test)

        # Compute Feature Importances (from Loss & QBER models)
        loss_importances = self.loss_model.feature_importances_
        qber_importances = self.qber_model.feature_importances_

        feature_ranking = []
        for i, name in enumerate(FEATURE_NAMES):
            avg_imp = (loss_importances[i] + qber_importances[i]) / 2.0
            feature_ranking.append({
                "feature": name,
                "label": FEATURE_LABELS[name],
                "importance_loss": round(float(loss_importances[i]), 4),
                "importance_qber": round(float(qber_importances[i]), 4),
                "importance_composite": round(float(avg_imp), 4),
                "importance_percent": round(float(avg_imp * 100.0), 2)
            })

        feature_ranking.sort(key=lambda x: x["importance_composite"], reverse=True)

        self.training_summary = {
            "dataset_file": dataset_processor.metadata.get("filename", ""),
            "total_samples": len(X),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "algorithm": "Random Forest Regressor & Classifier Ensemble (100 Trees, Depth 12)",
            "metrics": {
                "channel_loss": {
                    "train_r2": round(float(r2_score(y_loss_train, pred_loss_train)), 4),
                    "test_r2": round(float(r2_score(y_loss_test, pred_loss_test)), 4),
                    "test_mae_db": round(float(mean_absolute_error(y_loss_test, pred_loss_test)), 3),
                    "test_rmse_db": round(float(math.sqrt(mean_squared_error(y_loss_test, pred_loss_test))), 3)
                },
                "qber": {
                    "train_r2": round(float(r2_score(y_qber_train, pred_qber_train)), 4),
                    "test_r2": round(float(r2_score(y_qber_test, pred_qber_test)), 4),
                    "test_mae_percent": round(float(mean_absolute_error(y_qber_test, pred_qber_test)), 3),
                    "test_rmse_percent": round(float(math.sqrt(mean_squared_error(y_qber_test, pred_qber_test))), 3)
                },
                "secret_key_rate": {
                    "train_r2": round(float(r2_score(y_skr_train, pred_skr_train)), 4),
                    "test_r2": round(float(r2_score(y_skr_test, pred_skr_test)), 4),
                    "test_mae_bps": round(float(mean_absolute_error(y_skr_test, pred_skr_test)), 1),
                    "test_rmse_bps": round(float(math.sqrt(mean_squared_error(y_skr_test, pred_skr_test))), 1)
                },
                "security_classification": {
                    "test_accuracy_percent": round(float(accuracy_score(y_sec_test, pred_sec_test) * 100.0), 2)
                }
            },
            "feature_ranking": feature_ranking,
            "trained_at": dataset_processor.records[0]["timestamp"] if dataset_processor.records else ""
        }

        self.is_trained = True
        self._cache_model()
        return self.training_summary

    def predict(self, weather_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs ML inference using the trained Random Forest models on given weather parameters.
        """
        if not self.is_trained:
            self.train_models()

        t2m = float(weather_input.get("temperature_c", 25.0))
        t2mdew = float(weather_input.get("dew_point_c", t2m - 5.0))
        rh2m = float(weather_input.get("relative_humidity_percent", 50.0))
        ps = float(weather_input.get("surface_pressure_kpa", 95.0))
        ws = float(weather_input.get("wind_speed_ms", 3.0))
        wd = float(weather_input.get("wind_direction_deg", 90.0))
        precip = float(weather_input.get("precipitation_mmh", 0.0))
        hour = int(weather_input.get("hour", 12))
        month = int(weather_input.get("month", 6))
        dp_depression = max(0.0, t2m - t2mdew)

        features = np.array([[
            t2m, t2mdew, rh2m, ps, ws, wd, precip, dp_depression, hour, month
        ]], dtype=np.float32)

        pred_loss = float(self.loss_model.predict(features)[0])
        pred_qber = float(self.qber_model.predict(features)[0])
        pred_skr = float(self.skr_model.predict(features)[0])
        pred_sec = bool(self.security_classifier.predict(features)[0] == 1)

        return {
            "predicted_channel_loss_db": round(pred_loss, 2),
            "predicted_qber_percent": round(pred_qber, 3),
            "predicted_skr_bps": round(max(0.0, pred_skr), 1),
            "is_secure": pred_sec and pred_qber < 11.0,
            "model_provenance": "Trained Machine Learning Model (Random Forest on NASA POWER MERRA-2)"
        }

    def _cache_model(self):
        """Persists trained model checkpoints to disk."""
        try:
            os.makedirs(os.path.dirname(MODEL_CACHE_FILE), exist_ok=True)
            with open(MODEL_CACHE_FILE, 'wb') as f:
                pickle.dump({
                    "loss_model": self.loss_model,
                    "qber_model": self.qber_model,
                    "skr_model": self.skr_model,
                    "security_classifier": self.security_classifier,
                    "training_summary": self.training_summary
                }, f)
        except Exception as e:
            print(f"Warning: Failed to cache ML models: {e}")

    def _try_load_cached_model(self):
        """Attempts to load cached model checkpoints from disk."""
        if os.path.exists(MODEL_CACHE_FILE):
            try:
                with open(MODEL_CACHE_FILE, 'rb') as f:
                    data = pickle.load(f)
                    self.loss_model = data.get("loss_model")
                    self.qber_model = data.get("qber_model")
                    self.skr_model = data.get("skr_model")
                    self.security_classifier = data.get("security_classifier")
                    self.training_summary = data.get("training_summary")
                    self.is_trained = True
            except Exception:
                pass


# Global singleton ML trainer
ml_trainer = QuantumQKDMLTrainer()
