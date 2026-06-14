import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import {
  getDashboardStats, getMeetings, getActivities,
  getNotifications, markNotificationRead, getAIInsights,
} from "../lib/db";
import type { DashboardStats, Meeting, Activity, Notification, AIInsight } from "../lib/types";
import { format } from "date-fns";

// ── Design tokens ─────────────────────────────────────────────────────────────
const RED    = "#C1121F";
const GOLD   = "#D4AF37";
const GREEN  = "#16A34A";
const BLUE   = "#2563EB";

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent = "#111111", icon, onClick, alert = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent?: string;
  icon: ReactNode;
  onClick?: () => void;
  alert?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        cursor: onClick ? "pointer" : "default",
        borderLeft: `3px solid ${alert ? RED : accent}`,
        transition: "box-shadow 0.15s, transform 0.1s",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>{label}</p>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", color: alert ? RED : accent }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: alert ? RED : "#111111", marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</p>
    </div>
  );
}

// Needed for StatCard's icon ReactNode type
import type { ReactNode } from "react";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    "Scheduled":   { bg: "#EFF6FF", color: "#1D4ED8" },
    "Checked In":  { bg: "#F0FDF4", color: "#16A34A" },
    "Completed":   { bg: "#F0FDF4", color: "#15803D" },
    "No Show":     { bg: "#FFF4F4", color: "#C1121F" },
    "Cancelled":   { bg: "#F9FAFB", color: "#6B7280" },
    "Rescheduled": { bg: "#FFFBEB", color: "#D97706" },
  };
  const s = styles[status] || styles["Scheduled"];
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, background: s.bg, color: s.color, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function AIInsightRow({ insight, navigate }: { insight: AIInsight; navigate: (p: string) => void }) {
  const iconMap = {
    risk:        { icon: "⚠", color: "#C1121F", bg: "rgba(193,18,31,0.12)" },
    opportunity: { icon: "◈", color: "#059669", bg: "rgba(5,150,105,0.12)" },
    info:        { icon: "◎", color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
    achievement: { icon: "★", color: "#D97706", bg: "rgba(217,119,6,0.12)" },
  };
  const style = iconMap[insight.type];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px",
      borderBottom: "1px solid rgba(255,255,255,0.12)",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: style.bg, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: 13,
      }}>
        {style.icon}
      </div>
      <p style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.92)", fontWeight: 500, lineHeight: 1.4 }}>
        {insight.message}
        {insight.count && (
          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 800, color: style.color, background: "rgba(255,255,255,0.15)", padding: "1px 6px", borderRadius: 10 }}>
            {insight.count}
          </span>
        )}
      </p>
      {insight.action_label && insight.action_path && (
        <button
          onClick={() => navigate(insight.action_path!)}
          style={{
            flexShrink: 0, padding: "5px 10px", borderRadius: 7,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
          }}
        >
          {insight.action_label} →
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [meetings, setMeetings]     = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifs]  = useState<Notification[]>([]);
  const [insights, setInsights]     = useState<AIInsight[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getMeetings(user?.role === "advisor" ? user.id : undefined),
      getActivities(),
      user ? getNotifications(user.id) : Promise.resolve([]),
    ]).then(([s, m, a, n]) => {
      setStats(s);
      setMeetings(m);
      setActivities(a.slice(0, 10));
      setNotifs(n.filter((x) => !x.is_read).slice(0, 3));
      setInsights(getAIInsights());
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #E5E7EB", borderTopColor: RED, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em" }}>LOADING DASHBOARD…</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayMeetings = meetings.filter((m) => m.meeting_date === today).sort((a, b) => a.meeting_time.localeCompare(b.meeting_time));
  const upcomingMeetings = meetings.filter((m) => m.meeting_date >= today).slice(0, 6);
  const todayActivities = activities.filter((a) => a.check_in_time.startsWith(today));
  const recentActivities = activities.slice(0, 8);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease both" }}>

      {/* ── Welcome header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 2 }}>
            {greeting},
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111111", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            {user?.full_name?.split(" ")[0] ?? "Welcome"}
          </h1>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")} · TRIO Success OS
          </p>
        </div>

        {/* Grant compliance badge */}
        {stats && (
          <div style={{
            background: "#FFFFFF", borderRadius: 12, padding: "12px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            borderTop: `3px solid ${(stats.grant_compliance_score ?? 0) >= 90 ? GREEN : (stats.grant_compliance_score ?? 0) >= 70 ? GOLD : RED}`,
          }}>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>Grant Compliance</p>
            <p style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: (stats.grant_compliance_score ?? 0) >= 90 ? GREEN : (stats.grant_compliance_score ?? 0) >= 70 ? GOLD : RED }}>
              {stats.grant_compliance_score ?? 0}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>/100</span>
            </p>
            <p style={{ fontSize: 9, fontWeight: 700, color: (stats.grant_compliance_score ?? 0) >= 90 ? GREEN : "#9CA3AF" }}>
              {(stats.grant_compliance_score ?? 0) >= 90 ? "✓ Excellent" : (stats.grant_compliance_score ?? 0) >= 70 ? "Good Standing" : "Needs Attention"}
            </p>
          </div>
        )}
      </div>

      {/* ── Unread notifications ────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notifications.map((n) => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 10, background: "#FFFFFF",
              border: `1px solid ${n.type === "warning" ? "#FDE68A" : n.type === "error" ? "#FECDD3" : "#BAE6FD"}`,
              animation: "fadeIn 0.2s ease both",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.type === "warning" ? "#F59E0B" : n.type === "error" ? RED : BLUE, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>{n.title}</span>
                <span style={{ fontSize: 12, color: "#666666", marginLeft: 8 }}>{n.message}</span>
              </div>
              <button
                onClick={() => { markNotificationRead(n.id); setNotifs((p) => p.filter((x) => x.id !== n.id)); }}
                style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <StatCard
            label="Students Served" value={stats.total_students}
            sub={`${stats.active_students} currently active`}
            accent={BLUE}
            onClick={() => navigate("/students")}
            icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          />
          <StatCard
            label="Active Today" value={stats.students_active_today ?? 0}
            sub="Checked in this session"
            accent={GREEN}
            onClick={() => navigate("/checkin")}
            icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Meetings This Week" value={stats.meetings_this_week}
            sub="Scheduled & completed"
            accent="#7C3AED"
            onClick={() => navigate("/meetings")}
            icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
          />
          <StatCard
            label="Students At Risk" value={stats.students_needing_attention}
            sub="No activity in 21+ days"
            accent={RED} alert={stats.students_needing_attention > 5}
            onClick={() => navigate("/students")}
            icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          />
        </div>
      )}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <StatCard
            label="Upcoming Events" value={stats.upcoming_events}
            sub="Workshops & sessions"
            accent="#D97706"
            onClick={() => navigate("/events")}
            icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>}
          />
          <StatCard
            label="Scholarships" value={stats.scholarships_tracked ?? 0}
            sub="Active opportunities"
            accent={GOLD}
            onClick={() => navigate("/reports")}
            icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>}
          />
          <StatCard
            label="Service Hours" value={`${stats.total_service_hours ?? 0}`}
            sub="This month · all students"
            accent={GREEN}
            onClick={() => navigate("/reports")}
            icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="No-Show Rate" value={`${stats.no_show_rate}%`}
            sub="Of all scheduled meetings"
            accent={stats.no_show_rate > 20 ? RED : "#9CA3AF"}
            alert={stats.no_show_rate > 20}
            icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>
      )}

      {/* ── AI Insights ─────────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div style={{
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1a1200 0%, #3D2B00 30%, #6B4C00 60%, #3D2B00 80%, #1a1200 100%)",
            padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "linear-gradient(135deg, #F9E27D, #D4AF37)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>
                ✦
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#FFF4B0", letterSpacing: "-0.2px" }}>AI Insights</p>
                <p style={{ fontSize: 10, color: "rgba(249,226,125,0.6)", fontWeight: 500 }}>Nova Systems Intelligence · Updated now</p>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 20,
              background: "rgba(249,226,125,0.12)", border: "1px solid rgba(249,226,125,0.2)",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#F9E27D", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#F9E27D", letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Analysis</span>
            </div>
          </div>

          {/* Insights */}
          <div style={{ background: "linear-gradient(180deg, #2D1F00 0%, #1A1200 100%)" }}>
            {insights.map((insight) => (
              <AIInsightRow key={insight.id} insight={insight} navigate={navigate} />
            ))}
          </div>
        </div>
      )}

      {/* ── Live Activity + Today's Schedule ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Live Activity */}
        <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{
            padding: "16px 18px 12px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #F0F0F0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", background: RED,
                animation: "livePulse 2s ease-in-out infinite",
              }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "#111111" }}>Live Activity</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: RED,
                background: "#FFF4F4", padding: "3px 8px", borderRadius: 20,
                border: "1px solid #FECDD3",
              }}>
                {todayActivities.length} today
              </span>
              <button onClick={() => navigate("/checkin")} style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                View all →
              </button>
            </div>
          </div>
          <div style={{ padding: "8px 6px" }}>
            {recentActivities.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", padding: "20px", textAlign: "center" }}>No activity logged yet today</p>
            ) : (
              recentActivities.map((a, i) => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8,
                  background: i % 2 === 0 ? "#FAFAFA" : "transparent",
                  animation: `fadeIn ${0.1 + i * 0.04}s ease both`,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: activityColor(a.activity_type) + "15",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: activityColor(a.activity_type) }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.student_name}
                    </p>
                    <p style={{ fontSize: 10, color: "#9CA3AF" }}>{a.activity_type}</p>
                  </div>
                  <span style={{ fontSize: 10, color: "#C4C4C4", flexShrink: 0 }}>
                    {format(new Date(a.check_in_time), "h:mm a")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div style={{ background: "#FFFFFF", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{
            padding: "16px 18px 12px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #F0F0F0",
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#111111" }}>Today's Appointments</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#666",
                background: "#F7F7F7", padding: "3px 8px", borderRadius: 20,
              }}>
                {todayMeetings.length} scheduled
              </span>
              <button onClick={() => navigate("/meetings")} style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                View all →
              </button>
            </div>
          </div>
          <div style={{ padding: "8px 6px" }}>
            {todayMeetings.length === 0 && upcomingMeetings.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", padding: "20px", textAlign: "center" }}>No meetings scheduled today</p>
            ) : (
              (todayMeetings.length > 0 ? todayMeetings : upcomingMeetings).slice(0, 7).map((m, i) => (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8,
                  animation: `fadeIn ${0.1 + i * 0.04}s ease both`,
                }}>
                  <div style={{
                    width: 42, flexShrink: 0, textAlign: "center",
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "#111111", lineHeight: 1 }}>
                      {m.meeting_time.slice(0, 5)}
                    </p>
                    <p style={{ fontSize: 9, color: "#9CA3AF", marginTop: 1 }}>
                      {format(new Date(m.meeting_date), "MMM d")}
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.student_name}
                    </p>
                    <p style={{ fontSize: 10, color: "#9CA3AF" }}>{m.meeting_type} · {m.advisor_name?.split(" ")[0]}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 14 }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {[
            { label: "Check In Student",   path: "/checkin",  color: RED,    icon: "✓" },
            { label: "Schedule Meeting",   path: "/meetings", color: BLUE,   icon: "📅" },
            { label: "Add Student",        path: "/students", color: "#7C3AED", icon: "👤" },
            { label: "Create Event",       path: "/events",   color: "#D97706", icon: "🎯" },
            { label: "Generate Report",    path: "/reports",  color: GREEN,  icon: "📊" },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "14px 10px", borderRadius: 10,
                border: `1.5px solid ${action.color}18`,
                background: `${action.color}06`,
                cursor: "pointer", transition: "all 0.12s",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${action.color}12`; e.currentTarget.style.borderColor = `${action.color}40`; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${action.color}06`; e.currentTarget.style.borderColor = `${action.color}18`; e.currentTarget.style.transform = ""; }}
            >
              <span style={{ fontSize: 22 }}>{action.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", textAlign: "center", lineHeight: 1.3 }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function activityColor(type: string): string {
  const map: Record<string, string> = {
    "Scheduled Meeting": "#2563EB", "Walk-In Advising": "#7C3AED", "Workshop": "#D97706",
    "Event": "#059669", "Study Hall": "#0891B2", "Scholarship Assistance": "#D4AF37",
    "Transfer Assistance": "#C1121F", "Academic Coaching": "#6366F1", "Career Coaching": "#EC4899",
    "Resource Center Visit": "#0D9488", "Computer Lab Usage": "#6B7280", "General Office Visit": "#9CA3AF",
    "Other": "#CBD5E1",
  };
  return map[type] || "#CBD5E1";
}
