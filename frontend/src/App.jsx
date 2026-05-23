import { Routes, Route, Navigate } from "react-router-dom";
import useTracking from "../tracking";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import AdaptiveAuth from "./pages/AdaptiveAuth";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  useTracking();

  return (
    <Routes>
      <Route path="/"          element={<Navigate to="/login" replace />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transfer"  element={<Transfer />} />
      <Route path="/auth"      element={<AdaptiveAuth />} />
      <Route path="/admin"     element={<AdminDashboard />} />
      <Route path="*"          element={<Navigate to="/login" replace />} />
    </Routes>
  );
}