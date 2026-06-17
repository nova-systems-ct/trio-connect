import { useState, useEffect } from "react";
import { getStudents, getActivities } from "../lib/db";
import type { TRIOStudent, Activity } from "../lib/types";
import { format, startOfMonth, startOfYear, differenceInDays } from "date-fns";

const CARD  = "#111827";
const CARD2 = "#1A2236";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED   = "#D72638";
const GOLD  = "#D4AF37";
const GOLD_GRAD = "linear-gradient(135deg, #FFF4B0 0%, #E6C76B 30%, #D4AF37 60%, #F7E8A4 100%)";
const BORDER = "rgba(248,250,252,0.06)";
const GREEN  = "#22C55E";

type TabId = "reports" | "compliance" | "documentation" | "audit";

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: TEXT2, marginBottom: 4 }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: TEXT3 }}>{sub}</p>}
    </div>
  );
}

type ReportStatus = "ready" | "generating" | "done";

interface Report {
  id: string;
  title: string;
  desc: string;
  category: string;
  icon: string;
  federal?: boolean;
}

const REPORTS: Report[] = [
  { id: "r01", title: "Attendance Report", desc: "All student check-in/check-out activity by date range.", category: "Attendance", icon: "📋", federal: false },
  { id: "r02", title: "Participation Report", desc: "Service types, visit frequencies, and engagement metrics.", category: "Participation", icon: "📊", federal: true },
  { id: "r03", title: "Service Hours Report", desc: "Total service hours delivered to students by advisor and type.", category: "Service", icon: "⏱", federal: true },
  { id: "r04", title: "Student Outcomes Report", desc: "GPA, credit hours, retention, and academic progress.", category: "Outcomes", icon: "🎓", federal: true },
  { id: "r05", title: "Workshop Report", desc: "Events, workshops, attendance, and topic breakdown.", category: "Events", icon: "📅", federal: false },
  { id: "r06", title: "FAFSA Completion Report", desc: "FAFSA completion status and financial aid tracking.", category: "Financial Aid", icon: "💰", federal: true },
  { id: "r07", title: "Graduation Report", desc: "Graduation rates, timelines, and degree completion data.", category: "Outcomes", icon: "🏆", federal: true },
  { id: "r08", title: "Transfer Report", desc: "Transfer intents, accepted institutions, and outcomes.", category: "Outcomes", icon: "🔄", federal: true },
  { id: "r09", title: "Retention Report", desc: "Semester-to-semester and year-to-year retention rates.", category: "Retention", icon: "📈", federal: true },
  { id: "r10", title: "Custom Report", desc: "Define your own metrics, filters, date range, and fields.", category: "Custom", icon: "⚙️", federal: false },
];

const DOC_CHECKLIST = [
  { label: "TRIO Grant Application", category: "Grant", required: true, status: "pending" as const },
  { label: "Annual Performance Report (APR)", category: "Federal", required: true, status: "pending" as const },
  { label: "GPRA Data Collection Instruments", category: "Federal", required: true, status: "pending" as const },
  { label: "Student Eligibility Documentation", category: "Compliance", required: true, status: "pending" as const },
  { label: "Needs Analysis Forms", category: "Compliance", required: true, status: "pending" as const },
  { label: "Budget Narrative & Expenditure Reports", category: "Financial", required: true, status: "pending" as const },
  { label: "Program Evaluation Reports", category: "Evaluation", required: false, status: "pending" as const },
  { label: "Consent & Release Forms (all students)", category: "Compliance", required: true, status: "pending" as const },
  { label: "Staff Credentials & Training Records", category: "HR", required: false, status: "pending" as const },
  { label: "Advisory Board Meeting Minutes", category: "Governance", required: false, status: "pending" as const },
];

const GPRA_MEASURES = [
  { label: "Persist or graduate from postsecondary education", target: 85, federal: true },
  { label: "Complete first year and return for second year", target: 80, federal: true },
  { label: "Transfer from 2-year to 4-year institution", target: 20, federal: true },
  { label: "Attain an associate degree", target: 15, federal: true },
  { label: "Attain a bachelor's degree (6-year cohort)", target: 33, federal: true },
  { label: "Students with approved financial aid", target: 90, federal: false },
];

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
      background: active ? CARD2 : "transparent",
      color: active ? TEXT : TEXT2, fontSize: 13, fontWeight: active ? 600 : 400,
      fontFamily: "'Inter', sans-serif", transition: "all 0.12s",
    }}>{label}</button>
  );
}

export default function GrantReportingPage() {
  const [tab, setTab] = useState<TabId>("reports");
  const [students, setStudents] = useState<TRIOStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reportStatus, setReportStatus] = useState<Record<string, ReportStatus>>({});
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [dateFrom, setDateFrom] = useState(format(startOfYear(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    Promise.all([getStudents(), getActivities()]).then(([s, a]) => {
      setStudents(s);
      setActivities(a);
    });
  }, []);

  async function generateReport(report: Report) {
    setReportStatus((prev) => ({ ...prev, [report.id]: "generating" }));
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
    setReportStatus((prev) => ({ ...prev, [report.id]: "done" }));
    setGenerated((prev) => ({ ...prev, [report.id]: format(new Date(), "MMM d, yyyy h:mm a") }));
  }

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const activitiesThisMonth = activities.filter((a) => a.check_in_time.slice(0, 10) >= monthStart);
  const totalServiceMins = activities.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
  const activeStudents = students.filter((s) => s.enrollment_status === "active");

  const TABS: [TabId, string][] = [["reports", "Reports"], ["compliance", "Grant Compliance"], ["documentation", "Documentation"], ["audit", "Audit Prep"]];

  const inp: React.CSSProperties = {
    background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8,
    padding: "8px 12px", fontSize: 12, color: TEXT, outline: "none",
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1080, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: "-0.7px" }}>Grant Reporting</h1>
        <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>
          Federal compliance, attendance reports, and grant performance tracking.
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Enrolled Students", value: students.length, sub: `${activeStudents.length} active` },
          { label: "Visits This Month", value: activitiesThisMonth.length, sub: "attendance records" },
          { label: "Total Service Hours", value: Math.round(totalServiceMins / 60), sub: "all time" },
          { label: "Days to Reporting", value: differenceInDays(new Date(dateFrom.slice(0, 4) + "-12-31"), new Date()), sub: "est. year-end" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "22px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</p>
            <p style={{ fontSize: 34, fontWeight: 900, color: TEXT, letterSpacing: "-1.5px", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 12, color: TEXT3, marginTop: 6 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: CARD, borderRadius: 11, padding: "4px", width: "fit-content" }}>
        {TABS.map(([id, label]) => <TabBtn key={id} label={label} active={tab === id} onClick={() => setTab(id)} />)}
      </div>

      {/* ── Reports ────────────────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Date range */}
          <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, flexShrink: 0 }}>Report Period</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inp} />
              <span style={{ fontSize: 12, color: TEXT3 }}>to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inp} />
            </div>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              {[["YTD", format(startOfYear(new Date()), "yyyy-MM-dd")], ["MTD", format(startOfMonth(new Date()), "yyyy-MM-dd")]].map(([label, from]) => (
                <button key={label} onClick={() => setDateFrom(from)} style={{
                  padding: "6px 12px", borderRadius: 7, border: `1px solid ${BORDER}`,
                  background: "none", color: TEXT3, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Report grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
            {REPORTS.map((report) => {
              const status = reportStatus[report.id];
              const genTime = generated[report.id];
              return (
                <div key={report.id} style={{
                  background: CARD, borderRadius: 13, border: `1px solid ${status === "done" ? "rgba(34,197,94,0.2)" : BORDER}`,
                  padding: "20px 22px", transition: "border-color 0.3s",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(248,250,252,0.04)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {report.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{report.title}</p>
                        {report.federal && <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 20, background: "rgba(215,38,56,0.1)", color: RED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Federal</span>}
                      </div>
                      <p style={{ fontSize: 11, color: TEXT3, lineHeight: 1.5 }}>{report.desc}</p>
                    </div>
                  </div>

                  {genTime && (
                    <p style={{ fontSize: 10, color: GREEN, marginBottom: 10 }}>✓ Generated {genTime}</p>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => generateReport(report)}
                      disabled={status === "generating"}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                        background: status === "done" ? "rgba(34,197,94,0.1)" : status === "generating" ? "rgba(248,250,252,0.04)" : RED,
                        color: status === "done" ? GREEN : status === "generating" ? TEXT3 : "#fff",
                        fontSize: 12, fontWeight: 700, cursor: status === "generating" ? "default" : "pointer",
                        fontFamily: "'Inter', sans-serif",
                      }}>
                      {status === "generating" ? "Generating…" : status === "done" ? "Regenerate" : "Generate"}
                    </button>
                    {status === "done" && (
                      <>
                        <button style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "none", color: TEXT2, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>PDF</button>
                        <button style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "none", color: TEXT2, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>CSV</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Compliance ───────────────────────────────────────────────────────── */}
      {tab === "compliance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nova gold banner */}
          <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: GOLD_GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✦</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, background: GOLD_GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as unknown as string }}>Grant Compliance Center</p>
              <p style={{ fontSize: 12, color: TEXT3 }}>GPRA measures and federal reporting requirements. Add student data to populate these metrics.</p>
            </div>
          </div>

          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "15px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>GPRA Performance Measures</p>
              <p style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>Government Performance and Results Act targets — federal requirements</p>
            </div>
            {students.length === 0 ? (
              <EmptyState icon="📊" title="No Data Available" sub="Enroll students and track outcomes to populate GPRA metrics." />
            ) : (
              GPRA_MEASURES.map((m, i) => (
                <div key={i} style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ fontSize: 12, color: TEXT2 }}>{m.label}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: TEXT3 }}>Target {m.target}%</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: TEXT3 }}>Awaiting Data</span>
                      {m.federal && <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 20, background: "rgba(215,38,56,0.1)", color: RED, textTransform: "uppercase" }}>Federal</span>}
                    </div>
                  </div>
                  <div style={{ height: 4, background: "rgba(248,250,252,0.06)", borderRadius: 10 }}>
                    <div style={{ height: "100%", width: "0%", borderRadius: 10, background: RED, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Documentation ─────────────────────────────────────────────────────── */}
      {tab === "documentation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "15px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Required Documentation</p>
                <p style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>Track all grant-required documents and compliance files</p>
              </div>
              <span style={{ fontSize: 11, color: TEXT3 }}>0 of {DOC_CHECKLIST.filter((d) => d.required).length} required complete</span>
            </div>
            {DOC_CHECKLIST.map((doc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${BORDER}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: TEXT }}>{doc.label}</p>
                  <p style={{ fontSize: 10, color: TEXT3, marginTop: 1 }}>{doc.category}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {doc.required && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: "rgba(215,38,56,0.1)", color: RED, textTransform: "uppercase" }}>Required</span>}
                  <span style={{ fontSize: 10, color: TEXT3, fontWeight: 600 }}>Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Audit Prep ────────────────────────────────────────────────────────── */}
      {tab === "audit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "28px" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Audit Preparation Center</p>
            <p style={{ fontSize: 13, color: TEXT3, marginBottom: 20, lineHeight: 1.6 }}>
              Prepare for federal TRIO program audits with organized documentation, student eligibility records,
              and program compliance reporting. This center helps you gather and organize everything auditors need.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Student Eligibility Files", desc: "First-generation, low-income, and disability documentation for all enrolled students.", status: students.length > 0 ? "Partial" : "Awaiting Data" },
                { label: "Service Documentation", desc: "Attendance logs, service types, and advisor session records.", status: activities.length > 0 ? "Partial" : "Awaiting Data" },
                { label: "Financial Expenditure Records", desc: "Budget allocation, spending by category, and year-end reconciliation.", status: "Awaiting Data" },
                { label: "Outcome Verification Data", desc: "Grades, credit hours, graduation, and transfer documentation.", status: "Awaiting Data" },
                { label: "Program Activity Log", desc: "Workshops, events, and group activities with attendance verification.", status: "Awaiting Data" },
                { label: "Staff Credentials", desc: "Advisor qualifications, training records, and professional development.", status: "Awaiting Data" },
              ].map(({ label, desc, status }) => (
                <div key={label} style={{ background: CARD2, borderRadius: 11, padding: "16px 18px", border: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{label}</p>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: status === "Partial" ? "rgba(245,158,11,0.1)" : "rgba(248,250,252,0.05)", color: status === "Partial" ? "#F59E0B" : TEXT3, textTransform: "uppercase", flexShrink: 0, marginLeft: 8 }}>{status}</span>
                  </div>
                  <p style={{ fontSize: 11, color: TEXT3, lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 12, padding: "16px 20px" }}>
            <p style={{ fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 4 }}>Audit Readiness Note</p>
            <p style={{ fontSize: 12, color: TEXT3, lineHeight: 1.6 }}>
              Begin adding students, tracking attendance, and logging service activities to automatically populate your audit documentation. All data entered into TRIO Connect is audit-trail ready.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
