import { useState, useEffect } from "react";
import { getDashboardStats, getStudents, getActivities, getMeetings, getAIInsights } from "../lib/db";
import type { DashboardStats, TRIOStudent, Activity, Meeting, AIInsight } from "../lib/types";
import { format, startOfMonth } from "date-fns";

const CARD  = "#111827";
const CARD2 = "#1A2236";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED   = "#D72638";
const GOLD  = "#D4AF37";
const BORDER = "rgba(248,250,252,0.06)";
const GOLD_GRADIENT = "linear-gradient(135deg, #FFF4B0 0%, #E6C76B 30%, #D4AF37 60%, #F7E8A4 100%)";

type TabId = "overview" | "attendance" | "students" | "grants" | "ai";

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

function MetricRow({ label, value, sub, color = TEXT }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
      <div>
        <p style={{ fontSize: 13, color: TEXT2 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{sub}</p>}
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.5px" }}>{value}</p>
    </div>
  );
}

function ProgressBar({ value, color, max = 100 }: { value: number; color: string; max?: number }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div style={{ height: 6, borderRadius: 10, background: "rgba(248,250,252,0.06)" }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 10, background: color, transition: "width 0.6s ease" }} />
    </div>
  );
}

function EmptyAnalytics({ label }: { label: string }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.15 }}>📊</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: TEXT2, marginBottom: 6 }}>No Data Available</p>
      <p style={{ fontSize: 12, color: TEXT3 }}>{label}</p>
    </div>
  );
}

export default function InsightsPage() {
  const [tab, setTab]     = useState<TabId>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<TRIOStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meetings, setMeetings]  = useState<Meeting[]>([]);
  const [insights, setInsights]  = useState<AIInsight[]>([]);

  useEffect(() => {
    Promise.all([getDashboardStats(), getStudents(), getActivities(), getMeetings()]).then(([s, st, a, m]) => {
      setStats(s);
      setStudents(st);
      setActivities(a);
      setMeetings(m);
      setInsights(getAIInsights());
    });
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const actThisMonth = activities.filter((a) => a.check_in_time >= monthStart);
  const noShowRate = meetings.length > 0
    ? Math.round((meetings.filter((m) => m.status === "No Show").length / meetings.length) * 100)
    : 0;
  const activeStudents = students.filter((s) => s.enrollment_status === "active").length;
  const firstGenCount  = students.filter((s) => s.first_generation).length;
  const lowIncomeCount = students.filter((s) => s.low_income).length;

  const TABS: [TabId, string][] = [["overview", "Overview"], ["attendance", "Attendance"], ["students", "Students"], ["grants", "Grant Reporting"], ["ai", "Nova AI"]];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: "-0.5px" }}>Insights</h1>
          <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>Analytics, AI intelligence, and grant reporting.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 9, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.14)" }}>
          <span style={{ fontSize: 12 }}>✦</span>
          <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>Nova Intelligence Active</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 11, padding: "4px", width: "fit-content" }}>
        {TABS.map(([id, label]) => <TabBtn key={id} label={label} active={tab === id} onClick={() => setTab(id)} />)}
      </div>

      {/* ── Overview tab ────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          {/* Key metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[
              { label: "Total Students", value: students.length, color: TEXT },
              { label: "Active This Month", value: actThisMonth.length, color: "#22C55E" },
              { label: "Meetings This Month", value: meetings.filter((m) => m.meeting_date >= monthStart).length, color: "#3B82F6" },
              { label: "Grant Compliance", value: `${stats?.grant_compliance_score ?? 0}%`, color: stats && stats.grant_compliance_score >= 80 ? "#22C55E" : "#F59E0B" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: CARD, borderRadius: 14, padding: "20px 20px", border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT3, marginBottom: 10 }}>{label}</p>
                <p style={{ fontSize: 34, fontWeight: 900, color: students.length === 0 ? TEXT3 : color, letterSpacing: "-1px" }}>{students.length === 0 ? "—" : value}</p>
              </div>
            ))}
          </div>

          {students.length === 0 ? (
            <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}` }}>
              <EmptyAnalytics label="Enroll students to see program analytics." />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Program health */}
              <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "20px 22px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Program Health</p>
                {[
                  { label: "Student Engagement", value: stats ? Math.round((activeStudents / Math.max(students.length, 1)) * 100) : 0, color: "#3B82F6" },
                  { label: "Appointment Attendance", value: 100 - noShowRate, color: "#22C55E" },
                  { label: "Grant Compliance", value: stats?.grant_compliance_score ?? 0, color: GOLD },
                  { label: "First-Gen Served", value: students.length > 0 ? Math.round((firstGenCount / students.length) * 100) : 0, color: "#7C3AED" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontSize: 12, color: TEXT2 }}>{label}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</p>
                    </div>
                    <ProgressBar value={value} color={color} />
                  </div>
                ))}
              </div>

              {/* Student demographics */}
              <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "20px 22px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Student Demographics</p>
                <MetricRow label="Active Students" value={activeStudents} color="#22C55E" />
                <MetricRow label="First-Generation" value={firstGenCount} sub={`${students.length > 0 ? Math.round((firstGenCount / students.length) * 100) : 0}% of enrolled`} />
                <MetricRow label="Low-Income" value={lowIncomeCount} sub={`${students.length > 0 ? Math.round((lowIncomeCount / students.length) * 100) : 0}% of enrolled`} />
                <MetricRow label="Disabled" value={students.filter((s) => s.disabled).length} />
                <MetricRow label="Veteran" value={students.filter((s) => s.veteran).length} />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Attendance tab ───────────────────────────────────────────────────── */}
      {tab === "attendance" && (
        activities.length === 0 ? (
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}` }}>
            <EmptyAnalytics label="Check-in data will appear here once students begin visiting." />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "20px 22px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Activity Breakdown</p>
              {Object.entries(
                activities.reduce((acc, a) => { acc[a.activity_type] = (acc[a.activity_type] || 0) + 1; return acc; }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([type, count]) => (
                <div key={type} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <p style={{ fontSize: 12, color: TEXT2 }}>{type}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{count}</p>
                  </div>
                  <ProgressBar value={count} color="#3B82F6" max={Math.max(...Object.values(activities.reduce((a, c) => { a[c.activity_type] = (a[c.activity_type] || 0) + 1; return a; }, {} as Record<string, number>)))} />
                </div>
              ))}
            </div>
            <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "20px 22px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Attendance Summary</p>
              <MetricRow label="Total Check-Ins" value={activities.length} />
              <MetricRow label="This Month" value={actThisMonth.length} color="#22C55E" />
              <MetricRow label="Today" value={activities.filter((a) => a.check_in_time.startsWith(today)).length} />
              <MetricRow label="Avg Duration" value={`${Math.round(activities.filter((a) => a.duration_minutes).reduce((s, a) => s + (a.duration_minutes || 0), 0) / Math.max(activities.filter((a) => a.duration_minutes).length, 1))}m`} />
            </div>
          </div>
        )
      )}

      {/* ── Students tab ─────────────────────────────────────────────────────── */}
      {tab === "students" && (
        students.length === 0 ? (
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}` }}>
            <EmptyAnalytics label="Student analytics will appear once students are enrolled." />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "20px 22px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Enrollment by Program</p>
              {["TRIO SSS", "TRIO Upward Bound", "WIOA Out Of School"].map((prog) => {
                const count = students.filter((s) => s.program === prog).length;
                return (
                  <div key={prog} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <p style={{ fontSize: 12, color: TEXT2 }}>{prog}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{count}</p>
                    </div>
                    <ProgressBar value={count} color="#7C3AED" max={students.length} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "20px 22px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16 }}>At-Risk Indicators</p>
              <MetricRow label="No Activity (21+ days)" value={stats?.students_needing_attention ?? 0} color={RED} sub="Students needing outreach" />
              <MetricRow label="Low GPA (below 2.0)" value={students.filter((s) => s.gpa !== undefined && s.gpa < 2.0).length} color="#F59E0B" />
              <MetricRow label="Missing FAFSA" value="—" sub="Awaiting data" />
              <MetricRow label="No Appointments in 60 days" value="—" sub="Awaiting data" />
            </div>
          </div>
        )
      )}

      {/* ── Grants tab ───────────────────────────────────────────────────────── */}
      {tab === "grants" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* GPRA Metrics */}
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>TRIO GPRA Performance Measures</p>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "rgba(34,197,94,0.12)", color: "#22C55E", textTransform: "uppercase" }}>
                Grant Year 2025–2026
              </span>
            </div>
            {students.length === 0 ? (
              <EmptyAnalytics label="GPRA data will populate once students are enrolled and activity is logged." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { label: "Academic Standing", target: 75, actual: students.length > 0 ? Math.round((students.filter((s) => (s.gpa ?? 0) >= 2.0).length / students.length) * 100) : 0, color: "#22C55E" },
                  { label: "Persistence", target: 70, actual: stats ? Math.round((activeStudents / Math.max(students.length, 1)) * 100) : 0, color: "#3B82F6" },
                  { label: "Graduation/Transfer", target: 40, actual: Math.round((students.filter((s) => s.enrollment_status === "graduated" || s.enrollment_status === "transferred").length / Math.max(students.length, 1)) * 100), color: "#7C3AED" },
                  { label: "Received Degree", target: 30, actual: Math.round((students.filter((s) => s.enrollment_status === "graduated").length / Math.max(students.length, 1)) * 100), color: GOLD },
                  { label: "Good Academic Standing", target: 80, actual: students.length > 0 ? Math.round((students.filter((s) => (s.gpa ?? 0) >= 2.5).length / students.length) * 100) : 0, color: "#22C55E" },
                  { label: "Grant Compliance", target: 90, actual: stats?.grant_compliance_score ?? 0, color: "#F59E0B" },
                ].map(({ label, target, actual, color }) => (
                  <div key={label} style={{ background: "rgba(248,250,252,0.03)", borderRadius: 10, padding: "16px 18px" }}>
                    <p style={{ fontSize: 11, color: TEXT2, marginBottom: 8 }}>{label}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                      <p style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: "-0.5px" }}>{actual}%</p>
                      <p style={{ fontSize: 11, color: TEXT3 }}>target {target}%</p>
                    </div>
                    <ProgressBar value={actual} color={actual >= target ? "#22C55E" : actual >= target * 0.85 ? "#F59E0B" : RED} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report generator */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {[
              { title: "Annual Performance Report (APR)", desc: "Federal DOE TRIO APR submission data", icon: "🇺🇸" },
              { title: "GPRA Compliance Report", desc: "GPRA measures, targets, and actuals", icon: "📋" },
              { title: "Student Outcomes Report", desc: "Retention, transfer, graduation rates", icon: "🎓" },
              { title: "Attendance Summary", desc: "Check-in logs, service hours, visit data", icon: "📊" },
              { title: "CT State Program Report", desc: "State DOE reporting requirements", icon: "🏛️" },
              { title: "Custom Report Builder", desc: "Define your own metrics and date range", icon: "⚙️" },
            ].map((r) => (
              <ReportCard key={r.title} {...r} />
            ))}
          </div>
        </div>
      )}

      {/* ── AI tab ───────────────────────────────────────────────────────────── */}
      {tab === "ai" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nova header */}
          <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 14, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: GOLD_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✦</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>Nova Intelligence Center</p>
                <p style={{ fontSize: 12, color: "rgba(212,175,55,0.5)" }}>AI-powered analysis across all program dimensions</p>
              </div>
            </div>
            {insights.length === 0 ? (
              <p style={{ fontSize: 13, color: TEXT3 }}>No active alerts. Enroll students to activate AI analysis.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insights.map((ins) => {
                  const cfg = { risk: { c: RED, label: "Risk" }, opportunity: { c: "#22C55E", label: "Opportunity" }, info: { c: "#3B82F6", label: "Info" }, achievement: { c: GOLD, label: "Achievement" } }[ins.type];
                  const sev = ins.severity === "high" ? RED : ins.severity === "medium" ? "#F59E0B" : TEXT3;
                  return (
                    <div key={ins.id} style={{ background: "rgba(248,250,252,0.03)", border: `1px solid rgba(212,175,55,0.08)`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, background: `${cfg.c}14`, color: cfg.c, textTransform: "uppercase", flexShrink: 0, marginTop: 2 }}>{cfg.label}</span>
                      <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5, flex: 1 }}>{ins.message}</p>
                      {ins.count !== undefined && <span style={{ fontSize: 12, fontWeight: 800, color: sev, background: `${sev}14`, padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>{ins.count}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI capabilities */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { title: "Student Risk Engine", desc: "AI detects at-risk students before they drop out", icon: "⚠️", status: "active" },
              { title: "FAFSA Prediction", desc: "Predicts which students need FAFSA assistance", icon: "💰", status: "active" },
              { title: "Scholarship Matching", desc: "AI matches students to scholarship opportunities", icon: "🏆", status: "active" },
              { title: "Attendance Predictor", desc: "Forecasts attendance drops 2–3 weeks ahead", icon: "📈", status: "coming" },
              { title: "Email Drafter", desc: "AI drafts personalized outreach messages", icon: "✉️", status: "coming" },
              { title: "Grant Writer", desc: "AI generates APR narrative sections", icon: "📝", status: "coming" },
            ].map(({ title, desc, icon, status }) => (
              <div key={title} style={{ background: CARD, borderRadius: 12, border: `1px solid ${status === "active" ? "rgba(212,175,55,0.12)" : BORDER}`, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: status === "active" ? "rgba(34,197,94,0.1)" : "rgba(248,250,252,0.05)", color: status === "active" ? "#22C55E" : TEXT3, textTransform: "uppercase" }}>
                    {status === "active" ? "Active" : "Coming Soon"}
                  </span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: 12, color: TEXT3 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const generate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1400 + Math.random() * 800));
    setGenerating(false); setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div style={{ background: "#111827", border: `1px solid ${done ? "rgba(34,197,94,0.3)" : "rgba(248,250,252,0.06)"}`, borderRadius: 12, padding: "18px 20px", transition: "border-color 0.3s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>{title}</p>
      </div>
      <p style={{ fontSize: 12, color: "#475569", marginBottom: 14, lineHeight: 1.5 }}>{desc}</p>
      <button onClick={generate} disabled={generating}
        style={{ width: "100%", padding: "8px 0", borderRadius: 9, background: done ? "#22C55E" : generating ? "rgba(215,38,56,0.4)" : "#D72638", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: generating ? "wait" : "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
        {generating ? (
          <><div style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Generating…</>
        ) : done ? "✓ Ready — Download" : "Generate Report"}
      </button>
    </div>
  );
}
