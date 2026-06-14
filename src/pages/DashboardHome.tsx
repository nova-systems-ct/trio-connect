import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { getDashboardStats, getMeetings, getActivities, getNotifications, markNotificationRead } from "../lib/db";
import type { DashboardStats, Meeting, Activity, Notification } from "../lib/types";
import { format } from "date-fns";

const NAVY      = "#1B3A6B";
const GOLD      = "#C5A028";
const CARD_DARK = "#1E293B";

function StatCard({ label, value, sub, color = CARD_DARK, onClick }: { label: string; value: string | number; sub: string; color?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: color, borderRadius: 12, padding: "20px 22px", color: "#fff", position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default" }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{sub}</p>
    </div>
  );
}

function MeetingBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Scheduled":  { bg: "#EFF6FF", color: "#1D4ED8" },
    "Checked In": { bg: "#ECFDF5", color: "#059669" },
    "Completed":  { bg: "#F0FDF4", color: "#16A34A" },
    "No Show":    { bg: "#FEF2F2", color: "#DC2626" },
    "Cancelled":  { bg: "#F8FAFC", color: "#64748B" },
    "Rescheduled":{ bg: "#FFFBEB", color: "#D97706" },
  };
  const s = map[status] || map["Scheduled"];
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color }}>{status}</span>;
}

function ActivityTypeDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    "Scheduled Meeting": "#3B82F6", "Walk-In Advising": "#8B5CF6", "Workshop": "#F59E0B",
    "Event": "#10B981", "Study Hall": "#06B6D4", "Scholarship Assistance": "#GOLD",
    "Transfer Assistance": "#EF4444", "Academic Coaching": "#6366F1", "Career Coaching": "#EC4899",
    "Resource Center Visit": "#14B8A6", "Computer Lab Usage": "#64748B", "General Office Visit": "#94A3B8",
    "Other": "#CBD5E1",
  };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[type] || "#CBD5E1", display: "inline-block", flexShrink: 0 }} />;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]             = useState<DashboardStats | null>(null);
  const [meetings, setMeetings]       = useState<Meeting[]>([]);
  const [activities, setActivities]   = useState<Activity[]>([]);
  const [notifications, setNotifs]    = useState<Notification[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getMeetings(user?.role === "advisor" ? user.id : undefined),
      getActivities(),
      user ? getNotifications(user.id) : Promise.resolve([]),
    ]).then(([s, m, a, n]) => {
      setStats(s);
      setMeetings(m.slice(0, 5));
      setActivities(a.slice(0, 8));
      setNotifs(n.filter((x) => !x.is_read).slice(0, 5));
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div style={{ color: "#94A3B8", padding: 40, textAlign: "center" }}>Loading dashboard…</div>;

  const now = new Date();
  const todayMeetings = meetings.filter((m) => m.meeting_date === now.toISOString().split("T")[0]);
  const upcomingMeetings = meetings.filter((m) => m.meeting_date >= now.toISOString().split("T")[0]).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 2 }}>Welcome back,</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>{user?.full_name}</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2, textTransform: "capitalize" }}>{user?.role} · {format(now, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <button onClick={() => navigate("/checkin")}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 10, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Check In Student
        </button>
      </div>

      {/* Unread notifications */}
      {notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notifications.map((n) => (
            <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: n.type === "warning" ? "#FFFBEB" : "#F0F9FF", border: `1px solid ${n.type === "warning" ? "#FDE68A" : "#BAE6FD"}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.type === "warning" ? "#F59E0B" : "#3B82F6", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{n.title}</span>
                <span style={{ fontSize: 12, color: "#64748B", marginLeft: 8 }}>{n.message}</span>
              </div>
              <button onClick={() => { markNotificationRead(n.id); setNotifs((p) => p.filter((x) => x.id !== n.id)); }}
                style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Stats grid */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Total Students" value={stats.total_students} sub={`${stats.active_students} active`} color={NAVY} onClick={() => navigate("/students")} />
          <StatCard label="Activities This Month" value={stats.total_activities_this_month} sub="Interactions logged" color={CARD_DARK} onClick={() => navigate("/reports")} />
          <StatCard label="Meetings This Week" value={stats.meetings_this_week} sub="Scheduled & completed" color={CARD_DARK} onClick={() => navigate("/meetings")} />
          <StatCard label="Upcoming Events" value={stats.upcoming_events} sub="Workshops & sessions" color={CARD_DARK} onClick={() => navigate("/events")} />
        </div>
      )}

      {/* Second row stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="No-Show Rate" value={`${stats.no_show_rate}%`} sub="Of all meetings" color={stats.no_show_rate > 20 ? "#B91C1C" : CARD_DARK} />
          <StatCard label="Avg Activities / Student" value={stats.avg_activities_per_student} sub="Per enrolled student" color={CARD_DARK} />
          <StatCard label="Need Attention" value={stats.students_needing_attention} sub="No activity 21+ days" color={stats.students_needing_attention > 5 ? "#92400E" : CARD_DARK} onClick={() => navigate("/students")} />
          <StatCard label="Today's Meetings" value={todayMeetings.length} sub="Scheduled for today" color={CARD_DARK} onClick={() => navigate("/meetings")} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Upcoming Meetings */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Upcoming Meetings</h2>
            <button onClick={() => navigate("/meetings")} style={{ fontSize: 12, color: NAVY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View All</button>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p style={{ fontSize: 13, color: "#94A3B8", padding: "20px 0", textAlign: "center" }}>No upcoming meetings</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingMeetings.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{m.student_name?.split(" ").slice(0,2).map((n) => n[0]).join("") || "??"}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.student_name}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>{m.meeting_type} · {m.meeting_time} · {format(new Date(m.meeting_date), "MMM d")}</p>
                  </div>
                  <MeetingBadge status={m.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Recent Activity</h2>
            <button onClick={() => navigate("/checkin")} style={{ fontSize: 12, color: NAVY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Log Activity</button>
          </div>
          {activities.length === 0 ? (
            <p style={{ fontSize: 13, color: "#94A3B8", padding: "20px 0", textAlign: "center" }}>No recent activity</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activities.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "#F8FAFC" }}>
                  <ActivityTypeDot type={a.activity_type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.student_name}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>{a.activity_type}</p>
                  </div>
                  <span style={{ fontSize: 10, color: "#CBD5E1", flexShrink: 0 }}>
                    {format(new Date(a.check_in_time), "MMM d h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 22px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "Check In", path: "/checkin", color: "#10B981", icon: "✓" },
            { label: "Schedule Meeting", path: "/meetings", color: "#3B82F6", icon: "📅" },
            { label: "Add Student", path: "/students", color: NAVY, icon: "👤" },
            { label: "Create Event", path: "/events", color: "#8B5CF6", icon: "🎪" },
            { label: "Run Report", path: "/reports", color: GOLD, icon: "📊" },
          ].map((action) => (
            <button key={action.path} onClick={() => navigate(action.path)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 12px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#FAFAFA", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.borderColor = action.color; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FAFAFA"; e.currentTarget.style.borderColor = "#E2E8F0"; }}>
              <span style={{ fontSize: 22 }}>{action.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
