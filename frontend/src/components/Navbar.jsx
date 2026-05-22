import { useState } from "react";
import { Link } from "react-router-dom";

const notifications = [
  { id: 1, title: "Transfer completed", desc: "₹2,300 sent to Amazon Pay — 2h ago", unread: true },
  { id: 2, title: "Security alert", desc: "New login from Chrome — 5h ago", unread: true },
  { id: 3, title: "Bill reminder", desc: "Electricity bill due May 25 — 1d ago", unread: false },
];

export default function Navbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header className="top-navbar">
        <button
          type="button"
          className="sidebar-toggle"
          id="sidebar-toggle"
          aria-label="Toggle menu"
          onClick={onMenuClick}
        >
          <span className="hamburger" />
        </button>
        <Link to="/dashboard" className="navbar-brand">
          <img
            src={new URL("../../assets/logo.png", import.meta.url).href}
            alt="ShadowAuth"
            className="navbar-logo"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <span className="navbar-logo-fallback">ShadowAuth</span>
        </Link>
        <div className="navbar-search">
          <input
            type="search"
            placeholder="Search transactions, payees..."
            className="search-input"
            id="global-search"
          />
        </div>
        <div className="navbar-actions">
          <button
            type="button"
            className="icon-btn"
            id="notifications-btn"
            aria-label="Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="badge">3</span>
          </button>
          <div className="profile-dropdown" id="profile-dropdown">
            <button
              type="button"
              className="profile-btn"
              id="profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <span className="profile-avatar">RS</span>
              <span className="profile-name">Rahul Sharma</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={`dropdown-menu ${profileOpen ? "open" : ""}`} id="profile-menu">
              <button type="button" className="dropdown-item">My Profile</button>
              <button type="button" className="dropdown-item">Settings</button>
              <Link to="/login" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                Logout
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className={`notifications-panel ${notifOpen ? "open" : ""}`} id="notifications-panel">
        <div className="panel-header">
          <h3>Notifications</h3>
          <button type="button" className="icon-btn-sm" onClick={() => setNotifOpen(false)}>
            &times;
          </button>
        </div>
        <div className="notification-list">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`notification-item ${n.unread ? "unread" : ""}`}
            >
              <strong>{n.title}</strong>
              <span>{n.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
