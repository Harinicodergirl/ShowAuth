import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
      />
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
        role="presentation"
      />
      <div className="main-wrapper">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
