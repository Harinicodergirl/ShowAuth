import { Routes, Route, Navigate } from "react-router-dom";
import useTracking from "../tracking";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";

export default function App() {
  useTracking();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transfer" element={<Transfer />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
