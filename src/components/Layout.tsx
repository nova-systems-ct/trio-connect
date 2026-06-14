import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import ctStateLogo from "../assets/ctstate-logo.png";
import type { UserRole } from "../lib/types";

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles?: UserRole[];
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: "/dashboard", label: "Dashboard",
    icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  },
  {
    path: "/students", label: "Students",
    icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  },
  {
    path: "/checkin", label: "Check-In",
    icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    badge: "Live", badgeColor: "#C1121F",
  },
  {
    path: "/meetings", label: "Meetings",
    icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  },
  {
    path: "/events", label: "Events",
    icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>,
  },
  {
    path: "/reports", label: "Reports",
    icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  },
  {
    path: "/settings", label: "Settings",
    icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    roles: ["director", "admin"],
  },
];

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  director: "Director",
  advisor: "Advisor",
  admin: "Admin",
  tutor: "Tutor",
  staff: "Staff",
  student_worker: "Student Worker",
  student: "Student",
};

const ROLE_COLOR: Partial<Record<UserRole, string>> = {
  director: "#C1121F",
  admin: "#111111",
  advisor: "#2563EB",
  tutor: "#7C3AED",
  staff: "#D97706",
  student_worker: "#059669",
  student: "#16A34A",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F7F7F7", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: 232, flexShrink: 0,
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 10,
      }}>
        {/* Logo area */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #F0F0F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <img src={ctStateLogo} alt="CT State" style={{ height: 22 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 13, fontWeight: 800, color: "#111111", letterSpacing: "-0.3px",
            }}>
              TRIO Success OS
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "linear-gradient(135deg, #D4AF37, #B8860B)",
            }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#92400E", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Nova Systems
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 8, border: "none",
                  background: isActive ? "#FFF4F4" : "none",
                  color: isActive ? "#C1121F" : "#374151",
                  cursor: "pointer", marginBottom: 2, position: "relative",
                  textAlign: "left", transition: "all 0.1s",
                  fontFamily: "'Inter', sans-serif",
                  borderLeft: isActive ? "3px solid #C1121F" : "3px solid transparent",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#F5F5F5"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "none"; }}
              >
                <span style={{ color: isActive ? "#C1121F" : "#6B7280", flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span style={{
                    marginLeft: "auto",
                    fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 10,
                    background: "#C1121F", color: "#fff",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    animation: "livePulse 2s ease-in-out infinite",
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: "1px solid #F0F0F0", padding: "14px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `${ROLE_COLOR[user?.role ?? "student"] ?? "#6B7280"}15`,
              border: `1.5px solid ${ROLE_COLOR[user?.role ?? "student"] ?? "#6B7280"}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: ROLE_COLOR[user?.role ?? "student"] ?? "#6B7280",
              }}>
                {user ? initials(user.full_name) : "??"}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 700, color: "#111111",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.full_name}
              </p>
              <p style={{ fontSize: 10, color: ROLE_COLOR[user?.role ?? "student"] ?? "#6B7280", fontWeight: 600, textTransform: "capitalize" }}>
                {ROLE_LABEL[user?.role ?? "student"] ?? user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "7px", borderRadius: 8, border: "1px solid #E5E7EB",
              background: "none", color: "#6B7280", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C1121F"; e.currentTarget.style.color = "#C1121F"; e.currentTarget.style.background = "#FFF4F4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.background = "none"; }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          height: 56, background: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0, gap: 16,
        }}>
          {/* Page title derived from path */}
          <div>
            {(() => {
              const item = NAV_ITEMS.find((n) => location.pathname === n.path || (n.path !== "/dashboard" && location.pathname.startsWith(n.path)));
              return <span style={{ fontSize: 14, fontWeight: 700, color: "#111111" }}>{item?.label ?? "Dashboard"}</span>;
            })()}
          </div>

          {/* Search bar */}
          <div style={{
            flex: 1, maxWidth: 380,
            display: "flex", alignItems: "center", gap: 8,
            background: "#F7F7F7", border: "1px solid #E5E7EB",
            borderRadius: 10, padding: "7px 12px",
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search students, meetings, events…"
              style={{
                background: "none", border: "none", outline: "none", flex: 1,
                fontSize: 13, color: "#111111", fontFamily: "'Inter', sans-serif",
              }}
            />
            <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, background: "#E5E7EB", padding: "2px 5px", borderRadius: 4 }}>⌘K</span>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Notification bell */}
            <button style={{
              width: 36, height: 36, borderRadius: 8, background: "none",
              border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <div style={{
                position: "absolute", top: 6, right: 6,
                width: 7, height: 7, borderRadius: "50%",
                background: "#C1121F", border: "1.5px solid #fff",
              }} />
            </button>

            {/* Check-in button */}
            <button
              onClick={() => navigate("/checkin")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8,
                background: "#C1121F", color: "#fff",
                border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700, fontFamily: "'Inter', sans-serif",
                boxShadow: "0 1px 4px rgba(193,18,31,0.25)",
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Check In
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
