import numpy as np
from datetime import datetime


def _stable_code(value, modulo=1000):
    text = str(value or "unknown")
    return sum((index + 1) * ord(char) for index, char in enumerate(text)) % modulo


def _safe_float(value, fallback=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def extract_transaction_features(txn):

    txn = txn or {}

    amount = _safe_float(txn.get("amount"), 0.0)

    current_hour = datetime.now().hour
    current_day = datetime.now().day
    current_month = datetime.now().month
    current_day_of_week = datetime.now().weekday()

    is_night = 1 if current_hour <= 5 else 0
    is_weekend = 1 if current_day_of_week >= 5 else 0

    amount_log = np.log1p(amount)

    time_since_last_transaction = _safe_float(
        txn.get("time_since_last_transaction"),
        3600.0
    )
    transaction_per_day = int(_safe_float(txn.get("transaction_per_day"), 1))
    transaction_gap = time_since_last_transaction / 3600.0

    velocity_score = _safe_float(
        txn.get("velocity_score"),
        min(amount / 10000.0, 10.0)
    )
    geo_anomaly_score = _safe_float(txn.get("geo_anomaly_score"), 0.2)
    spending_deviation_score = _safe_float(
        txn.get("spending_deviation_score"),
        min(abs(amount - 10000.0) / 10000.0, 10.0)
    )
    sender_avg_amount = _safe_float(txn.get("sender_avg_amount"), 10000.0)
    sender_std_amount = _safe_float(txn.get("sender_std_amount"), 2500.0)
    amount_to_avg_ratio = amount / max(sender_avg_amount, 1.0)
    amount_per_velocity = amount / max(velocity_score, 1.0)
    deviation_squared = spending_deviation_score ** 2

    sender_account = txn.get("sender_account", "ACC1001")
    receiver_account = txn.get("receiver_account", "ACC2002")
    is_self_transfer = 1 if sender_account == receiver_account else 0

    # Must match transaction_model.joblib feature_names_in_ order.
    feature_vector = [

        _stable_code(txn.get("transaction_id"), 100000),
        _stable_code(sender_account, 10000),
        _stable_code(receiver_account, 10000),

        amount,

        _stable_code(txn.get("transaction_type"), 20),
        _stable_code(txn.get("merchant_category"), 50),
        _stable_code(txn.get("location"), 100),
        _stable_code(txn.get("device_used"), 1000),

        time_since_last_transaction,
        spending_deviation_score,
        velocity_score,
        geo_anomaly_score,

        _stable_code(txn.get("payment_channel"), 20),
        _stable_code(txn.get("ip_address"), 1000),
        _stable_code(txn.get("device_hash"), 10000),

        current_hour,
        current_day,
        current_day_of_week,
        current_month,

        amount_per_velocity,
        amount_log,
        amount_to_avg_ratio,
        transaction_per_day,
        transaction_gap,

        is_night,
        is_weekend,
        is_self_transfer,

        int(_safe_float(txn.get("sender_degree"), 1)),
        int(_safe_float(txn.get("receiver_degree"), 1)),
        int(_safe_float(txn.get("sender_total_transaction"), transaction_per_day)),
        int(_safe_float(txn.get("receiver_total_transaction"), 1)),

        sender_avg_amount,
        sender_std_amount,
        _safe_float(txn.get("sender_fraud_transaction"), 0.0),
        _safe_float(txn.get("receiver_fraud_transaction"), 0.0),
        _safe_float(txn.get("sender_fraud_percentage (%)"), 0.0),
        _safe_float(txn.get("receiver_fraud_percentage (%)"), 0.0),
        deviation_squared
    ]

    return feature_vector
