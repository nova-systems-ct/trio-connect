import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import ctStateLogo from "../assets/ctstate-logo.png";
import type { UserRole } from "../lib/types";

type Portal = "staff" | "director" | "student";

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}

// ── Nav definitions per portal ────────────────────────────────────────────────
const STAFF_NAV: NavItem[] = [
  { path: "/dashboard", label: "Dashboard",    icon: icon_grid() },
  { path: "/students",  label: "Students",     icon: icon_users() },
  { path: "/checkin",   label: "Attendance",   icon: icon_check(), badge: "Live" },
  { path: "/meetings",  label: "Appointments", icon: icon_calendar() },
  { path: "/events",    label: "Events",       icon: icon_star() },
  { path: "/messages",  label: "Messages",     icon: icon_mail() },
  { path: "/documents", label: "Documents",    icon: icon_doc() },
  { path: "/resources", label: "Resources",    icon: icon_book() },
  { path: "/tasks",     label: "Tasks",        icon: icon_tasks() },
  { path: "/reports",   label: "Reports",      icon: icon_chart() },
  { path: "/ai-center", label: "AI Center",    icon: icon_ai(), badge: "AI" },
  { path: "/settings",  label: "Settings",     icon: icon_cog() },
];

const DIRECTOR_NAV: NavItem[] = [
  { path: "/dashboard", label: "Executive",    icon: icon_grid() },
  { path: "/students",  label: "Students",     icon: icon_users() },
  { path: "/meetings",  label: "Appointments", icon: icon_calendar() },
  { path: "/events",    label: "Events",       icon: icon_star() },
  { path: "/messages",  label: "Messages",     icon: icon_mail() },
  { path: "/documents", label: "Documents",    icon: icon_doc() },
  { path: "/resources", label: "Resources",    icon: icon_book() },
  { path: "/tasks",     label: "Tasks",        icon: icon_tasks() },
  { path: "/reports",   label: "Reports",      icon: icon_chart() },
  { path: "/ai-center", label: "AI Center",    icon: icon_ai(), badge: "AI" },
  { path: "/settings",  label: "Settings",     icon: icon_cog() },
];

const STUDENT_NAV: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: icon_grid() },
  { path: "/events",    label: "Events",    icon: icon_star() },
];

function navForPortal(portal: Portal): NavItem[] {
  if (portal === "director") return DIRECTOR_NAV;
  if (portal === "student")  return STUDENT_NAV;
  return STAFF_NAV;
}

const ROLE_COLOR: Partial<Record<UserRole, string>> = {
  director: "#C1121F",
  admin:    "#A0A0A0",
  advisor:  "#3B82F6",
  tutor:    "#7C3AED",
  staff:    "#F59E0B",
  student_worker: "#22C55E",
  student:  "#22C55E",
};

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  director: "Director", admin: "Admin", advisor: "Advisor",
  tutor: "Tutor", staff: "Staff", student_worker: "Student Worker", student: "Student",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function Layout({ children, portal = "staff" }: { children: ReactNode; portal?: Portal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = navForPortal(portal);
  const roleColor = ROLE_COLOR[user?.role ?? "student"] ?? "#A0A0A0";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0B0B0B", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "#0D0D0D",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 10,
      }}>
        {/* Branding */}
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Primary: TRIO */}
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              TRIO Connect
            </p>
            <p style={{ fontSize: 10, color: "#606060", fontWeight: 500, marginTop: 2 }}>
              Student Success Platform
            </p>
          </div>
          {/* Secondary: Nova Systems */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#D4AF37", flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Nova Systems
            </span>
          </div>
          {/* Tertiary: CT State */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, opacity: 0.3 }}>
            <img src={ctStateLogo} alt="CT State" style={{ height: 10, filter: "brightness(0) invert(1)" }} />
            <span style={{ fontSize: 9, color: "#606060" }}>CT State</span>
          </div>
        </div>

        {/* Portal label */}
        <div style={{ padding: "10px 18px 4px" }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#404040" }}>
            {portal === "director" ? "Director Portal" : portal === "student" ? "Student Portal" : "Staff Portal"}
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 10px 10px", overflowY: "auto" }}>
          {nav.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px 9px 12px", borderRadius: 8, border: "none",
                  background: isActive ? "rgba(193,18,31,0.12)" : "none",
                  color: isActive ? "#FFFFFF" : "#A0A0A0",
                  cursor: "pointer", marginBottom: 2,
                  textAlign: "left", transition: "all 0.1s",
                  fontFamily: "'Inter', sans-serif",
                  borderLeft: isActive ? "2px solid #C1121F" : "2px solid transparent",
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "none"; }}
              >
                <span style={{ color: isActive ? "#C1121F" : "#606060", flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span style={{
                    marginLeft: "auto", fontSize: 8, fontWeight: 800,
                    padding: "2px 5px", borderRadius: 10,
                    background: item.badge === "AI" ? "rgba(212,175,55,0.15)" : "#C1121F",
                    color: item.badge === "AI" ? "#D4AF37" : "#fff",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    animation: item.badge === "Live" ? "liveDot 2s ease-in-out infinite" : "none",
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Kiosk mode shortcut */}
        <div style={{ padding: "0 10px 8px" }}>
          <button
            onClick={() => window.open("/kiosk", "_blank")}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              background: "rgba(193,18,31,0.08)", border: "1px solid rgba(193,18,31,0.2)",
              color: "#C1121F", fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.1s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(193,18,31,0.14)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(193,18,31,0.08)"}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Open Kiosk Mode
          </button>
        </div>

        {/* User footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `${roleColor}18`,
              border: `1.5px solid ${roleColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: roleColor }}>
                {user ? initials(user.full_name) : "??"}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.full_name}
              </p>
              <p style={{ fontSize: 10, color: roleColor, fontWeight: 600, textTransform: "capitalize" }}>
                {ROLE_LABEL[user?.role ?? "student"]}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "7px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
              background: "none", color: "#606060", fontSize: 11, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(193,18,31,0.4)"; e.currentTarget.style.color = "#C1121F"; e.currentTarget.style.background = "rgba(193,18,31,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#606060"; e.currentTarget.style.background = "none"; }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0B0B0B" }}>
        {/* Top bar */}
        <div style={{
          height: 54, background: "#111111",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0, gap: 16,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#A0A0A0" }}>
            {nav.find((n) => location.pathname === n.path || (n.path !== "/dashboard" && location.pathname.startsWith(n.path)))?.label ?? "Dashboard"}
          </span>

          {/* Search */}
          <div style={{
            flex: 1, maxWidth: 360,
            display: "flex", alignItems: "center", gap: 8,
            background: "#0B0B0B", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "7px 12px",
          }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#606060" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text" placeholder="Search students, events, reports…"
              style={{ background: "none", border: "none", outline: "none", flex: 1, fontSize: 12, color: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}
            />
            <span style={{ fontSize: 10, color: "#404040", fontWeight: 600, background: "rgba(255,255,255,0.06)", padding: "2px 5px", borderRadius: 4 }}>⌘K</span>
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{
              width: 34, height: 34, borderRadius: 8, background: "none",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              position: "relative",
            }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#A0A0A0" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <div style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#C1121F", border: "1.5px solid #111111" }} />
            </button>
            {portal !== "student" && (
              <button
                onClick={() => navigate("/checkin")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8,
                  background: "#C1121F", color: "#fff", border: "none",
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: "0 2px 8px rgba(193,18,31,0.35)",
                }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Check In
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

// ── Icon helpers (inline SVG, 16×16) ─────────────────────────────────────────
function icon_grid() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>; }
function icon_users() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>; }
function icon_check() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function icon_calendar() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>; }
function icon_star() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>; }
function icon_chart() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>; }
function icon_cog()  { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function icon_mail() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>; }
function icon_doc()  { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>; }
function icon_ai()    { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>; }
function icon_book()  { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>; }
function icon_tasks() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25H7.5A2.25 2.25 0 005.25 7.5v9A2.25 2.25 0 007.5 18.75h9a2.25 2.25 0 002.25-2.25V7.5A2.25 2.25 0 0016.5 5.25H15" /></svg>; }
