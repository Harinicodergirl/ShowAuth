import numpy as np
from datetime import datetime


def extract_transaction_features(txn):

    amount = float(txn.get("amount", 0))

    current_hour = datetime.now().hour
    current_day = datetime.now().day
    current_month = datetime.now().month
    current_day_of_week = datetime.now().weekday()

    is_night = 1 if current_hour <= 5 else 0
    is_weekend = 1 if current_day_of_week >= 5 else 0

    amount_log = np.log1p(amount)

    velocity_score = amount / 10000
    geo_anomaly_score = 0.2
    spending_deviation_score = 0.4

    feature_vector = [

        amount,

        current_hour,
        current_day,
        current_day_of_week,
        current_month,

        amount_log,

        velocity_score,
        geo_anomaly_score,
        spending_deviation_score,

        is_night,
        is_weekend
    ]

    return feature_vector