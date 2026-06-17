import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { getDashboardStats, getMeetings, getActivities, getEvents, getTasks, getAIInsights } from "../lib/db";
import type { DashboardStats, Meeting, TRIOEvent, AIInsight } from "../lib/types";
import type { Task } from "../lib/db";
import { format, addDays, isPast, parseISO } from "date-fns";

const CARD = "#111827";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED  = "#D72638";
const GOLD = "#D4AF37";
const BORDER = "rgba(248,250,252,0.06)";
const GOLD_GRADIENT = "linear-gradient(135deg, #FFF4B0 0%, #E6C76B 30%, #D4AF37 60%, #F7E8A4 100%)";

function greetingWord() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ padding: "32px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 24, marginBottom: 10, opacity: 0.3 }}>{icon}</div>
      <p style={{ fontSize: 12, color: TEXT3 }}>{message}</p>
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [events, setEvents] = useState<TRIOEvent[]>([]);
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getMeetings(), getActivities(), getEvents(), getTasks()]).then(([s, m, , ev, t]) => {
      setStats(s);
      setMeetings(m);
      setEvents(ev);
      setTasks(t);
      setInsights(getAIInsights().slice(0, 4));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${BORDER}`, borderTopColor: RED, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const todayMeetings  = meetings.filter((m) => m.meeting_date === today);
  const urgentTasks    = tasks.filter((t) => t.status !== "completed" && t.priority === "High").slice(0, 5);
  const pendingTasks   = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const overdueCount   = pendingTasks.filter((t) => t.due_date && isPast(parseISO(t.due_date + "T23:59:59"))).length;
  const weekFromNow    = format(addDays(new Date(), 7), "yyyy-MM-dd");
  const upcomingEvents = events.filter((e) => e.event_date >= today && e.event_date <= weekFromNow);

  // Next 7 days for the calendar strip
  const calDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    const ds = format(d, "yyyy-MM-dd");
    return {
      date: d,
      label: i === 0 ? "Today" : format(d, "EEE"),
      dayNum: format(d, "d"),
      meetings: meetings.filter((m) => m.meeting_date === ds),
      events: events.filter((e) => e.event_date === ds),
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1200, animation: "fadeIn 0.2s ease" }}>

      {/* ── Section 1: Header ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 13, color: TEXT3, fontWeight: 500, marginBottom: 4 }}>
            {greetingWord()},
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: "-1px", lineHeight: 1.1 }}>
            {user?.full_name ?? "Welcome"}
          </h1>
          <p style={{ fontSize: 13, color: TEXT3, marginTop: 6, fontWeight: 400 }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")} · TRIO Connect Command Center
          </p>
        </div>
        <button
          onClick={() => navigate("/insights")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 10,
            background: `rgba(212,175,55,0.06)`, border: `1px solid rgba(212,175,55,0.2)`,
            cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.12s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(212,175,55,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(212,175,55,0.06)"}
        >
          <span style={{ fontSize: 13 }}>✦</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>Nova Intelligence</span>
        </button>
      </div>

      {/* ── Section 2: 4 Primary Metrics ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          {
            label: "Checked In Today",
            value: stats?.students_active_today ?? 0,
            sub: "Active right now",
            color: "#22C55E",
            path: "/checkin",
            icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
          {
            label: "Appointments Today",
            value: todayMeetings.length,
            sub: `${todayMeetings.filter((m) => m.status === "Completed").length} completed`,
            color: "#3B82F6",
            path: "/meetings",
            icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
          },
          {
            label: "Events This Week",
            value: upcomingEvents.length,
            sub: `${stats?.upcoming_events ?? 0} total upcoming`,
            color: "#F59E0B",
            path: "/events",
            icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>,
          },
          {
            label: "Need Follow-Up",
            value: stats?.students_needing_attention ?? 0,
            sub: "No activity 21+ days",
            color: RED,
            path: "/students",
            alert: (stats?.students_needing_attention ?? 0) > 0,
            icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
          },
        ].map(({ label, value, sub, color, path, icon, alert }) => (
          <div
            key={label}
            onClick={() => navigate(path)}
            style={{
              background: CARD, borderRadius: 14, padding: "22px 20px",
              border: `1px solid ${alert ? `${RED}40` : BORDER}`,
              cursor: "pointer", transition: "all 0.15s", position: "relative", overflow: "hidden",
              borderTop: `2px solid ${color}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT3 }}>{label}</p>
              <div style={{ color: alert ? RED : color, opacity: 0.7 }}>{icon}</div>
            </div>
            <p style={{ fontSize: 38, fontWeight: 900, color: alert && value > 0 ? RED : TEXT, lineHeight: 1, letterSpacing: "-1.5px", marginBottom: 6 }}>
              {value}
            </p>
            <p style={{ fontSize: 11, color: TEXT3 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Section 3 + 4: AI Briefing + Today's Priorities ─────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Nova Intelligence Briefing */}
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid rgba(212,175,55,0.15)`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid rgba(212,175,55,0.1)`, background: "rgba(212,175,55,0.04)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: GOLD_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✦</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>Nova Intelligence Briefing</p>
              <p style={{ fontSize: 10, color: "rgba(212,175,55,0.5)" }}>AI-powered program analysis · {format(new Date(), "MMM d")}</p>
            </div>
          </div>
          <div style={{ padding: "8px 12px" }}>
            {insights.length === 0 ? (
              <EmptyState icon="✦" message="No active alerts. All systems normal." />
            ) : (
              insights.map((ins) => {
                const cfg = {
                  risk:        { sym: "▲", c: RED },
                  opportunity: { sym: "◆", c: "#22C55E" },
                  info:        { sym: "●", c: "#3B82F6" },
                  achievement: { sym: "★", c: GOLD },
                }[ins.type];
                return (
                  <div key={ins.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 8px", borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 10, color: cfg.c, flexShrink: 0, marginTop: 2 }}>{cfg.sym}</span>
                    <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, flex: 1 }}>{ins.message}</p>
                    {ins.count !== undefined && <span style={{ fontSize: 11, fontWeight: 700, color: cfg.c, background: `${cfg.c}14`, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>{ins.count}</span>}
                  </div>
                );
              })
            )}
          </div>
          <div style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => navigate("/insights")} style={{ fontSize: 11, fontWeight: 600, color: GOLD, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              View full Insights →
            </button>
          </div>
        </div>

        {/* Today's Priorities */}
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Today's Priorities</p>
            <div style={{ display: "flex", gap: 8 }}>
              {overdueCount > 0 && (
                <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, background: `${RED}14`, color: RED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {overdueCount} overdue
                </span>
              )}
              <button onClick={() => navigate("/tasks")} style={{ fontSize: 11, fontWeight: 600, color: TEXT3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                View all →
              </button>
            </div>
          </div>
          <div style={{ padding: "8px 12px" }}>
            {urgentTasks.length === 0 ? (
              <EmptyState icon="✓" message="No urgent tasks. You're all caught up." />
            ) : (
              urgentTasks.map((task) => {
                const isOverdue = task.due_date && isPast(parseISO(task.due_date + "T23:59:59"));
                return (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 8px", borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: isOverdue ? RED : "#F59E0B", flexShrink: 0, marginTop: 5 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, lineHeight: 1.4 }}>{task.title}</p>
                      {task.due_date && (
                        <p style={{ fontSize: 10, color: isOverdue ? RED : TEXT3, marginTop: 2 }}>
                          {isOverdue ? "Overdue — " : "Due "}{format(parseISO(task.due_date), "MMM d")}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${RED}14`, color: RED, textTransform: "uppercase", flexShrink: 0 }}>
                      {task.priority}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => navigate("/tasks")}
              style={{ fontSize: 11, fontWeight: 600, color: RED, background: `${RED}0A`, border: `1px solid ${RED}20`, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              + New Task
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 5: Upcoming Calendar ─────────────────────────────────────── */}
      <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Upcoming Calendar</p>
          <button onClick={() => navigate("/operations")} style={{ fontSize: 11, fontWeight: 600, color: TEXT3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Full calendar →
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
          {calDays.map((day, i) => {
            const isToday = i === 0;
            const totalItems = day.meetings.length + day.events.length;
            return (
              <div key={i}
                style={{
                  padding: "16px 10px 14px",
                  borderRight: i < 6 ? `1px solid ${BORDER}` : "none",
                  background: isToday ? "rgba(215,38,56,0.04)" : "transparent",
                  cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(248,250,252,0.03)"}
                onMouseLeave={(e) => e.currentTarget.style.background = isToday ? "rgba(215,38,56,0.04)" : "transparent"}
                onClick={() => navigate("/operations")}
              >
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: isToday ? RED : TEXT3, marginBottom: 6 }}>
                  {day.label}
                </p>
                <p style={{ fontSize: 24, fontWeight: 900, color: isToday ? RED : TEXT, letterSpacing: "-1px", marginBottom: 10, lineHeight: 1 }}>
                  {day.dayNum}
                </p>
                {totalItems === 0 ? (
                  <p style={{ fontSize: 10, color: TEXT3 }}>—</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {day.meetings.slice(0, 2).map((m) => (
                      <div key={m.id} style={{ fontSize: 10, color: "#3B82F6", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", background: "rgba(59,130,246,0.08)", padding: "2px 5px", borderRadius: 4 }}>
                        {m.meeting_time?.slice(0, 5)} {m.student_name?.split(" ")[0]}
                      </div>
                    ))}
                    {day.events.slice(0, 1).map((e) => (
                      <div key={e.id} style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", background: "rgba(245,158,11,0.08)", padding: "2px 5px", borderRadius: 4 }}>
                        {e.title}
                      </div>
                    ))}
                    {totalItems > 3 && <p style={{ fontSize: 9, color: TEXT3 }}>+{totalItems - 3} more</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
