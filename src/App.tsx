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

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F1F5F9" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #1B3A6B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#1B3A6B" }}>LOADING…</p>
      </div>
    </div>
  );
  if (!user) return <LoginPage />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
