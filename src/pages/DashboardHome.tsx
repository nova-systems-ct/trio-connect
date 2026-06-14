import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import {
  getDashboardStats, getMeetings, getActivities,
  getNotifications, markNotificationRead, getAIInsights, getEvents,
} from "../lib/db";
import type { DashboardStats, Meeting, Activity, Notification, AIInsight, TRIOEvent } from "../lib/types";
import { format } from "date-fns";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg1: "#0B0B0B", bg2: "#111111", bg3: "#151515", card: "#1B1B1B",
  text1: "#FFFFFF", text2: "#A0A0A0", text3: "#606060",
  red: "#C1121F", redDim: "rgba(193,18,31,0.12)",
  gold: "#D4AF37", goldDim: "rgba(212,175,55,0.12)",
  green: "#22C55E", greenDim: "rgba(34,197,94,0.10)",
  blue: "#3B82F6", blueDim: "rgba(59,130,246,0.10)",
  amber: "#F59E0B", purple: "#7C3AED",
  border: "rgba(255,255,255,0.07)",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color, icon, onClick, alert = false }: {
  label: string; value: string | number; sub: string; color: string;
  icon: ReactNode; onClick?: () => void; alert?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, borderRadius: 14, padding: "18px 20px",
        border: `1px solid ${alert ? `rgba(193,18,31,0.35)` : C.border}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s", position: "relative", overflow: "hidden",
        boxShadow: alert ? "0 0 0 1px rgba(193,18,31,0.2)" : "none",
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = alert ? "rgba(193,18,31,0.35)" : C.border; e.currentTarget.style.transform = ""; }}
    >
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: alert ? C.red : color }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3 }}>{label}</p>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${alert ? C.red : color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: alert ? C.red : color }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: alert ? C.red : C.text1, letterSpacing: "-1px", marginBottom: 5 }}>{value}</p>
      <p style={{ fontSize: 11, color: C.text3, fontWeight: 500 }}>{sub}</p>
    </div>
  );
}

// ── AI Insight Row ─────────────────────────────────────────────────────────────
function InsightRow({ insight, navigate }: { insight: AIInsight; navigate: (p: string) => void }) {
  const cfg = {
    risk:        { sym: "▲", color: C.red,  bg: C.redDim },
    opportunity: { sym: "◆", color: C.green, bg: C.greenDim },
    info:        { sym: "●", color: C.blue,  bg: C.blueDim },
    achievement: { sym: "★", color: C.gold,  bg: C.goldDim },
  }[insight.type];
  const sev = insight.severity === "high" ? C.red : insight.severity === "medium" ? C.amber : C.text3;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, color: cfg.color }}>
        {cfg.sym}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: C.text1, fontWeight: 500, lineHeight: 1.4 }}>{insight.message}</p>
      </div>
      {insight.count !== undefined && (
        <span style={{ fontSize: 12, fontWeight: 800, color: sev, background: `${sev}14`, padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>{insight.count}</span>
      )}
      {insight.action_label && insight.action_path && (
        <button
          onClick={() => navigate(insight.action_path!)}
          style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, color: C.text2, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", transition: "all 0.1s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}
        >
          {insight.action_label} →
        </button>
      )}
    </div>
  );
}

// ── Quick Action Button ───────────────────────────────────────────────────────
function QABtn({ label, icon, color, onClick }: { label: string; icon: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9,
        padding: "18px 10px", borderRadius: 12,
        background: `${color}0A`, border: `1.5px solid ${color}20`,
        cursor: "pointer", transition: "all 0.12s",
        fontFamily: "'Inter', sans-serif",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${color}16`; e.currentTarget.style.borderColor = `${color}45`; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${color}0A`; e.currentTarget.style.borderColor = `${color}20`; e.currentTarget.style.transform = ""; }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.text2, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

// ── Activity color ────────────────────────────────────────────────────────────
function actColor(type: string) {
  const m: Record<string, string> = {
    "Scheduled Meeting": C.blue, "Walk-In Advising": C.purple, "Workshop": C.amber,
    "Event": C.green, "Study Hall": "#0891B2", "Scholarship Assistance": C.gold,
    "Transfer Assistance": C.red, "Academic Coaching": "#6366F1", "Career Coaching": "#EC4899",
    "Resource Center Visit": "#0D9488", "Computer Lab Usage": C.text3, "General Office Visit": "#404040",
  };
  return m[type] || "#404040";
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    "Scheduled":   ["rgba(59,130,246,0.14)", "#3B82F6"],
    "Checked In":  ["rgba(34,197,94,0.14)",  "#22C55E"],
    "Completed":   ["rgba(34,197,94,0.10)",  "#16A34A"],
    "No Show":     ["rgba(193,18,31,0.14)",  "#C1121F"],
    "Cancelled":   ["rgba(255,255,255,0.07)", "#606060"],
    "Rescheduled": ["rgba(245,158,11,0.14)", "#F59E0B"],
  };
  const [bg, color] = m[status] ?? m["Scheduled"];
  return <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, background: bg, color, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{status}</span>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [meetings, setMeetings]     = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents]         = useState<TRIOEvent[]>([]);
  const [notifications, setNotifs]  = useState<Notification[]>([]);
  const [insights, setInsights]     = useState<AIInsight[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getMeetings(user?.role === "advisor" ? user.id : undefined),
      getActivities(),
      getEvents(),
      user ? getNotifications(user.id) : Promise.resolve([]),
    ]).then(([s, m, a, ev, n]) => {
      setStats(s);
      setMeetings(m);
      setActivities(a.slice(0, 12));
      setEvents(ev);
      setNotifs(n.filter((x) => !x.is_read).slice(0, 3));
      setInsights(getAIInsights());
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.red, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ fontSize: 11, fontWeight: 800, color: C.text3, letterSpacing: "0.1em" }}>LOADING DASHBOARD…</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayMeetings = meetings.filter((m) => m.meeting_date === today).sort((a, b) => a.meeting_time.localeCompare(b.meeting_time));
  const upcomingMeetings = meetings.filter((m) => m.meeting_date >= today).slice(0, 8);
  const todayActivities = activities.filter((a) => a.check_in_time.startsWith(today));
  const recentActivities = activities.slice(0, 10);

  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const eventsThisWeek = events.filter((e) => e.event_date >= today && e.event_date <= weekFromNow).length;

  const hoursToday = +(todayActivities.reduce((s, a) => s + (a.duration_minutes || 0), 0) / 60).toFixed(1);

  const appointmentsToday = todayMeetings.length;

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 17 ? "Good afternoon" : "Good evening";

  const highInsights = insights.filter((i) => i.severity === "high" || i.severity === "medium");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.25s ease both" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, color: C.text3, fontWeight: 500, marginBottom: 3 }}>{greeting},</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text1, letterSpacing: "-0.8px", lineHeight: 1.1 }}>
            {user?.full_name?.split(" ")[0] ?? "Welcome"}
          </h1>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 5 }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")} · TRIO Connect Command Center
          </p>
        </div>
        {/* Grant compliance + Program health */}
        <div style={{ display: "flex", gap: 12 }}>
          {stats && (
            <div style={{ background: C.card, borderRadius: 12, padding: "14px 20px", border: `1px solid ${C.border}`, textAlign: "center", borderTop: `2px solid ${C.gold}` }}>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, marginBottom: 5 }}>Grant Compliance</p>
              <p style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.5px", color: (stats.grant_compliance_score ?? 0) >= 80 ? C.green : C.amber, marginBottom: 3 }}>
                {stats.grant_compliance_score ?? 0}<span style={{ fontSize: 12, color: C.text3 }}>/100</span>
              </p>
              <p style={{ fontSize: 10, color: C.text3 }}>
                {(stats.grant_compliance_score ?? 0) >= 80 ? "✓ Strong" : "Needs Attention"}
              </p>
            </div>
          )}
          <button
            onClick={() => navigate("/ai-center")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "0 18px", borderRadius: 12,
              background: C.goldDim, border: `1px solid rgba(212,175,55,0.25)`,
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.goldDim; }}
          >
            <span style={{ fontSize: 16 }}>✦</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>AI Center</p>
              <p style={{ fontSize: 10, color: "rgba(212,175,55,0.6)" }}>{highInsights.length} active alerts</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Unread notifications ─────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notifications.map((n) => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
              borderRadius: 10, background: C.card,
              border: `1px solid ${n.type === "warning" ? "rgba(245,158,11,0.3)" : n.type === "error" ? "rgba(193,18,31,0.3)" : "rgba(59,130,246,0.3)"}`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: n.type === "warning" ? C.amber : n.type === "error" ? C.red : C.blue }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{n.title}</span>
                <span style={{ fontSize: 12, color: C.text2, marginLeft: 8 }}>{n.message}</span>
              </div>
              <button onClick={() => { markNotificationRead(n.id); setNotifs((p) => p.filter((x) => x.id !== n.id)); }} style={{ color: C.text3, background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* ── TOP METRICS ROW (6 cards) ────────────────────────────────────── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          <MetricCard
            label="Active Students" value={stats.active_students}
            sub={`${stats.total_students} total enrolled`}
            color={C.blue} onClick={() => navigate("/students")}
            icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          />
          <MetricCard
            label="Present Today" value={stats.students_active_today ?? 0}
            sub="Checked in · live"
            color={C.green} onClick={() => navigate("/checkin")}
            icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <MetricCard
            label="Appointments Today" value={appointmentsToday}
            sub={`${todayMeetings.filter((m) => m.status === "Completed").length} completed`}
            color={C.purple} onClick={() => navigate("/meetings")}
            icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
          />
          <MetricCard
            label="Events This Week" value={eventsThisWeek}
            sub={`${stats.upcoming_events} total upcoming`}
            color={C.amber} onClick={() => navigate("/events")}
            icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>}
          />
          <MetricCard
            label="Hours Today" value={hoursToday}
            sub="Service hours logged"
            color="#0891B2"
            icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <MetricCard
            label="Need Follow-Up" value={stats.students_needing_attention}
            sub="No activity 21+ days"
            color={C.red} alert={stats.students_needing_attention > 5}
            onClick={() => navigate("/students")}
            icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          />
        </div>
      )}

      {/* ── AI DAILY BRIEFING + QUICK ACTIONS ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>

        {/* AI Daily Briefing */}
        <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid rgba(212,175,55,0.2)` }}>
          {/* Gold header */}
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #1a1100 0%, #2D1F00 40%, #3D2B00 70%, #2D1F00 100%)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #F9E27D, #D4AF37)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 8px rgba(212,175,55,0.4)" }}>✦</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#FFF4B0", letterSpacing: "-0.2px" }}>AI Daily Briefing</p>
                <p style={{ fontSize: 10, color: "rgba(249,226,125,0.55)", marginTop: 1 }}>Nova Systems Intelligence · {format(new Date(), "MMMM d, yyyy")}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(249,226,125,0.1)", border: "1px solid rgba(249,226,125,0.2)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#F9E27D", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#F9E27D", letterSpacing: "0.1em", textTransform: "uppercase" }}>Live Analysis</span>
            </div>
          </div>
          {/* Insights body */}
          <div style={{ background: "linear-gradient(180deg, #1E1500 0%, #111100 100%)", padding: "4px 20px 4px" }}>
            {insights.length === 0 ? (
              <p style={{ color: C.text3, fontSize: 13, padding: "20px 0" }}>No active insights.</p>
            ) : (
              insights.map((insight) => <InsightRow key={insight.id} insight={insight} navigate={navigate} />)
            )}
          </div>
          <div style={{ background: "#0E0B00", padding: "12px 20px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => navigate("/ai-center")} style={{ fontSize: 12, fontWeight: 700, color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              View Full AI Center →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: C.card, borderRadius: 16, padding: "18px 16px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3 }}>Quick Actions</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
            <QABtn label="New Appointment" icon="📅" color={C.purple} onClick={() => navigate("/meetings")} />
            <QABtn label="Create Event" icon="🎯" color={C.amber} onClick={() => navigate("/events")} />
            <QABtn label="Send Message" icon="✉️" color={C.blue} onClick={() => navigate("/messages")} />
            <QABtn label="Find Student" icon="🔍" color={C.green} onClick={() => navigate("/students")} />
            <QABtn label="Run Report" icon="📊" color="#0891B2" onClick={() => navigate("/reports")} />
            <QABtn label="Check In" icon="✓" color={C.red} onClick={() => navigate("/checkin")} />
          </div>
        </div>
      </div>

      {/* ── LIVE ACTIVITY + TODAY'S APPOINTMENTS ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Live Activity Feed */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, boxShadow: `0 0 0 0 ${C.red}80`, animation: "liveDot 2s ease-in-out infinite" }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Live Activity Feed</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.red, background: C.redDim, padding: "3px 9px", borderRadius: 20 }}>{todayActivities.length} today</span>
              <button onClick={() => navigate("/checkin")} style={{ fontSize: 11, color: C.text3, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all →</button>
            </div>
          </div>
          <div style={{ padding: "6px 8px" }}>
            {recentActivities.length === 0 ? (
              <p style={{ fontSize: 13, color: C.text3, padding: "24px", textAlign: "center" }}>No activity logged yet</p>
            ) : (
              recentActivities.map((a) => {
                const isToday = a.check_in_time.startsWith(today);
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, background: isToday ? "rgba(255,255,255,0.03)" : "none", marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: actColor(a.activity_type), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.student_name}</p>
                      <p style={{ fontSize: 10, color: C.text3 }}>{a.activity_type}</p>
                    </div>
                    {a.duration_minutes && <span style={{ fontSize: 10, color: C.text3, flexShrink: 0 }}>{a.duration_minutes}m</span>}
                    <span style={{ fontSize: 10, color: C.text3, flexShrink: 0 }}>{format(new Date(a.check_in_time), "h:mm a")}</span>
                    {isToday && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Today's Appointments */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Today's Appointments</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, background: "rgba(255,255,255,0.07)", padding: "3px 9px", borderRadius: 20 }}>
                {todayMeetings.length} scheduled
              </span>
              <button onClick={() => navigate("/meetings")} style={{ fontSize: 11, color: C.text3, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all →</button>
            </div>
          </div>
          <div style={{ padding: "6px 8px" }}>
            {(todayMeetings.length > 0 ? todayMeetings : upcomingMeetings).length === 0 ? (
              <p style={{ fontSize: 13, color: C.text3, padding: "24px", textAlign: "center" }}>No appointments scheduled today</p>
            ) : (
              (todayMeetings.length > 0 ? todayMeetings : upcomingMeetings).slice(0, 8).map((m, i) => {
                const isPast = m.meeting_date < today || (m.meeting_date === today && m.meeting_time < format(new Date(), "HH:mm"));
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "none", marginBottom: 2, opacity: isPast && m.status === "Completed" ? 0.55 : 1 }}>
                    <div style={{ width: 38, flexShrink: 0, textAlign: "center" }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: C.text1, lineHeight: 1 }}>{m.meeting_time.slice(0, 5)}</p>
                      <p style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>{format(new Date(m.meeting_date + "T00:00"), "MMM d")}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.student_name}</p>
                      <p style={{ fontSize: 10, color: C.text3 }}>{m.meeting_type} · {m.advisor_name?.split(" ")[1] ?? m.advisor_name}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                );
              })
            )}
          </div>
          {upcomingMeetings.length > 0 && todayMeetings.length === 0 && (
            <div style={{ padding: "8px 18px 14px" }}>
              <p style={{ fontSize: 11, color: C.text3 }}>Showing upcoming appointments</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Program Health Bar ───────────────────────────────────────────── */}
      {stats && (
        <div style={{ background: C.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Program Health Overview</h2>
            <button onClick={() => navigate("/reports")} style={{ fontSize: 11, color: C.text3, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Full Report →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {[
              { label: "Student Engagement", value: Math.round((stats.active_students / Math.max(stats.total_students, 1)) * 100), color: C.blue },
              { label: "Attendance Rate", value: 100 - (stats.no_show_rate ?? 0), color: C.green },
              { label: "Avg Visits/Student", value: Math.min(Math.round((stats.avg_activities_per_student ?? 0) / 5 * 100), 100), color: C.purple },
              { label: "Event Participation", value: Math.round((stats.students_active_today / Math.max(stats.active_students, 1)) * 100), color: C.amber },
              { label: "Grant Compliance", value: stats.grant_compliance_score ?? 0, color: C.gold },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <p style={{ fontSize: 10, color: C.text3, fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: 10, fontWeight: 800, color }}>{value}%</p>
                </div>
                <div style={{ height: 5, borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ height: "100%", width: `${value}%`, borderRadius: 10, background: color, transition: "width 0.6s ease", maxWidth: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
