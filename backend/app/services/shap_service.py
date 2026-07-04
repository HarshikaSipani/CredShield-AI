import os
import joblib
import numpy as np
from ..config.settings import settings

class ShapService:
    def __init__(self):
        assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml_assets")
        self.explainer_path = os.path.join(assets_dir, "shap_explainer.joblib")
        self.metadata_path = os.path.join(assets_dir, "metadata.joblib")
        self.explainer = None
        self.metadata = None
        self._load_assets()

    def _load_assets(self):
        if os.path.exists(self.explainer_path) and os.path.exists(self.metadata_path):
            self.explainer = joblib.load(self.explainer_path)
            self.metadata = joblib.load(self.metadata_path)
            print("SHAP explainer asset loaded successfully into memory.")
        else:
            print("Warning: SHAP assets not found. ShapService running in mock mode.")

    def explain_prediction(self, scaled_data: np.ndarray) -> dict:
        if not self.explainer or not self.metadata:
            # Fallback to mock SHAP explanation values if model not trained yet
            print("SHAP explainer not initialized. Returning mock feature attributions.")
            return {
                "age": -0.05,
                "revolving_utilization": 0.12,
                "monthly_income": -0.08,
                "debt_ratio": 0.02,
                "number_90_days_late": 0.18
            }

        features = self.metadata['features']
        
        # Calculate SHAP values
        raw_shap = self.explainer.shap_values(scaled_data)
        
        # KernelExplainer output for predict_proba can be a list of arrays (one for each class)
        # Class 1 represents the probability of default
        if isinstance(raw_shap, list):
            if len(raw_shap) > 1:
                shap_vector = raw_shap[1][0] # Get SHAP values for class 1 (default)
            else:
                shap_vector = raw_shap[0][0]
        else:
            if len(raw_shap.shape) > 2:
                shap_vector = raw_shap[0][:, 1]
            elif len(raw_shap.shape) == 2:
                shap_vector = raw_shap[0]
            else:
                shap_vector = raw_shap

        # Map features to SHAP values
        explanations = {}
        for idx, feature_name in enumerate(features):
            val = float(shap_vector[idx])
            explanations[feature_name] = round(val, 4)

        return explanations

    def generate_natural_language_explanation(self, shap_values: dict, raw_data: dict) -> str:
        """
        Generates a deterministic plain-English explainable AI summary based on the highest positive
        attributions and baseline metrics.
        """
        # Sort features by positive impact on default risk
        pos_features = sorted(
            [(k, v) for k, v in shap_values.items() if v > 0],
            key=lambda x: x[1],
            reverse=True
        )

        neg_features = sorted(
            [(k, v) for k, v in shap_values.items() if v < 0],
            key=lambda x: x[1]
        )

        reasons = []
        if pos_features:
            top_f, top_v = pos_features[0]
            friendly_name = top_f.replace("NumberOf", "Number of ").replace("Of", " of ").replace("Days", " Days").replace("RealEstate", " Real Estate")
            reasons.append(f"high credit risk is primarily driven by your {friendly_name.lower()}")
            
            if len(pos_features) > 1:
                sec_f, sec_v = pos_features[1]
                sec_friendly = sec_f.replace("NumberOf", "Number of ").replace("Of", " of ").replace("Days", " Days").replace("RealEstate", " Real Estate")
                reasons.append(f"secondarily compounded by your {sec_friendly.lower()}")
        
        if neg_features:
            top_neg_f, top_neg_v = neg_features[0]
            neg_friendly = top_neg_f.replace("NumberOf", "Number of ").replace("Of", " of ").replace("Days", " Days").replace("RealEstate", " Real Estate")
            reasons.append(f"mitigated by your positive history of {neg_friendly.lower()}")

        if not reasons:
            return "Applicant credit metrics are within standard historical parameters."

        summary = "Prediction analysis details: The " + ", and ".join(reasons) + "."
        return summary

shap_service = ShapService()
