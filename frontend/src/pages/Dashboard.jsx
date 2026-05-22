import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const transactions = [
  { id: "netflix", name: "Netflix", date: "May 20, 2026 • Entertainment", amount: "-₹499", type: "debit", letter: "N" },
  { id: "swiggy", name: "Swiggy", date: "May 19, 2026 • Food & Dining", amount: "-₹340", type: "debit", letter: "S" },
  { id: "amazon", name: "Amazon", date: "May 18, 2026 • Shopping", amount: "-₹2,300", type: "debit", letter: "A" },
  { id: "salary", name: "Salary Credit", date: "May 1, 2026 • Income", amount: "+₹85,000", type: "credit", letter: "S" },
  { id: "uber", name: "Uber", date: "Apr 28, 2026 • Transport", amount: "-₹245", type: "debit", letter: "U" },
  { id: "zomato", name: "Zomato", date: "Apr 25, 2026 • Food & Dining", amount: "-₹520", type: "debit", letter: "Z" },
  { id: "flipkart", name: "Flipkart", date: "Apr 22, 2026 • Shopping", amount: "-₹1,850", type: "debit", letter: "F" },
];

const quickActions = [
  { id: "transfer", label: "Transfer", path: "/transfer" },
  { id: "pay", label: "Pay Bills" },
  { id: "recharge", label: "Recharge" },
  { id: "invest", label: "Invest" },
  { id: "upi", label: "UPI Pay" },
  { id: "loan", label: "Loans" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [txTab, setTxTab] = useState("all");
  const balance = "₹2,45,680.50";

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good morning, Rahul</h1>
          <p className="page-subtitle">Here&apos;s an overview of your accounts</p>
        </div>
        <button type="button" className="risk-badge" id="risk-badge">
          <span className="risk-dot safe" />
          <span>Risk: Low</span>
        </button>
      </div>

      <div className="summary-strip">
        <button type="button" className="summary-item">
          <span className="summary-label">Savings</span>
          <span className="summary-value">₹2,45,680</span>
        </button>
        <button type="button" className="summary-item">
          <span className="summary-label">Current</span>
          <span className="summary-value">₹32,150</span>
        </button>
        <button type="button" className="summary-item">
          <span className="summary-label">Fixed Deposit</span>
          <span className="summary-value">₹1,00,000</span>
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="col-span-4">
          <div className="balance-card card">
            <div className="card-header">
              <span className="card-label">Total Balance</span>
              <button
                type="button"
                className="icon-btn-sm"
                id="toggle-balance"
                aria-label="Show/hide balance"
                onClick={() => setBalanceHidden(!balanceHidden)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <h2 className="balance-amount" id="balance-amount">
              {balanceHidden ? "₹ ••••••" : balance}
            </h2>
            <p className="balance-sub">Savings Account • ****4821</p>
            <div className="balance-actions">
              <button type="button" className="btn-outline-light">View Statement</button>
              <button type="button" className="btn-outline-light">Add Money</button>
            </div>
          </div>
        </div>

        <div className="col-span-8">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quick Actions</span>
            </div>
            <div className="quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="quick-action-btn"
                  onClick={() => action.path ? navigate(action.path) : null}
                >
                  <span className="action-icon">{action.label.charAt(0)}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-7" id="transactions">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Transactions</span>
              <div className="filter-bar" style={{ margin: 0 }}>
                <select className="filter-select" id="tx-filter-period">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
                <select className="filter-select" id="tx-filter-type">
                  <option>All types</option>
                  <option>Debits only</option>
                  <option>Credits only</option>
                </select>
              </div>
            </div>
            <div className="tx-tabs">
              {["all", "debit", "credit"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tx-tab ${txTab === tab ? "active" : ""}`}
                  onClick={() => setTxTab(tab)}
                >
                  {tab === "all" ? "All" : tab === "debit" ? "Debits" : "Credits"}
                </button>
              ))}
            </div>
            <div className="transactions-list">
              {transactions
                .filter((t) => txTab === "all" || t.type === txTab)
                .map((tx) => (
                  <button key={tx.id} type="button" className="transaction-item">
                    <div className={`tx-icon ${tx.type}`}>{tx.letter}</div>
                    <div className="tx-details">
                      <div className="tx-name">{tx.name}</div>
                      <div className="tx-date">{tx.date}</div>
                    </div>
                    <div className={`tx-amount ${tx.type}`}>{tx.amount}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="col-span-5">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Spending Overview</span>
              <select className="filter-select" id="spending-period">
                <option>This month</option>
                <option>Last month</option>
                <option>Last 3 months</option>
              </select>
            </div>
            <div className="spending-chart">
              {[
                { label: "Week 1", value: "12,400", h: "65%" },
                { label: "Week 2", value: "18,200", h: "85%" },
                { label: "Week 3", value: "9,800", h: "45%" },
                { label: "Week 4", value: "14,600", h: "72%" },
              ].map((w) => (
                <button
                  key={w.label}
                  type="button"
                  className="chart-bar"
                  data-label={w.label}
                  data-value={w.value}
                  style={{ height: "100%" }}
                >
                  <div className="bar-fill" style={{ height: w.h }} />
                </button>
              ))}
            </div>
            <div className="chart-labels">
              <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
            </div>
            <div className="spending-legend">
              {["Shopping", "Food", "Bills", "Other"].map((cat, i) => (
                <button key={cat} type="button" className="legend-item">
                  <span
                    className="legend-dot"
                    style={{
                      background: ["#0a2540", "#2563eb", "#64748b", "#059669"][i],
                    }}
                  />
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card transfer-promo" id="transfer-promo">
            <h3>Transfer Money</h3>
            <p>Send money instantly to any bank account with zero fees on UPI transfers.</p>
            <button
              type="button"
              className="btn-accent"
              id="transfer-promo-btn"
              onClick={() => navigate("/transfer")}
            >
              Send Money →
            </button>
          </div>
        </div>

        <div className="col-span-8" id="cards">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Your Cards</span>
              <button type="button" className="btn-accent btn-sm">+ Add Card</button>
            </div>
            <div className="cards-grid">
              <button type="button" className="bank-card debit-card">
                <p className="card-type">Debit Card</p>
                <p className="card-number">**** 4821</p>
                <p className="card-meta">Expires 09/28</p>
              </button>
              <button type="button" className="bank-card credit-card">
                <p className="card-type">Credit Card</p>
                <p className="card-number">**** 9103</p>
                <p className="card-meta">Limit ₹1,50,000</p>
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12" id="settings">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Security & Settings</span>
            </div>
            <div className="settings-grid">
              <button type="button" className="settings-item">
                <strong>Two-Factor Authentication</strong>
                <span>Enabled via ShadowAuth</span>
              </button>
              <button type="button" className="settings-item">
                <strong>Transaction Alerts</strong>
                <span>SMS + Email notifications</span>
              </button>
              <button type="button" className="settings-item">
                <strong>Daily Transfer Limit</strong>
                <span>₹1,00,000 remaining today</span>
              </button>
              <button type="button" className="settings-item">
                <strong>Trusted Devices</strong>
                <span>2 devices registered</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
