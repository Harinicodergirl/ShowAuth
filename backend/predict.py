import joblib
import numpy as np


# LOAD MODELS
rf_model = joblib.load(
    "../models/random_forest.joblib"
)

xgb_model = joblib.load(
    "../models/xgboost.joblib"
)

scaler = joblib.load(
    "../models/scaler.joblib"
)


def predict_risk(feature_vector):

    # SCALE FEATURES
    feature_vector = scaler.transform(
        [feature_vector]
    )

    # RF PROBABILITY
    rf_prob = rf_model.predict_proba(
        feature_vector
    )[0][1]

    # XGBOOST PROBABILITY
    xgb_prob = xgb_model.predict_proba(
        feature_vector
    )[0][1]

    # ENSEMBLE SCORE
    genuinity_prob = (
        rf_prob + xgb_prob
    ) / 2
    risk_score = 1 - genuinity_prob

    # CLASSIFICATION
    if risk_score >= 0.6:
        prediction = "Fraudulent"
    elif risk_score >= 0.3:
        prediction = "Suspicious"
    else:
        prediction = "Legitimate"

    return {

        "rf_score": float(rf_prob),

        "xgb_score": float(xgb_prob),

        "final_score": float(risk_score),

        "prediction": prediction
    }