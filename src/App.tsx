import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import DashboardHome from "./pages/DashboardHome";
import StudentsPage from "./pages/StudentsPage";
import CheckInPage from "./pages/CheckInPage";
import MeetingsPage from "./pages/MeetingsPage";
import EventsPage from "./pages/EventsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import MessagingPage from "./pages/MessagingPage";
import AICenterPage from "./pages/AICenterPage";
import DocumentsPage from "./pages/DocumentsPage";
import KioskPage from "./pages/KioskPage";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0B0B0B" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#C1121F", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#606060", fontFamily: "'Inter', sans-serif" }}>LOADING…</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const portal = user.role === "director" || user.role === "admin" ? "director"
    : user.role === "student" ? "student"
    : "staff";

  return (
    <Layout portal={portal}>
      <Routes>
        <Route path="/"           element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<DashboardHome />} />
        <Route path="/students"   element={<StudentsPage />} />
        <Route path="/checkin"    element={<CheckInPage />} />
        <Route path="/meetings"   element={<MeetingsPage />} />
        <Route path="/events"     element={<EventsPage />} />
        <Route path="/messages"   element={<MessagingPage />} />
        <Route path="/documents"  element={<DocumentsPage />} />
        <Route path="/reports"    element={<ReportsPage />} />
        <Route path="/ai-center"  element={<AICenterPage />} />
        <Route path="/settings"   element={<SettingsPage />} />
        <Route path="*"           element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Kiosk mode — no auth required */}
          <Route path="/kiosk" element={<KioskPage />} />
          {/* All other routes go through auth */}
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
