import { useState } from "react";
import { resetDemoData } from "../lib/db";

const CARD  = "#111827";
const CARD2 = "#1A2236";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED   = "#D72638";
const BORDER = "rgba(248,250,252,0.06)";

type TabId = "staff" | "roles" | "campus" | "audit" | "system";

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
      background: active ? CARD2 : "transparent",
      color: active ? TEXT : TEXT2, fontSize: 13, fontWeight: active ? 600 : 400,
      fontFamily: "'Inter', sans-serif", transition: "all 0.12s",
    }}>
      {label}
    </button>
  );
}

const inp: React.CSSProperties = {
  width: "100%", border: `1px solid rgba(248,250,252,0.1)`, borderRadius: 9,
  padding: "9px 12px", fontSize: 13, outline: "none",
  background: CARD2, color: TEXT, fontFamily: "'Inter', sans-serif",
  boxSizing: "border-box",
};

const STAFF_MEMBERS = [
  { id: "dir-001", name: "Dr. Patricia Williams", role: "Director", email: "p.williams@ctstate.edu", campus: "All Campuses", status: "active" },
  { id: "adv-001", name: "Maria Rodriguez", role: "Advisor", email: "m.rodriguez@ctstate.edu", campus: "Naugatuck Valley CC", status: "active" },
  { id: "adv-002", name: "James Thompson", role: "Advisor", email: "j.thompson@ctstate.edu", campus: "Capital CC", status: "active" },
  { id: "adv-003", name: "Angela Chen", role: "Advisor", email: "a.chen@ctstate.edu", campus: "Asnuntuck CC", status: "active" },
  { id: "adv-004", name: "David Okafor", role: "Advisor", email: "d.okafor@ctstate.edu", campus: "Tunxis CC", status: "active" },
  { id: "adv-005", name: "Sarah Patel", role: "Advisor", email: "s.patel@ctstate.edu", campus: "Middlesex CC", status: "active" },
];

const ROLES = [
  { role: "Director", color: RED, desc: "Full platform access, reports, staff management, grant compliance", count: 1 },
  { role: "Admin", color: TEXT3, desc: "Settings, staff, and program configuration", count: 0 },
  { role: "Advisor", color: "#3B82F6", desc: "Student management, appointments, events, communications", count: 5 },
  { role: "Tutor", color: "#7C3AED", desc: "Student support, activity logging, resource access", count: 0 },
  { role: "Staff", color: "#F59E0B", desc: "Check-in, event management, resource access", count: 0 },
  { role: "Student", color: "#22C55E", desc: "View own profile, events, and resources", count: 0 },
];

const AUDIT_LOG = [
  { id: 1, user: "Dr. Patricia Williams", action: "Viewed annual performance report", time: "Today, 9:14 AM", type: "view" },
  { id: 2, user: "Maria Rodriguez", action: "Created appointment for student", time: "Today, 8:52 AM", type: "create" },
  { id: 3, user: "James Thompson", action: "Sent FAFSA reminder to 24 students", time: "Today, 8:30 AM", type: "message" },
  { id: 4, user: "Angela Chen", action: "Completed student advising session", time: "Yesterday, 4:15 PM", type: "update" },
  { id: 5, user: "David Okafor", action: "Logged check-in for student", time: "Yesterday, 3:42 PM", type: "create" },
];

export default function AdministrationPage() {
  const [tab, setTab] = useState<TabId>("staff");
  const [resetConfirm, setResetConfirm] = useState(false);

  const TABS: [TabId, string][] = [["staff", "Staff"], ["roles", "Roles & Permissions"], ["campus", "Campus Settings"], ["audit", "Audit Log"], ["system", "System"]];

  function roleColor(role: string) {
    return ROLES.find((r) => r.role === role)?.color ?? TEXT3;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-0.5px" }}>Administration</h1>
        <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>Manage staff, permissions, settings, and system configuration.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 11, padding: "4px", width: "fit-content" }}>
        {TABS.map(([id, label]) => <TabBtn key={id} label={label} active={tab === id} onClick={() => setTab(id)} />)}
      </div>

      {/* ── Staff tab ────────────────────────────────────────────────────────── */}
      {tab === "staff" && (
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Staff Members</p>
            <button style={{ padding: "7px 16px", borderRadius: 9, background: RED, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              + Invite Staff
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Name", "Role", "Campus", "Email", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAFF_MEMBERS.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(248,250,252,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: `${roleColor(s.role)}14`, border: `1px solid ${roleColor(s.role)}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: roleColor(s.role) }}>{s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${roleColor(s.role)}12`, color: roleColor(s.role) }}>{s.role}</span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: TEXT2 }}>{s.campus}</td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: TEXT3 }}>{s.email}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#22C55E", textTransform: "uppercase" }}>Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Roles tab ────────────────────────────────────────────────────────── */}
      {tab === "roles" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ROLES.map((r) => (
            <div key={r.role} style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${r.color}14`, border: `1px solid ${r.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: r.color }}>{r.role.slice(0, 2).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{r.role}</p>
                  <span style={{ fontSize: 10, color: TEXT3 }}>{r.count} member{r.count !== 1 ? "s" : ""}</span>
                </div>
                <p style={{ fontSize: 12, color: TEXT3 }}>{r.desc}</p>
              </div>
              <button style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                Edit Permissions
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Campus Settings tab ──────────────────────────────────────────────── */}
      {tab === "campus" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 800 }}>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Program Information</p>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Program Name", val: "TRIO Student Support Services" },
                { label: "Grant Number", val: "P042A220XXX" },
                { label: "Grant Period", val: "2022–2027" },
                { label: "Student Capacity", val: "160 students" },
                { label: "Primary Institution", val: "CT State Community College" },
              ].map(({ label, val }) => (
                <div key={label}>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: TEXT3, marginBottom: 5, display: "block" }}>{label}</label>
                  <input defaultValue={val} style={inp} />
                </div>
              ))}
              <button style={{ padding: "10px 0", borderRadius: 9, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Save Changes
              </button>
            </div>
          </div>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Campus Locations</p>
            </div>
            <div style={{ padding: "10px 8px" }}>
              {["Naugatuck Valley CC", "Capital CC", "Asnuntuck CC", "Tunxis CC", "Middlesex CC"].map((campus) => (
                <div key={campus} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 8, marginBottom: 2 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(248,250,252,0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 13, color: TEXT2 }}>{campus}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#22C55E", textTransform: "uppercase" }}>Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Audit Log tab ────────────────────────────────────────────────────── */}
      {tab === "audit" && (
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "15px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Audit Log</p>
            <span style={{ fontSize: 11, color: TEXT3 }}>Showing recent system events</span>
          </div>
          {AUDIT_LOG.map((entry) => (
            <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: entry.type === "create" ? "#22C55E" : entry.type === "message" ? "#3B82F6" : entry.type === "update" ? "#F59E0B" : TEXT3, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{entry.user}</span>
                <span style={{ fontSize: 12, color: TEXT3, marginLeft: 8 }}>{entry.action}</span>
              </div>
              <span style={{ fontSize: 11, color: TEXT3, flexShrink: 0 }}>{entry.time}</span>
            </div>
          ))}
          <div style={{ padding: "12px 20px", textAlign: "center" }}>
            <button style={{ fontSize: 12, color: TEXT3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Load more entries</button>
          </div>
        </div>
      )}

      {/* ── System tab ───────────────────────────────────────────────────────── */}
      {tab === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>
          {/* Version info */}
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "20px 22px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12 }}>System Information</p>
            {[
              ["Platform", "TRIO Connect v3.0"],
              ["Powered By", "Nova Systems"],
              ["Institution", "CT State Community College"],
              ["Environment", "Production"],
              ["Data Storage", "Supabase (fallback: LocalStorage)"],
              ["Version", "3.0.0 · June 2026"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 12, color: TEXT3 }}>{label}</span>
                <span style={{ fontSize: 12, color: TEXT2, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Danger Zone */}
          <div style={{ background: "rgba(215,38,56,0.04)", border: "1px solid rgba(215,38,56,0.18)", borderRadius: 14, padding: "20px 22px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Danger Zone</p>
            <p style={{ fontSize: 12, color: TEXT3, marginBottom: 16 }}>These actions are irreversible. Proceed with caution.</p>
            {resetConfirm ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 12, color: "#F87171", fontWeight: 600 }}>Are you sure? This will clear all local data and cannot be undone.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { resetDemoData(); setResetConfirm(false); location.reload(); }}
                    style={{ padding: "9px 20px", borderRadius: 9, background: RED, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                    Yes, Reset Everything
                  </button>
                  <button onClick={() => setResetConfirm(false)}
                    style={{ padding: "9px 20px", borderRadius: 9, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setResetConfirm(true)}
                style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(215,38,56,0.1)", border: "1px solid rgba(215,38,56,0.25)", color: "#F87171", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Reset All Data
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
