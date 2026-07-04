import os
import joblib
import numpy as np
import pandas as pd
from ..config.settings import settings

class ModelService:
    def __init__(self):
        assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml_assets")
        self.scaler_path = os.path.join(assets_dir, "scaler.joblib")
        self.lr_path = os.path.join(assets_dir, "lr_model.joblib")
        self.rf_path = os.path.join(assets_dir, "rf_model.joblib")
        self.xgb_path = os.path.join(assets_dir, "xgb_model.joblib")
        self.metadata_path = os.path.join(assets_dir, "metadata.joblib")
        
        self.scaler = None
        self.lr = None
        self.rf = None
        self.xgb = None
        self.metadata = None
        self._load_assets()

    def _load_assets(self):
        if (os.path.exists(self.scaler_path) and 
            os.path.exists(self.lr_path) and 
            os.path.exists(self.rf_path) and 
            os.path.exists(self.xgb_path) and 
            os.path.exists(self.metadata_path)):
            
            self.scaler = joblib.load(self.scaler_path)
            self.lr = joblib.load(self.lr_path)
            self.rf = joblib.load(self.rf_path)
            self.xgb = joblib.load(self.xgb_path)
            self.metadata = joblib.load(self.metadata_path)
            print("Model assets loaded successfully into memory.")
        else:
            print("Warning: Model assets not found. ModelService running in mock mode.")

    def preprocess(self, raw_data: dict) -> np.ndarray:
        if not self.metadata or not self.scaler:
            raise ValueError("Model assets are not loaded.")

        features = self.metadata['features']
        medians = self.metadata['medians']
        clip_bounds = self.metadata['clip_bounds']

        # Convert dictionary to DataFrame with single row
        df = pd.DataFrame([raw_data])

        # Align columns
        df = df.reindex(columns=features)

        # Impute missing values
        for col in features:
            if pd.isna(df.loc[0, col]) or df.loc[0, col] is None:
                df.loc[0, col] = medians.get(col, 0)

            # Outlier clipping
            if col in clip_bounds:
                lower, upper = clip_bounds[col]
                df.loc[0, col] = np.clip(df.loc[0, col], lower, upper)

        # Scale features
        scaled_data = self.scaler.transform(df)
        return scaled_data

    def predict_default(self, raw_data: dict) -> dict:
        # Check if assets are loaded (fallback to mock if not trained yet)
        if not self.lr or not self.rf or not self.xgb:
            print("Ensemble model not fully initialized yet. Returning mock values.")
            mock_prob = 0.05
            return self._format_response(mock_prob)

        scaled_data = self.preprocess(raw_data)

        # Predict probabilities
        p_lr = self.lr.predict_proba(scaled_data)[0][1]
        p_rf = self.rf.predict_proba(scaled_data)[0][1]
        p_xgb = self.xgb.predict_proba(scaled_data)[0][1]

        # Calculate weighted ensemble probability
        w = self.metadata['model_weights']
        p_ensemble = (w['lr'] * p_lr) + (w['rf'] * p_rf) + (w['xgb'] * p_xgb)

        return self._format_response(p_ensemble)

    def _format_response(self, p_default: float) -> dict:
        # Map default probability to normalized credit-like score (300 to 850)
        risk_score = int(300 + (850 - 300) * (1.0 - p_default))
        risk_score = max(300, min(850, risk_score))

        # Classify risk category
        if p_default < 0.10:
            category = "low_risk"
            recommendation = "approve"
        elif p_default < 0.35:
            category = "medium_risk"
            recommendation = "manual_review"
        else:
            category = "high_risk"
            recommendation = "reject"

        return {
            "default_probability": float(round(p_default, 4)),
            "risk_score": risk_score,
            "risk_category": category,
            "decision_recommendation": recommendation
        }

model_service = ModelService()
