import { useState } from "react";
import Layout from "../components/Layout";

const MOCK_SESSIONS = [
  { id: "S001", name: "Ananya Sharma",  score: 0.12, prediction: "Legitimate", time: "09:12 AM", device: "Mobile", amount: 500   },
  { id: "S002", name: "Rohan Mehta",    score: 0.45, prediction: "Suspicious",  time: "09:45 AM", device: "Web",    amount: 12000  },
  { id: "S003", name: "Priya Nair",     score: 0.82, prediction: "Fraudulent",  time: "10:01 AM", device: "Web",    amount: 85000  },
  { id: "S004", name: "Karthik Raj",    score: 0.08, prediction: "Legitimate", time: "10:15 AM", device: "Mobile", amount: 1000   },
  { id: "S005", name: "Divya Menon",    score: 0.38, prediction: "Suspicious",  time: "10:30 AM", device: "Mobile", amount: 7500   },
  { id: "S006", name: "Suresh Kumar",   score: 0.91, prediction: "Fraudulent",  time: "10:48 AM", device: "Web",    amount: 120000 },
  { id: "S007", name: "Meera Pillai",   score: 0.21, prediction: "Legitimate", time: "11:02 AM", device: "Mobile", amount: 2000   },
  { id: "S008", name: "Vijay Srinivas", score: 0.55, prediction: "Suspicious",  time: "11:20 AM", device: "Web",    amount: 30000  },
  { id: "S009", name: "Lakshmi Devi",   score: 0.05, prediction: "Legitimate", time: "11:35 AM", device: "Mobile", amount: 750    },
  { id: "S010", name: "Arun Balaji",    score: 0.78, prediction: "Fraudulent",  time: "11:52 AM", device: "Web",    amount: 95000  },
];

const TAG = {
  Legitimate: { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  Suspicious: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Fraudulent: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const scoreColor = (s) => s >= 0.6 ? "#dc2626" : s >= 0.3 ? "#d97706" : "#059669";

export default function AdminDashboard() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const counts = {
    Legitimate: MOCK_SESSIONS.filter(s => s.prediction === "Legitimate").length,
    Suspicious:  MOCK_SESSIONS.filter(s => s.prediction === "Suspicious").length,
    Fraudulent:  MOCK_SESSIONS.filter(s => s.prediction === "Fraudulent").length,
  };

  const filtered = MOCK_SESSIONS.filter(s =>
    (filter === "All" || s.prediction === filter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search))
  );

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Fraud analytics — real-time session monitoring</p>
        </div>
        <div className="risk-badge" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <span className="risk-dot" style={{ background: "#dc2626" }} />
          <span style={{ color: "#dc2626" }}>
            {counts.Fraudulent} Fraud Alert{counts.Fraudulent !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="summary-strip" style={{ marginBottom: "24px" }}>
        <StatCard label="Total Sessions" value={MOCK_SESSIONS.length} color="var(--primary)" />
        <StatCard label="Legitimate"     value={counts.Legitimate}   color="#059669"         />
        <StatCard label="Suspicious"     value={counts.Suspicious}   color="#d97706"         />
        <StatCard label="Fraudulent"     value={counts.Fraudulent}   color="#dc2626"         />
      </div>

      <div className="dashboard-grid">

        {/* Bar Chart */}
        <div className="col-span-5">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Risk Distribution</span>
            </div>
            <div style={{ padding: "16px 24px 24px" }}>
              {MOCK_SESSIONS.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ width: "70px", fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>
                    {s.name.split(" ")[0]}
                  </span>
                  <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "4px",
                      width: `${s.score * 100}%`,
                      background: scoreColor(s.score),
                    }} />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: scoreColor(s.score), width: "36px", textAlign: "right" }}>
                    {(s.score * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="col-span-3">
          <div className="card" style={{ height: "100%" }}>
            <div className="card-header">
              <span className="card-title">Breakdown</span>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              <DonutChart counts={counts} total={MOCK_SESSIONS.length} />
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                <LegendRow color="#059669" label="Legitimate" count={counts.Legitimate} total={MOCK_SESSIONS.length} />
                <LegendRow color="#d97706" label="Suspicious"  count={counts.Suspicious}  total={MOCK_SESSIONS.length} />
                <LegendRow color="#dc2626" label="Fraudulent"  count={counts.Fraudulent}  total={MOCK_SESSIONS.length} />
              </div>
            </div>
          </div>
        </div>

        {/* Session Table */}
        <div className="col-span-12">
          <div className="card">
            <div className="card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
              <span className="card-title">Session Log</span>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginLeft: "auto" }}>
                <input
                  type="search"
                  placeholder="Search name or ID…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                  style={{ width: "200px" }}
                />
                <div style={{ display: "flex", gap: "6px" }}>
                  {["All", "Legitimate", "Suspicious", "Fraudulent"].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      style={{
                        padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
                        cursor: "pointer", fontFamily: "inherit",
                        border: filter === f ? "1px solid var(--accent)" : "1px solid var(--card-border)",
                        background: filter === f ? "var(--accent)" : "#fff",
                        color: filter === f ? "#fff" : "var(--text-muted)",
                      }}
                    >{f}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Session ID", "User", "Device", "Time", "Amount", "Risk Score", "Prediction"].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const t = TAG[s.prediction];
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        <td style={tdStyle}>
                          <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>
                            {s.id}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{s.name}</td>
                        <td style={tdStyle}>{s.device}</td>
                        <td style={tdStyle}>{s.time}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>₹{s.amount.toLocaleString("en-IN")}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "52px", height: "5px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${s.score * 100}%`, background: scoreColor(s.score), borderRadius: "3px" }} />
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: scoreColor(s.score) }}>
                              {(s.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "4px 10px", borderRadius: "20px",
                            fontSize: "12px", fontWeight: 600,
                            background: t.bg, color: t.color, border: `1px solid ${t.border}`,
                          }}>{s.prediction}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

/* ── Sub-components ─────────────────────────── */
function StatCard({ label, value, color }) {
  return (
    <button type="button" className="summary-item" style={{ borderTop: `3px solid ${color}`, cursor: "default" }}>
      <span className="summary-value" style={{ color }}>{value}</span>
      <span className="summary-label">{label}</span>
    </button>
  );
}

function LegendRow({ color, label, count, total }) {
  const pct = ((count / total) * 100).toFixed(0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: "13px" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 700, color }}>{count}</span>
      <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "36px", textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function DonutChart({ counts, total }) {
  const R = 50, cx = 64, cy = 64;
  const circ = 2 * Math.PI * R;
  const segments = [
    { value: counts.Legitimate, color: "#059669" },
    { value: counts.Suspicious, color: "#d97706" },
    { value: counts.Fraudulent, color: "#dc2626" },
  ];
  let offset = 0;
  return (
    <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={R}
            fill="none" stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

const thStyle = {
  textAlign: "left", padding: "10px 16px",
  fontSize: "11px", color: "var(--text-muted)",
  borderBottom: "1px solid var(--card-border)",
  textTransform: "uppercase", letterSpacing: "0.5px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 16px", fontSize: "13px",
  color: "var(--text)", whiteSpace: "nowrap",
};