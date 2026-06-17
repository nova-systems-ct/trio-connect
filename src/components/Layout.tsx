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
  activePaths?: string[];
  gold?: boolean;
  external?: boolean;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG  = "#050505";
const BG2 = "#0D1117";
const CARD = "#111827";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED  = "#D72638";
const GOLD = "#D4AF37";
const BORDER = "rgba(248,250,252,0.06)";

// ── Nav definitions ────────────────────────────────────────────────────────────
const STAFF_NAV: NavItem[] = [
  { path: "/attendance",      label: "Attendance",       icon: icon_check(), activePaths: ["/attendance", "/checkin"] },
  { path: "/grant-reporting", label: "Grant Reporting",  icon: icon_chart(), activePaths: ["/grant-reporting", "/reports", "/insights"] },
  { path: "/students",        label: "Students",         icon: icon_users() },
  { path: "/communications",  label: "Communications",   icon: icon_mail() },
  { path: "/events",          label: "Events",           icon: icon_ops() },
];

const DIRECTOR_NAV: NavItem[] = [
  { path: "/attendance",      label: "Attendance",       icon: icon_check(), activePaths: ["/attendance", "/checkin"] },
  { path: "/grant-reporting", label: "Grant Reporting",  icon: icon_chart(), activePaths: ["/grant-reporting", "/reports", "/insights"] },
  { path: "/students",        label: "Students",         icon: icon_users() },
  { path: "/communications",  label: "Communications",   icon: icon_mail() },
  { path: "/events",          label: "Events",           icon: icon_ops() },
];

const STUDENT_NAV: NavItem[] = [
  { path: "/attendance", label: "Attendance", icon: icon_check() },
  { path: "/events",     label: "Events",     icon: icon_star() },
  { path: "/digital-ids", label: "My ID",    icon: icon_id() },
];

const BOTTOM_NAV: NavItem[] = [
  { path: "/digital-ids",  label: "Digital IDs",       icon: icon_id(),    activePaths: ["/digital-ids", "/id-center"] },
  { path: "/nova",          label: "Nova Intelligence",  icon: icon_nova() },
  { path: "/settings",      label: "Settings",           icon: icon_cog() },
];

function navForPortal(portal: Portal): NavItem[] {
  if (portal === "director") return DIRECTOR_NAV;
  if (portal === "student")  return STUDENT_NAV;
  return STAFF_NAV;
}

const ROLE_COLOR: Partial<Record<UserRole, string>> = {
  director: RED, admin: TEXT3, advisor: "#3B82F6",
  tutor: "#7C3AED", staff: "#F59E0B", student_worker: "#22C55E", student: "#22C55E",
};

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  director: "Director", admin: "Admin", advisor: "Advisor",
  tutor: "Tutor", staff: "Staff", student_worker: "Student Worker", student: "Student",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function NavBtn({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 11,
        padding: "9px 12px", borderRadius: 9, border: "none",
        background: isActive ? "rgba(215,38,56,0.10)" : "none",
        color: isActive ? TEXT : TEXT2,
        cursor: "pointer", marginBottom: 1,
        textAlign: "left", transition: "all 0.12s",
        fontFamily: "'Inter', -apple-system, sans-serif",
        borderLeft: `2px solid ${isActive ? RED : "transparent"}`,
        position: "relative",
      }}
      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(248,250,252,0.04)"; e.currentTarget.style.color = TEXT; } }}
      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = TEXT2; } }}
    >
      <span style={{ color: isActive ? RED : TEXT3, flexShrink: 0, display: "flex" }}>
        {item.icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, letterSpacing: isActive ? "-0.01em" : "0" }}>
        {item.label}
      </span>
    </button>
  );
}

export default function Layout({ children, portal = "staff" }: { children: ReactNode; portal?: Portal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = navForPortal(portal);
  const roleColor = ROLE_COLOR[user?.role ?? "student"] ?? TEXT3;

  function isItemActive(item: NavItem): boolean {
    const paths = item.activePaths ?? [item.path];
    return paths.some((p) =>
      p === "/dashboard" ? location.pathname === p : location.pathname === p || location.pathname.startsWith(p + "/")
    );
  }

  const currentLabel = [...nav, ...BOTTOM_NAV].find((n) => isItemActive(n))?.label ?? "Attendance";

  return (
    <div style={{ display: "flex", height: "100vh", background: BG, overflow: "hidden", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 216, flexShrink: 0,
        background: BG2,
        borderRight: `1px solid ${BORDER}`,
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 10,
      }}>
        {/* Branding */}
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${RED}18`, border: `1px solid ${RED}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: RED }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: TEXT, letterSpacing: "-0.3px", lineHeight: 1.1 }}>TRIO Connect</p>
              <p style={{ fontSize: 9, color: TEXT3, fontWeight: 500, marginTop: 1 }}>Student Success Platform</p>
            </div>
          </div>
          {/* Nova Systems */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>Nova Systems</span>
            <span style={{ fontSize: 9, color: TEXT3, marginLeft: 2 }}>·</span>
            <img src={ctStateLogo} alt="" style={{ height: 9, opacity: 0.3, filter: "brightness(0) invert(1)" }} />
          </div>
        </div>

        {/* Primary nav */}
        <nav style={{ flex: 1, padding: "10px 8px 4px", overflowY: "auto" }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT3, padding: "0 8px 8px" }}>Main</p>
          {nav.map((item) => (
            <NavBtn key={item.path} item={item} isActive={isItemActive(item)} onClick={() => navigate(item.path)} />
          ))}

          <div style={{ height: 1, background: BORDER, margin: "12px 4px" }} />

          {/* Kiosk */}
          <button
            onClick={() => window.open("/kiosk", "_blank")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 11,
              padding: "9px 12px", borderRadius: 9, border: "none",
              background: "none", color: TEXT2, cursor: "pointer", marginBottom: 1,
              textAlign: "left", transition: "all 0.12s", fontFamily: "'Inter', sans-serif",
              borderLeft: "2px solid transparent",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,250,252,0.04)"; e.currentTarget.style.color = TEXT; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = TEXT2; }}
          >
            <span style={{ color: TEXT3, flexShrink: 0, display: "flex" }}>{icon_kiosk()}</span>
            <span style={{ fontSize: 13, fontWeight: 400 }}>Kiosk</span>
            <span style={{ marginLeft: "auto", fontSize: 9, color: TEXT3 }}>↗</span>
          </button>

          {BOTTOM_NAV.map((item) => (
            <NavBtn key={item.path} item={item} isActive={isItemActive(item)} onClick={() => navigate(item.path)} />
          ))}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: `${roleColor}14`, border: `1.5px solid ${roleColor}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: roleColor }}>
                {user ? initials(user.full_name) : "?"}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.full_name}
              </p>
              <p style={{ fontSize: 10, color: roleColor, fontWeight: 600 }}>
                {ROLE_LABEL[user?.role ?? "student"]}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: "none", color: TEXT3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.1s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${RED}40`; e.currentTarget.style.color = RED; e.currentTarget.style.background = `${RED}08`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT3; e.currentTarget.style.background = "none"; }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: BG }}>
        {/* Top bar */}
        <div style={{
          height: 52, background: BG2,
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", flexShrink: 0, gap: 16,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: TEXT2, letterSpacing: "0.01em" }}>
            {currentLabel}
          </span>

          {/* Search */}
          <div style={{
            flex: 1, maxWidth: 400,
            display: "flex", alignItems: "center", gap: 8,
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 9, padding: "7px 12px",
          }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={TEXT3} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text" placeholder="Search students, events, records…"
              style={{ background: "none", border: "none", outline: "none", flex: 1, fontSize: 12, color: TEXT, fontFamily: "'Inter', sans-serif" }}
            />
            <span style={{ fontSize: 10, color: TEXT3, fontWeight: 600, background: "rgba(248,250,252,0.05)", padding: "2px 5px", borderRadius: 4 }}>⌘K</span>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{
              width: 32, height: 32, borderRadius: 8,
              background: "none", border: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              position: "relative", transition: "all 0.1s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(248,250,252,0.14)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = BORDER}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={TEXT2} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            {portal !== "student" && (
              <button
                onClick={() => navigate("/attendance")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 8,
                  background: RED, color: "#fff", border: "none",
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: `0 2px 12px rgba(215,38,56,0.3)`,
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#B91C2C"}
                onMouseLeave={(e) => e.currentTarget.style.background = RED}
              >
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Check In
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

// ── Icon helpers ──────────────────────────────────────────────────────────────
function icon_check()  { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function icon_nova()   { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>; }
function icon_users()  { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>; }
function icon_ops()    { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>; }
function icon_mail()   { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>; }
function icon_chart()  { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>; }
function icon_kiosk()  { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" /></svg>; }
function icon_id()     { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>; }
function icon_cog()    { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function icon_star()   { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>; }
