import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMeetings, getActivities, getEvents, getTasks } from "../lib/db";
import type { Meeting, Activity, TRIOEvent } from "../lib/types";
import type { Task } from "../lib/db";
import { format, addDays } from "date-fns";

const CARD = "#111827";
const TEXT  = "#F8FAFC";
const TEXT3 = "#475569";
const BORDER = "rgba(248,250,252,0.06)";

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.2 }}>{icon}</div>
      <p style={{ fontSize: 13, color: TEXT3 }}>{label}</p>
    </div>
  );
}

function HubCard({
  title, subtitle, icon, stat, statLabel, color, onClick,
}: {
  title: string; subtitle: string; icon: string; stat: number;
  statLabel: string; color: string; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: CARD, borderRadius: 14, padding: "22px 24px",
        border: `1px solid ${BORDER}`, cursor: "pointer",
        transition: "all 0.15s", borderTop: `2px solid ${color}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{title}</p>
          <p style={{ fontSize: 12, color: TEXT3 }}>{subtitle}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 28, fontWeight: 900, color: stat > 0 ? TEXT : TEXT3, letterSpacing: "-0.8px", lineHeight: 1 }}>{stat}</p>
          <p style={{ fontSize: 10, color: TEXT3, marginTop: 2 }}>{statLabel}</p>
        </div>
      </div>
    </div>
  );
}

export default function OperationsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings]   = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents]       = useState<TRIOEvent[]>([]);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getMeetings(), getActivities(), getEvents(), getTasks()]).then(([m, a, ev, t]) => {
      setMeetings(m);
      setActivities(a);
      setEvents(ev);
      setTasks(t);
      setLoading(false);
    });
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const weekAhead = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const todayCheckins   = activities.filter((a) => a.check_in_time.startsWith(today));
  const todayMeetings   = meetings.filter((m) => m.meeting_date === today);
  const upcomingEvents  = events.filter((e) => e.event_date >= today && e.event_date <= weekAhead);
  const pendingTasks    = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const recentActivity  = activities.slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-0.5px" }}>Operations</h1>
        <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>
          Manage appointments, events, attendance, tasks, and program resources.
        </p>
      </div>

      {/* Hub cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <HubCard title="Attendance" subtitle="Check-in and check-out log" icon="✓" stat={todayCheckins.length} statLabel="checked in today" color="#22C55E" onClick={() => navigate("/checkin")} />
        <HubCard title="Appointments" subtitle="Schedule and manage advisor meetings" icon="📅" stat={todayMeetings.length} statLabel="today" color="#3B82F6" onClick={() => navigate("/meetings")} />
        <HubCard title="Events" subtitle="Workshops, college tours, scholarships" icon="⭐" stat={upcomingEvents.length} statLabel="this week" color="#F59E0B" onClick={() => navigate("/events")} />
        <HubCard title="Task Management" subtitle="Follow-ups, deadlines, and actions" icon="☑" stat={pendingTasks.length} statLabel="open tasks" color="#7C3AED" onClick={() => navigate("/tasks")} />
        <HubCard title="Resources" subtitle="Guides, forms, templates, and links" icon="📖" stat={0} statLabel="resources" color="#0891B2" onClick={() => navigate("/resources")} />
        <HubCard title="Documents" subtitle="Student files and program documents" icon="📄" stat={0} statLabel="files" color="#D72638" onClick={() => navigate("/documents")} />
      </div>

      {/* Recent Activity + Upcoming schedule */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Live activity feed */}
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "15px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "liveDot 2s ease-in-out infinite" }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Recent Activity</p>
            </div>
            <button onClick={() => navigate("/checkin")} style={{ fontSize: 11, color: TEXT3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>View all →</button>
          </div>
          <div>
            {loading ? null : recentActivity.length === 0 ? (
              <EmptyState icon="✓" label="No activity recorded yet." />
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3B82F6", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.student_name ?? "Unknown"}</p>
                    <p style={{ fontSize: 11, color: TEXT3 }}>{a.activity_type}</p>
                  </div>
                  <span style={{ fontSize: 10, color: TEXT3, flexShrink: 0 }}>{format(new Date(a.check_in_time), "h:mm a")}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming meetings */}
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "15px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Upcoming Appointments</p>
            <button onClick={() => navigate("/meetings")} style={{ fontSize: 11, color: TEXT3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Schedule →</button>
          </div>
          <div>
            {loading ? null : meetings.filter((m) => m.meeting_date >= today).slice(0, 6).length === 0 ? (
              <EmptyState icon="📅" label="No upcoming appointments." />
            ) : (
              meetings.filter((m) => m.meeting_date >= today).slice(0, 6).map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{m.meeting_time?.slice(0, 5)}</p>
                    <p style={{ fontSize: 9, color: TEXT3, marginTop: 1 }}>{format(new Date(m.meeting_date + "T00:00"), "MMM d")}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.student_name ?? "Student"}</p>
                    <p style={{ fontSize: 11, color: TEXT3 }}>{m.meeting_type} · {m.advisor_name?.split(" ")[0]}</p>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: m.status === "Completed" ? "rgba(34,197,94,0.12)" : "rgba(59,130,246,0.12)", color: m.status === "Completed" ? "#22C55E" : "#3B82F6", textTransform: "uppercase" }}>
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
