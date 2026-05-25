# ShowAuth / ShadowAuth

AI-powered adaptive banking authentication system built for CBI Hackathon 2026.

ShowAuth combines behavioral biometrics and transaction fraud detection to identify risky banking sessions in real time. It tracks typing rhythm, mouse movement, transaction context, and ML model scores to classify activity as legitimate, suspicious, or fraudulent. High-risk transactions trigger adaptive OTP verification.

## Features

- MPIN-based user login
- Real-time keyboard and mouse behavior tracking
- Behavioral biometric feature extraction
- Transaction fraud feature extraction
- Random Forest and XGBoost risk scoring
- Combined behavior + transaction fraud score
- Adaptive OTP challenge for suspicious/fraudulent sessions
- Banking dashboard and money transfer flow
- Admin dashboard route for monitoring/demo

## Tech Stack

### Frontend
- React 18
- React Router
- Parcel
- CSS

### Backend
- Python
- Flask
- Flask-CORS
- NumPy
- Scikit-learn
- XGBoost
- Joblib

### Machine Learning
- Random Forest model
- XGBoost model
- Transaction fraud model
- Scaler for behavioral features

## Project Structure

```text
ShowAuth/
├── backend/
│   ├── app.py
│   ├── feature_extraction.py
│   ├── transaction_features.py
│   ├── predict.py
│   └── users.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.jsx
│   ├── tracking.js
│   └── package.json
├── models/
│   ├── random_forest.joblib
│   ├── xgboost.joblib
│   ├── transaction_model.joblib
│   └── scaler.joblib
└── Notebook/
    ├── Fraud_detection.ipynb
    └── Training_pipeline.ipynb
```

## How It Works

1. User logs in with MPIN.
2. Frontend captures keyboard and mouse events during banking activity.
3. During transfer, transaction details are combined with behavioral telemetry.
4. Backend extracts behavioral and transaction features.
5. ML models generate behavior and transaction risk scores.
6. Final risk score classifies the transaction:
   - `Legitimate`
   - `Suspicious`
   - `Fraudulent`
7. Suspicious or fraudulent transactions require OTP verification.

## Demo Login Credentials

| Name | Username | Login MPIN | Transaction MPIN |
|---|---|---|---|
| Harini | harini123 | 1234 | 123456 |
| Swetha | swetha123 | 5678 | 567890 |
| Aditi | aditi123 | 9012 | 901234 |
| Lakshana | lakshana123 | 3456 | 345678 |

## API Endpoints

### Health Check

```http
GET /health
```

### Login

```http
POST /login
```

### Verify Transaction MPIN

```http
POST /verify-mpin
```

### Predict Risk

```http
POST /predict
```

Accepts keyboard events, mouse events, session ID, username, and transaction data. Returns ML scores, final risk classification, OTP requirement, and extracted feature values.

### Verify OTP

```http
POST /verify-otp
```

Used when the transaction is classified as suspicious or fraudulent.

## ML Risk Scoring

The final risk score is calculated using both behavioral and transaction models:

```text
final_score = 0.6 * behavior_risk + 0.4 * transaction_risk
```

Classification thresholds:

```text
final_score >= 0.6  -> Fraudulent
final_score >= 0.3  -> Suspicious
final_score < 0.3   -> Legitimate
```

## Notes

- This is a proof-of-concept project for hackathon/demo use.
- OTP is generated and returned/logged for demo purposes.
- User data is stored in an in-memory Python dictionary.
- For production, replace demo OTP handling, hardcoded users, and local model loading with secure services.

## Team / Event

Built for MNIT CBI Hackathon 2026.
```
