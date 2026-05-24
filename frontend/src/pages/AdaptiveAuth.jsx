import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { debitStoredBalance, getStoredUser } from "../auth";

function markTransactionSuccessful(amount, recipientName) {
  const updatedUser = debitStoredBalance(amount);
  const previousResult = (() => {
    try {
      const raw = sessionStorage.getItem("last_transaction_result");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  sessionStorage.setItem("last_transaction_result", JSON.stringify({
    ...previousResult,
    status: "Successful",
    amount,
    recipientName,
    balance: updatedUser?.balance,
  }));
}

export default function AdaptiveAuth() {
  const location = useLocation();
  const state = location.state || {};

  const prediction       = state.prediction       ?? "Legitimate";
  const final_score      = state.final_score       ?? state.risk_score ?? 0;
  const behavior_risk    = state.behavior_risk     ?? 0;
  const transaction_risk = state.transaction_risk  ?? 0;
  const amount           = state.amount            ?? "0";
  const recipientName    = state.recipientName     ?? "—";

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Authentication Required</h1>
        <p className="page-subtitle">
          ShadowAuth has analyzed your session — complete verification to proceed
        </p>
      </div>

      {/* Risk Summary Card */}
      <div className="card" style={{ marginBottom: "24px", padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "center" }}>
          <RiskBadge prediction={prediction} score={final_score} />
          <ScoreItem label="Behavioral Risk"   value={behavior_risk}    />
          <ScoreItem label="Transaction Risk"  value={transaction_risk} />
          <ScoreItem label="Final Score"       value={final_score}      />
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Transfer to</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{recipientName}</p>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>
              ₹{parseFloat(amount).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Show different auth based on prediction */}
      {prediction === "Fraudulent" && <BlockScreen />}
      {prediction === "Suspicious" && <SuspiciousAuth amount={amount} recipientName={recipientName} />}
      {prediction === "Legitimate" && <LegitimateAuth amount={amount} recipientName={recipientName} />}
    </Layout>
  );
}

/* ─── 1. Legitimate → MPIN only ─────────────── */
function LegitimateAuth({ amount, recipientName }) {
  const navigate = useNavigate();
  const [mpin, setMpin]       = useState(["", "", "", "", "", ""]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const user = getStoredUser();

  function handlePin(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...mpin];
    next[i] = val;
    setMpin(next);
    if (val && i < 5) document.getElementById(`mpin-${i + 1}`)?.focus();
  }

  async function verify() {
    const pin = mpin.join("");

    if (mpin.join("").length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    if (!user?.username) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/verify-mpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          mpin: pin,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.verified) {
        throw new Error(data.message || "Invalid transaction MPIN.");
      }

      markTransactionSuccessful(amount, recipientName);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(err.message || "Unable to verify transaction MPIN.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return <SuccessCard message="Transaction authorised successfully!" />;

  return (
    <div className="card" style={{ marginBottom: "24px", overflow: "hidden" }}>
      <div style={authHeaderStyle("#059669")}>
        <span style={{ fontSize: "28px" }}>🔐</span>
        <div>
          <h3 style={{ margin: 0, color: "var(--primary)" }}>Enter MPIN</h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
            Low risk detected — MPIN is sufficient
          </p>
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>
        <p style={{ marginBottom: "24px", color: "var(--text-muted)", fontSize: "14px" }}>
          Enter your 6-digit MPIN to authorise transfer of{" "}
          <strong>₹{parseFloat(amount).toLocaleString("en-IN")}</strong> to{" "}
          <strong>{recipientName}</strong>.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
          {mpin.map((d, i) => (
            <input
              key={i}
              id={`mpin-${i}`}
              type="password"
              maxLength={1}
              value={d}
              onChange={(e) => handlePin(i, e.target.value)}
              style={pinBoxStyle(!!d)}
            />
          ))}
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <button className="btn-primary" style={{ width: "100%", marginTop: "8px" }} onClick={verify} disabled={loading}>
          {loading ? "Verifying..." : "Authorise Transfer"}
        </button>
      </div>
    </div>
  );
}

/* ─── 2. Suspicious → OTP + Security Question ── */
const SECURITY_Q = "What was the name of your first pet?";
const SECURITY_A = "tommy";

function SuspiciousAuth({ amount, recipientName }) {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(1);
  const [otp,     setOtp]     = useState(["", "", "", "", "", ""]);
  const [answer,  setAnswer]  = useState("");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  function handleOtp(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  }

  function verifyOtp() {
    if (otp.join("").length < 6) {
      setError("Enter all 6 OTP digits.");
      return;
    }
    setError("");
    setStep(2);
  }

  function verifyAnswer() {
    if (answer.trim().toLowerCase() !== SECURITY_A) {
      setError("Incorrect answer. Please try again.");
      return;
    }
    markTransactionSuccessful(amount, recipientName);
    setSuccess(true);
    setTimeout(() => navigate("/dashboard"), 2000);
  }

  if (success) return <SuccessCard message="Verification complete — transaction authorised!" />;

  return (
    <div className="card" style={{ marginBottom: "24px", overflow: "hidden" }}>
      <div style={authHeaderStyle("#d97706")}>
        <span style={{ fontSize: "28px" }}>⚠️</span>
        <div>
          <h3 style={{ margin: 0, color: "var(--primary)" }}>Enhanced Verification</h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
            Elevated risk — OTP and security question required
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <StepDot n={1} active={step >= 1} done={step > 1} />
          <div style={{ width: "24px", height: "2px", background: step > 1 ? "#059669" : "#e2e8f0" }} />
          <StepDot n={2} active={step >= 2} done={false} />
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>
        {step === 1 && (
          <>
            <p style={{ marginBottom: "8px", fontWeight: 600 }}>Step 1: OTP Verification</p>
            <p style={{ marginBottom: "24px", color: "var(--text-muted)", fontSize: "14px" }}>
              A 6-digit OTP has been sent to your registered number ending <strong>**89</strong>.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "12px" }}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtp(i, e.target.value)}
                  style={pinBoxStyle(!!d)}
                />
              ))}
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Didn't receive it?{" "}
              <button type="button" className="link-btn" style={{ color: "var(--accent)" }}>
                Resend OTP
              </button>
            </p>
            {error && <p style={errorStyle}>{error}</p>}
            <button className="btn-primary" style={{ width: "100%" }} onClick={verifyOtp}>
              Verify OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ marginBottom: "8px", fontWeight: 600 }}>Step 2: Security Question</p>
            <p style={{ marginBottom: "16px", color: "var(--text-muted)", fontSize: "14px" }}>
              {SECURITY_Q}
            </p>
            <input
              type="text"
              placeholder="Your answer…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{ width: "100%", padding: "12px", border: "1px solid var(--card-border)", borderRadius: "8px", fontSize: "14px", marginBottom: "16px", outline: "none" }}
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button className="btn-primary" style={{ width: "100%" }} onClick={verifyAnswer}>
              Submit Answer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── 3. Fraudulent → Block ──────────────────── */
function BlockScreen() {
  const navigate = useNavigate();

  return (
    <div className="card" style={{ marginBottom: "24px", overflow: "hidden", borderTop: "4px solid var(--danger)" }}>
      <div style={{ padding: "40px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚫</div>
        <h2 style={{ color: "var(--danger)", marginBottom: "8px" }}>Transaction Blocked</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto 28px" }}>
          Our AI has detected highly suspicious behaviour on this session.
          This transaction has been blocked and your session is frozen.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "380px", margin: "0 auto 28px" }}>
          <NoticeRow icon="📧" text="Alert sent to your registered email address" />
          <NoticeRow icon="📱" text="SMS notification dispatched to **89" />
          <NoticeRow icon="🔒" text="Session frozen — please re-login to continue" />
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
          If this was you, contact our fraud helpline:{" "}
          <strong style={{ color: "var(--primary)" }}>1800-XXX-XXXX</strong>
        </p>

        <button className="btn-primary" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    </div>
  );
}

/* ─── Shared small components ────────────────── */
function RiskBadge({ prediction, score }) {
  const map = {
    Legitimate: { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", label: "✓ Legitimate" },
    Suspicious: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "⚠ Suspicious"  },
    Fraudulent: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "✕ Fraudulent"  },
  };
  const s = map[prediction] || map.Legitimate;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "10px", padding: "12px 20px", textAlign: "center" }}>
      <p style={{ margin: 0, fontWeight: 700, color: s.color, fontSize: "16px" }}>{s.label}</p>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
        Score: {(score * 100).toFixed(0)}%
      </p>
    </div>
  );
}

function ScoreItem({ label, value }) {
  const pct = (value * 100).toFixed(0);
  const color = value >= 0.6 ? "#dc2626" : value >= 0.3 ? "#d97706" : "#059669";
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--text-muted)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color }}>{pct}%</p>
    </div>
  );
}

function StepDot({ n, active, done }) {
  const bg = done ? "#059669" : active ? "var(--accent)" : "#e2e8f0";
  const color = active || done ? "#fff" : "var(--text-muted)";
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>
      {done ? "✓" : n}
    </div>
  );
}

function NoticeRow({ icon, text }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", fontSize: "13px" }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function SuccessCard({ message }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 20px" }}>
        ✓
      </div>
      <h3 style={{ color: "#059669", marginBottom: "8px" }}>Verified!</h3>
      <p style={{ color: "var(--text-muted)" }}>{message}</p>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>Redirecting to dashboard…</p>
    </div>
  );
}

/* ─── Style helpers ──────────────────────────── */
const errorStyle = {
  color: "var(--danger)", fontSize: "13px", margin: "8px 0", textAlign: "center"
};

const authHeaderStyle = (accentColor) => ({
  display: "flex", gap: "16px", alignItems: "center",
  padding: "20px 24px",
  background: "#f8fafc",
  borderBottom: "1px solid var(--card-border)",
  borderTop: `4px solid ${accentColor}`,
});

const pinBoxStyle = (filled) => ({
  width: "46px", height: "54px",
  border: `2px solid ${filled ? "var(--accent)" : "var(--card-border)"}`,
  borderRadius: "8px", textAlign: "center",
  fontSize: "20px", fontWeight: 700,
  background: "#fff", outline: "none",
  transition: "border-color 0.2s",
});
