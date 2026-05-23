import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import useTracking from "../../tracking";

const payees = [
  { name: "Priya Mehta",  account: "123456789012", label: "Priya M."  },
  { name: "Arjun Patel",  account: "987654321098", label: "Arjun P."  },
  { name: "Sneha Reddy",  account: "456789012345", label: "Sneha R."  },
  { name: "Vikram Singh", account: "789012345678", label: "Vikram S." },
];

const amountPresets = ["500", "1000", "5000", "10000"];

export default function Transfer() {
  const navigate = useNavigate();

  const [transferType,  setTransferType]  = useState("bank");
  const [recipientName, setRecipientName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode,      setIfscCode]      = useState("");
  const [amount,        setAmount]        = useState("");
  const [description,   setDescription]  = useState("");
  const [modalOpen,     setModalOpen]     = useState(false);
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

  function openModal() {
    if (!recipientName || !accountNumber || !amount) return;
    setModalOpen(true);
  }

  // CHANGED: now sends data to /predict and goes to /auth
  async function confirmTransfer() {
    setLoading(true);
    setError("");
    try {
      const result = await sendEvents().catch(() => null);
      setModalOpen(false);
      navigate("/auth", {
        state: {
          prediction: result?.prediction ?? "Suspicious",
          final_score:       result?.final_score       ?? 0.45,
          behavior_risk:     result?.behavior_risk     ?? 0.4,
          transaction_risk:  result?.transaction_risk  ?? 0.5,
          rf_score:          result?.rf_score          ?? 0.4,
          xgb_score:         result?.xgb_score         ?? 0.5,
          amount,
          recipientName,
        }
      });
    } catch (e) {
      // Backend is offline — still navigate with demo data so we can test UI
      setModalOpen(false);
      navigate("/auth", {
        state: {
          prediction: "Suspicious", final_score: 0.45,
          behavior_risk: 0.4, transaction_risk: 0.5,
          rf_score: 0.4, xgb_score: 0.5,
          amount, recipientName,
        }
      });
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
    </Layout>
  );
}