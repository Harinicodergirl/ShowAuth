import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    sessionStorage.setItem("shadowauth_user", username.trim());
    navigate("/dashboard");
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <h2>Secure Banking</h2>
        <p>AI behavioral authentication protects every session in real time.</p>
        <ul className="login-features">
          <li>Mouse & keyboard biometrics</li>
          <li>Fraud risk scoring</li>
          <li>Adaptive authentication</li>
        </ul>
      </div>

      <div className="login-card">
        <div className="login-header">
          <img
            src={new URL("../../assets/logo.png", import.meta.url).href}
            alt="ShadowAuth"
            className="login-logo"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <h1 className="login-title">ShadowAuth</h1>
          <p className="login-subtitle">AI-Powered Behavioral Banking</p>
        </div>

        <form className="login-form" id="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="checkbox-label">
              <input type="checkbox" id="remember-me" />
              <span>Remember me</span>
            </label>
            <button type="button" className="forgot-password link-btn">
              Forgot password?
            </button>
          </div>

          <button type="submit" id="login-btn" className="btn-primary">
            Sign In
          </button>
        </form>

        <p className="login-hint">
          Type in the fields above — behavioral patterns are analyzed during login.
        </p>

        <div className="login-footer">
          <span className="shield-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Protected by ShadowAuth Behavioral AI
          </span>
        </div>
      </div>
    </div>
  );
}
