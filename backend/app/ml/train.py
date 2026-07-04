import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
import shap

def run_training_pipeline(csv_path: str, output_dir: str):
    print("Loading dataset from:", csv_path)
    data = pd.read_csv(csv_path)
    data.drop(columns=['Unnamed: 0'], inplace=True, errors='ignore')
    
    target = "SeriousDlqin2yrs"
    
    # 1. Store Medians for missing value handling in API
    print("Computing column medians...")
    medians = data.median(numeric_only=True).to_dict()
    data.fillna(data.median(numeric_only=True), inplace=True)
    
    # 2. Store 1st and 99th percentiles for outlier clipping in API
    print("Computing and applying 1% & 99% outlier clipping...")
    clip_bounds = {}
    for col in data.select_dtypes(include=[np.number]).columns:
        lower = data[col].quantile(0.01)
        upper = data[col].quantile(0.99)
        clip_bounds[col] = (lower, upper)
        data[col] = data[col].clip(lower, upper)
        
    X = data.drop(columns=[target])
    y = data[target]
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.25,
        stratify=y,
        random_state=42
    )
    
    # 3. Fit scaler
    print("Standardizing features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 4. Apply SMOTE to training set
    print("Applying SMOTE balancing...")
    sm = SMOTE(random_state=42)
    X_train_res, y_train_res = sm.fit_resample(X_train_scaled, y_train)
    
    # 5. Train Models
    print("Training Logistic Regression...")
    lr = LogisticRegression(max_iter=2000)
    lr.fit(X_train_res, y_train_res)
    
    print("Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train_res, y_train_res)
    
    print("Training XGBoost...")
    scale_pos_weight = y_train.value_counts()[0] / y_train.value_counts()[1]
    xgb = XGBClassifier(
        n_estimators=400,
        learning_rate=0.03,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        eval_metric='logloss',
        random_state=42
    )
    xgb.fit(X_train_res, y_train_res)
    
    # 6. Fit SHAP Explainer using a subset of background samples to optimize speed
    print("Initializing SHAP Explainer...")
    # Use TreeExplainer on Random Forest as background distribution representation
    background_samples = shap.sample(X_train_scaled, 500)
    explainer = shap.KernelExplainer(rf.predict_proba, background_samples)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Save objects
    print("Saving assets to:", output_dir)
    joblib.dump(scaler, os.path.join(output_dir, 'scaler.joblib'))
    joblib.dump(lr, os.path.join(output_dir, 'lr_model.joblib'))
    joblib.dump(rf, os.path.join(output_dir, 'rf_model.joblib'))
    joblib.dump(xgb, os.path.join(output_dir, 'xgb_model.joblib'))
    joblib.dump(explainer, os.path.join(output_dir, 'shap_explainer.joblib'))
    
    metadata = {
        'features': list(X.columns),
        'medians': medians,
        'clip_bounds': clip_bounds,
        'model_weights': {
            'lr': 0.33,
            'rf': 0.34,
            'xgb': 0.33
        }
    }
    joblib.dump(metadata, os.path.join(output_dir, 'metadata.joblib'))
    print("Ensemble pipeline trained and serialized successfully!")

if __name__ == '__main__':
    csv_path = "e:\\cs-training.csv"
    output_dir = "e:\\Audit_Credit_Scoring_System\\backend\\app\\ml_assets"
    run_training_pipeline(csv_path, output_dir)
