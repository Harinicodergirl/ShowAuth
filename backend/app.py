"""
app.py
------
Flask API for behavioural authentication system (React-integrated version)

Endpoints
---------
POST /predict
GET  /health
GET  /features/schema
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

from feature_extraction import extract_features
from predict import predict_risk

import time

app = Flask(__name__)

# 🔐 safer CORS (adjust in production)
CORS(app, resources={r"/*": {"origins": "*"}})


# ── Feature schema ─────────────────────────────────────────────────────────────
FEATURE_SCHEMA = [
    {"name": "mean_dwell",           "type": "float", "unit": "ms",    "source": "keyboard"},
    {"name": "std_dwell",            "type": "float", "unit": "ms",    "source": "keyboard"},
    {"name": "max_dwell",            "type": "float", "unit": "ms",    "source": "keyboard"},
    {"name": "correction_count",     "type": "int",   "unit": "count", "source": "keyboard"},
    {"name": "backspace_frequency",  "type": "float", "unit": "ratio", "source": "keyboard"},
    {"name": "shift_usage",          "type": "float", "unit": "ratio", "source": "keyboard"},
    {"name": "avg_velocity",         "type": "float", "unit": "px/s",  "source": "mouse"},
    {"name": "acceleration",         "type": "float", "unit": "px/s²", "source": "mouse"},
    {"name": "total_distance",       "type": "float", "unit": "px",    "source": "mouse"},
    {"name": "click_count",          "type": "int",   "unit": "count", "source": "mouse"},
    {"name": "hesitation",           "type": "int",   "unit": "count", "source": "mouse"},
    {"name": "pauses",               "type": "int",   "unit": "count", "source": "mouse"},
    {"name": "direction_changes",    "type": "int",   "unit": "count", "source": "mouse"},
]


# ── Health check ───────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ── Schema endpoint ───────────────────────────────────────────────────────────
@app.route("/features/schema", methods=["GET"])
def feature_schema():
    return jsonify({
        "feature_count": len(FEATURE_SCHEMA),
        "features": FEATURE_SCHEMA,
    }), 200


# ── Normalization layer (IMPORTANT) ───────────────────────────────────────────
def normalize_events(body):
    """
    Ensures backend never breaks due to frontend inconsistencies.
    """

    body.setdefault("key_events", [])
    body.setdefault("mouse_events", [])

    for e in body["key_events"]:
        e.setdefault("key", "")
        e.setdefault("event", "")
        e.setdefault("epoch", 0)

    for e in body["mouse_events"]:
        e.setdefault("event", "")
        e.setdefault("x", 0)
        e.setdefault("y", 0)
        e.setdefault("epoch", 0)

    return body


# ── Predict endpoint ──────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    start_time = time.time()

    body = request.get_json(silent=True)

    # ── Basic validation ───────────────────────────────────────────────
    if not body or not isinstance(body, dict):
        return jsonify({
            "status": "error",
            "message": "Invalid or missing JSON body"
        }), 400

    required_fields = ["key_events", "mouse_events"]

    for field in required_fields:
        if field not in body:
            return jsonify({
                "status": "error",
                "message": f"Missing field: {field}"
            }), 422

    if not isinstance(body["key_events"], list) or not isinstance(body["mouse_events"], list):
        return jsonify({
            "status": "error",
            "message": "key_events and mouse_events must be lists"
        }), 422

    # ── Optional session tracking (highly recommended) ────────────────
    session_id = body.get("session_id", None)

    # ── Normalize input ────────────────────────────────────────────────
    body = normalize_events(body)

    # ── Feature extraction ─────────────────────────────────────────────
    try:
        feature_vector = extract_features(body)
    except ValueError as e:
        return jsonify({
            "status": "error",
            "stage": "feature_extraction",
            "message": str(e)
        }), 422
    except Exception as e:
        return jsonify({
            "status": "error",
            "stage": "feature_extraction",
            "message": f"Unexpected error: {str(e)}"
        }), 500

    # ── Prediction ─────────────────────────────────────────────────────
    try:
        result = predict_risk(feature_vector)
    except Exception as e:
        return jsonify({
            "status": "error",
            "stage": "prediction",
            "message": f"Prediction failed: {str(e)}"
        }), 500

    # ── Feature debug mapping ───────────────────────────────────────────
    feature_debug = {
        FEATURE_SCHEMA[i]["name"]: round(feature_vector[i], 4)
        for i in range(len(FEATURE_SCHEMA))
    }

    response = {
        "status": "success",
        "session_id": session_id,
        "rf_score": result["rf_score"],
        "xgb_score": result["xgb_score"],
        "risk_score": result["final_score"],
        "prediction": result["prediction"],
        "features": feature_debug,
        "latency_ms": round((time.time() - start_time) * 1000, 2)
    }

    return jsonify(response), 200


# ── Run server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)