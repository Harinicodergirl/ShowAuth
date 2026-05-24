"""
app.py
------
Flask API for:
- Behavioral biometrics fraud detection
- Transaction fraud detection
- MPIN authentication
- OTP verification
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

import time
import random

from feature_extraction import extract_features
from transaction_features import extract_transaction_features
from predict import predict_risk

from users import users_db


# ─────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})


# ─────────────────────────────────────────────
# TEMP OTP STORAGE (PoC only)
# ─────────────────────────────────────────────
otp_sessions = {}


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
# HELPERS
# ─────────────────────────────────────────────
def normalize_events(body):

    body.setdefault("key_events", [])
    body.setdefault("mouse_events", [])

    return body


def generate_otp():

    return str(
        random.randint(100000, 999999)
    )


def find_user(username):

    if not username:
        return None

    normalized = str(username).strip().lower()

    for key, user in users_db.items():
        if key.lower() == normalized:
            return key, user

        if str(user.get("username", "")).lower() == normalized:
            return key, user

    return None


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok"
    }), 200


# ─────────────────────────────────────────────
# LOGIN ROUTE
# ─────────────────────────────────────────────
@app.route("/login", methods=["POST"])
def login():

    body = request.get_json()

    if not body:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON"
        }), 400

    username = body.get("username")
    mpin = body.get("mpin")

    if not username or not mpin:
        return jsonify({
            "status": "error",
            "message": "Username and MPIN required"
        }), 400

    user_record = find_user(username)

    if not user_record:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    user_key, user = user_record

    if user["mpin"] != mpin:
        return jsonify({
            "status": "error",
            "message": "Invalid MPIN"
        }), 401

    return jsonify({

        "status": "success",

        "user": {

            "username": user_key,

            "name": user["name"],

            "email": user["email"],

            "phone": user["phone"],

            "balance": user["balance"]
        }

    }), 200


# ─────────────────────────────────────────────
# TRANSACTION MPIN VERIFICATION
# ─────────────────────────────────────────────
@app.route("/verify-mpin", methods=["POST"])
def verify_mpin():

    body = request.get_json()

    if not body:
        return jsonify({
            "status": "error",
            "verified": False,
            "message": "Invalid JSON"
        }), 400

    username = body.get("username")
    mpin = body.get("mpin")

    if not username or not mpin:
        return jsonify({
            "status": "error",
            "verified": False,
            "message": "Username and transaction MPIN required"
        }), 400

    user_record = find_user(username)

    if not user_record:
        return jsonify({
            "status": "error",
            "verified": False,
            "message": "User not found"
        }), 404

    _, user = user_record

    if str(user.get("transaction_mpin")) != str(mpin):
        return jsonify({
            "status": "error",
            "verified": False,
            "message": "Invalid transaction MPIN"
        }), 401

    return jsonify({
        "status": "success",
        "verified": True,
        "message": "Transaction MPIN verified"
    }), 200


# ─────────────────────────────────────────────
# MAIN PREDICT ENDPOINT
# ─────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():

    start_time = time.time()

    body = request.get_json(silent=True)

    # ─────────────────────────────────────────
    # VALIDATION
    # ─────────────────────────────────────────
    if not body:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON"
        }), 400

    if (
        "key_events" not in body or
        "mouse_events" not in body
    ):
        return jsonify({
            "status": "error",
            "message": "Missing events"
        }), 422

    # ─────────────────────────────────────────
    # REQUEST DATA
    # ─────────────────────────────────────────
    session_id = body.get(
        "session_id",
        None
    )

    username = body.get(
        "username",
        None
    )

    transaction_data = body.get(
        "transaction_data",
        {}
    )

    # ─────────────────────────────────────────
    # NORMALIZE EVENTS
    # ─────────────────────────────────────────
    body = normalize_events(body)

    # ─────────────────────────────────────────
    # FEATURE EXTRACTION
    # ─────────────────────────────────────────
    try:

        feature_vector = extract_features(
            body
        )

        txn_feature_vector = (
            extract_transaction_features(
                transaction_data
            )
        )

    except Exception as e:

        return jsonify({
            "status": "error",
            "stage": "feature_extraction",
            "message": str(e)
        }), 500

    # ─────────────────────────────────────────
    # PREDICTION
    # ─────────────────────────────────────────
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

    # ─────────────────────────────────────────
    # OTP DECISION
    # ─────────────────────────────────────────
    prediction = result["prediction"]

    otp_required = False
    otp = None

    if prediction in [
        "Suspicious",
        "Fraudulent"
    ]:

        otp_required = True

        otp = generate_otp()

        otp_sessions[session_id] = {

            "otp": otp,

            "username": username
        }

        print(
            f"[OTP] Session: {session_id} | OTP: {otp}"
        )

    # ─────────────────────────────────────────
    # FEATURE DEBUG
    # ─────────────────────────────────────────
    feature_debug = {

        FEATURE_SCHEMA[i]["name"]:
        round(feature_vector[i], 4)

        for i in range(
            len(FEATURE_SCHEMA)
        )
    }

    # ─────────────────────────────────────────
    # RESPONSE
    # ─────────────────────────────────────────
    response = {

        "status": "success",

        "session_id": session_id,

        "username": username,

        "rf_score": result["rf_score"],

        "xgb_score": result["xgb_score"],

        "behavior_risk":
            result["behavior_risk"],

        "transaction_risk":
            result["transaction_risk"],

        "risk_score":
            result["final_score"],

        "final_score":
            result["final_score"],

        "prediction":
            result["prediction"],

        "otp_required":
            otp_required,

        # REMOVE IN REAL SYSTEM
        "demo_otp":
            otp,

        "features":
            feature_debug,

        "latency_ms":
            round(
                (
                    time.time() -
                    start_time
                ) * 1000,
                2
            )
    }

    return jsonify(response), 200


# ─────────────────────────────────────────────
# OTP VERIFICATION
# ─────────────────────────────────────────────
@app.route("/verify-otp", methods=["POST"])
def verify_otp():

    body = request.get_json()

    if not body:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON"
        }), 400

    session_id = body.get(
        "session_id"
    )

    entered_otp = body.get(
        "otp"
    )

    otp_data = otp_sessions.get(
        session_id
    )

    if otp_data is None:

        return jsonify({
            "status": "error",
            "verified": False,
            "message": "OTP session expired"
        }), 400

    if entered_otp == otp_data["otp"]:

        del otp_sessions[session_id]

        return jsonify({

            "status": "success",

            "verified": True,

            "message": "OTP verified successfully"

        }), 200

    return jsonify({

        "status": "error",

        "verified": False,

        "message": "Invalid OTP"

    }), 401


# ─────────────────────────────────────────────
# RUN SERVER
# ─────────────────────────────────────────────
if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )
