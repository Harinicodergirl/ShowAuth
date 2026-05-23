"""
app.py
------
Flask API for behavioural + transaction fraud detection system
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

from feature_extraction import extract_features
from predict import predict_risk

import time

from transaction_features import extract_transaction_features

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ─────────────────────────────────────────────
# FEATURE SCHEMA
# ─────────────────────────────────────────────
FEATURE_SCHEMA = [
    {"name": "mean_dwell"},
    {"name": "std_dwell"},
    {"name": "max_dwell"},
    {"name": "correction_count"},
    {"name": "backspace_frequency"},
    {"name": "shift_usage"},
    {"name": "avg_velocity"},
    {"name": "acceleration"},
    {"name": "total_distance"},
    {"name": "click_count"},
    {"name": "hesitation"},
    {"name": "pauses"},
    {"name": "direction_changes"},
]


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ─────────────────────────────────────────────
# NORMALIZATION
# ─────────────────────────────────────────────
def normalize_events(body):

    body.setdefault("key_events", [])
    body.setdefault("mouse_events", [])

    return body


# ─────────────────────────────────────────────
# MAIN PREDICT ENDPOINT
# ─────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():

    start_time = time.time()
    body = request.get_json(silent=True)

    # Validate request
    if not body:
        return jsonify({"status": "error", "message": "Invalid JSON"}), 400

    if "key_events" not in body or "mouse_events" not in body:
        return jsonify({"status": "error", "message": "Missing events"}), 422

    # Optional transaction features (NEW)
    transaction_features = body.get("transaction_features", None)

    session_id = body.get("session_id", None)

    transaction_data = body.get(
    "transaction_data",
    {}
)

    # Normalize
    body = normalize_events(body)

    # Feature extraction
    try:
        feature_vector = extract_features(body)

        txn_feature_vector = extract_transaction_features(
        transaction_data
)
    except Exception as e:
        return jsonify({
            "status": "error",
            "stage": "feature_extraction",
            "message": str(e)
        }), 500

    # Prediction
    try:
        result = predict_risk(
        feature_vector,
        txn_feature_vector
)
    except Exception as e:
        return jsonify({
            "status": "error",
            "stage": "prediction",
            "message": str(e)
        }), 500

    # Feature debug mapping
    feature_debug = {
        FEATURE_SCHEMA[i]["name"]: round(feature_vector[i], 4)
        for i in range(len(FEATURE_SCHEMA))
    }

    # Response
    response = {
        "status": "success",
        "session_id": session_id,

        "rf_score": result["rf_score"],
        "xgb_score": result["xgb_score"],

        "behavior_risk": result["behavior_risk"],
        "transaction_risk": result["transaction_risk"],

        "risk_score": result["final_score"],
        "prediction": result["prediction"],

        "features": feature_debug,
        "latency_ms": round((time.time() - start_time) * 1000, 2)
    }

    return jsonify(response), 200


# ─────────────────────────────────────────────
# RUN SERVER
# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)