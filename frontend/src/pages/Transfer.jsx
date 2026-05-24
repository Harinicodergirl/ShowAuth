import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import useTracking from "../../tracking";
import { getStoredUser } from "../auth";

const payees = [
  { name: "Priya Mehta",  account: "123456789012", label: "Priya M."  },
  { name: "Arjun Patel",  account: "987654321098", label: "Arjun P."  },
  { name: "Sneha Reddy",  account: "456789012345", label: "Sneha R."  },
  { name: "Vikram Singh", account: "789012345678", label: "Vikram S." },
];

const amountPresets = ["500", "1000", "5000", "10000"];

export default function Transfer() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [transferType,  setTransferType]  = useState("bank");
  const [recipientName, setRecipientName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode,      setIfscCode]      = useState("");
  const [amount,        setAmount]        = useState("");
  const [description,   setDescription]  = useState("");
  const [modalOpen,     setModalOpen]     = useState(false);
  const [otpOpen,       setOtpOpen]       = useState(false);
  const [otp,           setOtp]           = useState("");
  const [otpSessionId,  setOtpSessionId]  = useState("");
  const [analysis,      setAnalysis]      = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  // Real transaction data from the form fields
  // This gets passed into tracking so it's included in the /predict call
  const transactionData = {
    sender_account:    "ACC1001",
    receiver_account:  accountNumber,
    amount:            parseFloat(amount) || 0,
    transaction_type:  transferType.toUpperCase(),
    merchant_category: description || "other",
  };

  const { sendEvents } = useTracking(transactionData);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function openModal() {
    if (!recipientName || !accountNumber || !amount) return;
    setModalOpen(true);
  }

  // CHANGED: now sends data to /predict and goes to /auth
  function getRiskScore(result) {
    return result?.final_score ?? result?.risk_score;
  }

  function buildAuthState(result) {
    const riskScore = getRiskScore(result);

    return {
      prediction: result?.prediction ?? "Unknown",
      final_score: riskScore ?? 0,
      risk_score: riskScore ?? 0,
      behavior_risk: result?.behavior_risk ?? 0,
      transaction_risk: result?.transaction_risk ?? 0,
      rf_score: result?.rf_score ?? 0,
      xgb_score: result?.xgb_score ?? 0,
      amount,
      recipientName,
    };
  }

  function rememberResult(result, status = "Pending") {
    const riskScore = getRiskScore(result);

    sessionStorage.setItem("last_transaction_result", JSON.stringify({
      status,
      prediction: result?.prediction ?? "Unknown",
      final_score: riskScore ?? 0,
      risk_score: riskScore ?? 0,
      amount,
      recipientName,
    }));
  }

  async function confirmTransfer() {
    setLoading(true);
    setError("");
    try {
      const result = await sendEvents({ force: true }).catch(() => null);

      if (!result || result.status !== "success") {
        throw new Error(result?.message || "Risk analysis did not return a valid result.");
      }

      if (result?.otp_required) {
        setAnalysis(result);
        setOtpSessionId(result.session_id);
        setModalOpen(false);
        setOtpOpen(true);
        rememberResult(result, "OTP required");
        return;
      }

      setModalOpen(false);
      rememberResult(result, "Analysed");
      navigate("/auth", { state: buildAuthState(result) });
    } catch (e) {
      setError(e.message || "Unable to complete real-time risk analysis.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: otpSessionId,
          otp,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.status === "failed" || data.status === "error") {
        throw new Error(data.message || "OTP verification failed.");
      }

      rememberResult(analysis, "OTP verified");
      setOtpOpen(false);
      navigate("/auth", { state: buildAuthState(analysis) });
    } catch (err) {
      setError(err.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  function selectPayee(payee) {
    setRecipientName(payee.name);
    setAccountNumber(payee.account);
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Transfer Money</h1>
        <p className="page-subtitle">
          Send funds securely — typing and clicks are analyzed for fraud detection
        </p>
      </div>

      <div className="transfer-layout">
        <div className="transfer-type-tabs">
          {["bank", "upi", "imps"].map((type) => (
            <button
              key={type}
              type="button"
              className={`transfer-tab ${transferType === type ? "active" : ""}`}
              onClick={() => setTransferType(type)}
            >
              {type === "bank" ? "Bank Transfer" : type.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="card transfer-card">
          <form id="transfer-form" onSubmit={(e) => { e.preventDefault(); openModal(); }}>
            <div className="form-group">
              <label htmlFor="recipient-name">Recipient Name</label>
              <input
                type="text"
                id="recipient-name"
                placeholder="Full name as per bank records"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="account-number">Account Number</label>
                <input
                  type="text"
                  id="account-number"
                  placeholder="Enter account number"
                  maxLength={18}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ifsc-code">IFSC Code</label>
                <input
                  type="text"
                  id="ifsc-code"
                  placeholder="e.g. HDFC0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <div className="amount-input-wrapper">
                <span className="amount-prefix">₹</span>
                <input
                  type="number"
                  id="amount"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="amount-quick-btns">
                {amountPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="amount-chip"
                    onClick={() => setAmount(preset)}
                  >
                    ₹{Number(preset).toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                rows={3}
                placeholder="Add a note for this transfer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" id="transfer-btn" className="btn-primary btn-transfer">
              Continue to Transfer
            </button>
          </form>

          <div className="recent-payees">
            <span className="card-label">Recent Payees</span>
            <div className="payee-chips">
              {payees.map((p) => (
                <button
                  key={p.account}
                  type="button"
                  className="payee-chip"
                  onClick={() => selectPayee(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card transfer-tips">
          <h4>Security Tips</h4>
          <ul>
            <li>Verify recipient details before confirming</li>
            <li>ShadowAuth monitors typing rhythm during transfers</li>
            <li>High-risk sessions may require extra verification</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${modalOpen ? "open" : ""}`} id="transfer-modal">
        <div className="modal">
          <button
            type="button"
            className="icon-btn-sm modal-close"
            onClick={() => setModalOpen(false)}
            aria-label="Close"
          >
            &times;
          </button>
          <div className="modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            </svg>
          </div>
          <h3>Confirm Transfer</h3>
          <p>Please review the details before confirming your transfer.</p>
          <div className="modal-details">
            <div className="modal-detail-row">
              <span>Recipient</span>
              <strong>{recipientName || "—"}</strong>
            </div>
            <div className="modal-detail-row">
              <span>Account</span>
              <strong>{accountNumber || "—"}</strong>
            </div>
            <div className="modal-detail-row">
              <span>IFSC</span>
              <strong>{ifscCode || "—"}</strong>
            </div>
            <div className="modal-detail-row">
              <span>Amount</span>
              <strong>
                {amount ? `₹${parseFloat(amount).toLocaleString("en-IN")}` : "—"}
              </strong>
            </div>
          </div>
          {error && (
            <p style={{ color: "var(--danger)", fontSize: "13px", margin: "8px 0" }}>{error}</p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-confirm" onClick={confirmTransfer} disabled={loading}>
              {loading ? "Analyzing…" : "Confirm Transfer"}
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${otpOpen ? "open" : ""}`} id="otp-modal">
        <div className="modal">
          <button
            type="button"
            className="icon-btn-sm modal-close"
            onClick={() => setOtpOpen(false)}
            aria-label="Close"
          >
            &times;
          </button>
          <div className="modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h3>OTP Verification</h3>
          <p>Extra verification is required before this transfer can proceed.</p>
          <div className="form-group">
            <label htmlFor="otp">6-digit OTP</label>
            <input
              type="password"
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          {error && (
            <p style={{ color: "var(--danger)", fontSize: "13px", margin: "8px 0" }}>{error}</p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setOtpOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-confirm" onClick={verifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
