import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import DashboardHome from "./pages/DashboardHome";
import StudentsPage from "./pages/StudentsPage";
import OperationsPage from "./pages/OperationsPage";
import CheckInPage from "./pages/CheckInPage";
import MeetingsPage from "./pages/MeetingsPage";
import EventsPage from "./pages/EventsPage";
import TasksPage from "./pages/TasksPage";
import ResourcesPage from "./pages/ResourcesPage";
import DocumentsPage from "./pages/DocumentsPage";
import CommunicationsPage from "./pages/CommunicationsPage";
import InsightsPage from "./pages/InsightsPage";
import AdministrationPage from "./pages/AdministrationPage";
import IDCenterPage from "./pages/IDCenterPage";
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
        <Route path="/"                element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"       element={<DashboardHome />} />
        <Route path="/students"        element={<StudentsPage />} />
        <Route path="/students/:id"    element={<StudentsPage />} />

        {/* Operations hub */}
        <Route path="/operations"      element={<OperationsPage />} />
        <Route path="/checkin"         element={<CheckInPage />} />
        <Route path="/meetings"        element={<MeetingsPage />} />
        <Route path="/events"          element={<EventsPage />} />
        <Route path="/tasks"           element={<TasksPage />} />
        <Route path="/resources"       element={<ResourcesPage />} />
        <Route path="/documents"       element={<DocumentsPage />} />

        {/* Module pages */}
        <Route path="/communications"  element={<CommunicationsPage />} />
        <Route path="/insights"        element={<InsightsPage />} />
        <Route path="/administration"  element={<AdministrationPage />} />
        <Route path="/id-center"       element={<IDCenterPage />} />
        <Route path="/settings"        element={<SettingsPage />} />

        {/* Legacy redirects */}
        <Route path="/messages"        element={<Navigate to="/communications" replace />} />
        <Route path="/reports"         element={<Navigate to="/insights" replace />} />
        <Route path="/ai-center"       element={<Navigate to="/insights" replace />} />

        <Route path="*"                element={<Navigate to="/dashboard" replace />} />
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
