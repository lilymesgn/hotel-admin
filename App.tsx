import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Define dynamic session lease length (15 minutes in milliseconds)
  const SESSION_LEASE_MS = 15 * 60 * 1000;

  useEffect(() => {
    // Initial verification of stored session cookies/state
    const storedEmail = sessionStorage.getItem("ras_admin_session_email");
    const mfaAuthenticated = sessionStorage.getItem("ras_mfa_authenticated_flag") === "true";
    const expiry = sessionStorage.getItem("ras_session_expiry");

    if (storedEmail && mfaAuthenticated && expiry) {
      const now = Date.now();
      if (now < Number(expiry)) {
        setIsAuthenticated(true);
        setAdminEmail(storedEmail);
        sessionStorage.setItem("ras_session_expiry", String(now + SESSION_LEASE_MS));
      } else {
        handleAutoLogout("Session lease expired. Please re-authenticate.");
      }
    } else {
      clearSessionContext();
    }
    setCheckingAuth(false);
  }, []);

  // Continuous inactivity monitoring watchdog
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;

    const resetExpiryTimer = () => {
      clearTimeout(timeoutId);
      
      const expiry = sessionStorage.getItem("ras_session_expiry");
      if (expiry) {
        const now = Date.now();
        if (now < Number(expiry)) {
          // Extend session
          sessionStorage.setItem("ras_session_expiry", String(now + SESSION_LEASE_MS));
        } else {
          handleAutoLogout("Inactivity Timeout: Session expired.");
          return;
        }
      }
      
      // Auto logout exactly after 15 minutes of zero inputs
      timeoutId = setTimeout(() => {
        handleAutoLogout("Inactivity Timeout: Enforced administrative 15-minute auto-logout.");
      }, SESSION_LEASE_MS);
    };

    // Human interactive input listeners
    const events = ["mousedown", "mousemove", "keydown", "scroll", "click"];
    events.forEach((ev) => document.addEventListener(ev, resetExpiryTimer));

    // Register initial run
    resetExpiryTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => document.removeEventListener(ev, resetExpiryTimer));
    };
  }, [isAuthenticated]);

  const clearSessionContext = () => {
    sessionStorage.removeItem("ras_admin_session_email");
    sessionStorage.removeItem("ras_mfa_authenticated_flag");
    sessionStorage.removeItem("ras_session_expiry");
  };

  const handleLoginSuccess = (email: string) => {
    const expiresAt = Date.now() + SESSION_LEASE_MS;
    sessionStorage.setItem("ras_admin_session_email", email);
    sessionStorage.setItem("ras_mfa_authenticated_flag", "true");
    sessionStorage.setItem("ras_session_expiry", String(expiresAt));
    setSessionNotice(null);
    setAdminEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearSessionContext();
    setIsAuthenticated(false);
    setAdminEmail("");
    setSessionNotice(null);
  };

  const handleAutoLogout = (notice: string) => {
    clearSessionContext();
    setIsAuthenticated(false);
    setAdminEmail("");
    setSessionNotice(notice);
  };

  const handleBackToSite = () => {
    window.location.href = "https://yourhotel.com";
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0F0D0B] text-amber-200 font-sans flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase font-mono tracking-widest text-[#D4AF37]/80">Checking Clearance Seal...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {sessionNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#321111] border border-rose-900 text-rose-300 font-mono text-[11px] px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 animate-bounce">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{sessionNotice}</span>
        </div>
      )}
      <Routes>
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? (
              <AdminLogin onLoginSuccess={handleLoginSuccess} onBackToSite={handleBackToSite} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <AdminDashboard adminEmail={adminEmail} onLogout={handleLogout} onBackToSite={handleBackToSite} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
