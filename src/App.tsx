import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import AttendancePage from "./pages/AttendancePage";
import GrantReportingPage from "./pages/GrantReportingPage";
import StudentsPage from "./pages/StudentsPage";
import CommunicationsPage from "./pages/CommunicationsPage";
import EventsPage from "./pages/EventsPage";
import IDCenterPage from "./pages/IDCenterPage";
import NovaIntelligencePage from "./pages/NovaIntelligencePage";
import SettingsPage from "./pages/SettingsPage";
import KioskPage from "./pages/KioskPage";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050505" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(248,250,252,0.06)", borderTopColor: "#D72638", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "#475569", fontFamily: "'Inter', sans-serif", textTransform: "uppercase" }}>Loading…</p>
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
        {/* Primary landing */}
        <Route path="/"                 element={<Navigate to="/attendance" replace />} />
        <Route path="/attendance"       element={<AttendancePage />} />

        {/* Core modules */}
        <Route path="/grant-reporting"  element={<GrantReportingPage />} />
        <Route path="/students"         element={<StudentsPage />} />
        <Route path="/students/:id"     element={<StudentsPage />} />
        <Route path="/communications"   element={<CommunicationsPage />} />
        <Route path="/events"           element={<EventsPage />} />

        {/* Tools */}
        <Route path="/digital-ids"      element={<IDCenterPage />} />
        <Route path="/nova"             element={<NovaIntelligencePage />} />
        <Route path="/settings"         element={<SettingsPage />} />

        {/* Legacy redirects — keep old links working */}
        <Route path="/dashboard"        element={<Navigate to="/attendance" replace />} />
        <Route path="/checkin"          element={<Navigate to="/attendance" replace />} />
        <Route path="/operations"       element={<Navigate to="/attendance" replace />} />
        <Route path="/meetings"         element={<Navigate to="/attendance" replace />} />
        <Route path="/tasks"            element={<Navigate to="/attendance" replace />} />
        <Route path="/insights"         element={<Navigate to="/nova" replace />} />
        <Route path="/reports"          element={<Navigate to="/grant-reporting" replace />} />
        <Route path="/ai-center"        element={<Navigate to="/nova" replace />} />
        <Route path="/id-center"        element={<Navigate to="/digital-ids" replace />} />
        <Route path="/administration"   element={<Navigate to="/settings" replace />} />
        <Route path="/resources"        element={<Navigate to="/attendance" replace />} />
        <Route path="/documents"        element={<Navigate to="/students" replace />} />
        <Route path="/messages"         element={<Navigate to="/communications" replace />} />

        <Route path="*"                 element={<Navigate to="/attendance" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/*"     element={<AppRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
