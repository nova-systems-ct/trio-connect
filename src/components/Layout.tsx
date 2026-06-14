import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import ctStateLogo from "../assets/ctstate-logo.png";

const NAVY  = "#1B3A6B";
const GOLD  = "#C5A028";
const DARK  = "#111827";

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: "/dashboard", label: "Dashboard",
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  },
  {
    path: "/students", label: "Students",
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  },
  {
    path: "/checkin", label: "Check-In",
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    badge: "Live",
  },
  {
    path: "/meetings", label: "Meetings",
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  },
  {
    path: "/events", label: "Events",
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>,
  },
  {
    path: "/reports", label: "Reports",
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  },
  {
    path: "/settings", label: "Settings",
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    roles: ["director"],
  },
];

function roleInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="no-print" style={{ display: "flex", height: "100vh", background: "#F1F5F9", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 228, background: DARK, height: "100vh", display: "flex", flexDirection: "column", position: "sticky", top: 0, flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <img src={ctStateLogo} alt="CT State" style={{ height: 30, filter: "brightness(0) invert(1)", opacity: 0.92, display: "block" }} />
          <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 8 }}>
            TRIO Connect
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 12px", marginBottom: 3,
                  borderRadius: 8, border: "none", textAlign: "left", cursor: "pointer",
                  background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.52)",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: item.badge === "Live" ? "#10B981" : GOLD, color: "#fff", letterSpacing: "0.04em" }}>
                    {item.badge}
                  </span>
                )}
                {isActive && <span style={{ width: 3, height: 18, background: GOLD, borderRadius: 2, flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{user ? roleInitials(user.full_name) : "??"}</span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.full_name}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1, textTransform: "capitalize" }}>{user?.role} · CT State</p>
            </div>
            <button onClick={logout} title="Sign out"
              style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <main style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
