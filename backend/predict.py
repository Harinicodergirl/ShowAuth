import joblib
import numpy as np

# ─────────────────────────────────────────────
# LOAD MODELS
# ─────────────────────────────────────────────

rf_model = joblib.load("../models/random_forest.joblib")
xgb_model = joblib.load("../models/xgboost.joblib")
scaler = joblib.load("../models/scaler.joblib")

# Transaction fraud model (NEW)
txn_model = joblib.load("../models/transaction_model.joblib")


def predict_risk(feature_vector, transaction_features=None):

    # ─────────────────────────────────────────
    # SCALE BEHAVIOR FEATURES
    # ─────────────────────────────────────────
    feature_vector = scaler.transform([feature_vector])

    # RF PROBABILITY
    rf_prob = rf_model.predict_proba(feature_vector)[0][1]

    # XGBOOST PROBABILITY
    xgb_prob = xgb_model.predict_proba(feature_vector)[0][1]

    # ─────────────────────────────────────────
    # BEHAVIOR RISK SCORE
    # ─────────────────────────────────────────
    genuinity_prob = (rf_prob + xgb_prob) / 2
    behavior_risk = 1 - genuinity_prob

    # ─────────────────────────────────────────
    # TRANSACTION RISK SCORE (NEW)
    # ─────────────────────────────────────────
    txn_risk = 0.0

    if transaction_features is not None:
        txn_features = np.array(transaction_features).reshape(1, -1)
        txn_prob = txn_model.predict_proba(txn_features)[0][1]
        txn_risk = txn_prob

    # ─────────────────────────────────────────
    # FINAL COMBINED RISK
    # ─────────────────────────────────────────
    risk_score = 0.6 * behavior_risk + 0.4 * txn_risk

    # ─────────────────────────────────────────
    # CLASSIFICATION
    # ─────────────────────────────────────────
    if risk_score >= 0.6:
        prediction = "Fraudulent"
    elif risk_score >= 0.3:
        prediction = "Suspicious"
    else:
        prediction = "Legitimate"

    # ─────────────────────────────────────────
    # RETURN OUTPUT
    # ─────────────────────────────────────────
    return {
        "rf_score": float(rf_prob),
        "xgb_score": float(xgb_prob),
        "behavior_risk": float(behavior_risk),
        "transaction_risk": float(txn_risk),
        "final_score": float(risk_score),
        "prediction": prediction
    }