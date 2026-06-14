import { useState, useEffect } from "react";
import { getStudents, getAIInsights, getMeetings } from "../lib/db";
import type { TRIOStudent, AIInsight, Meeting } from "../lib/types";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";

const C = {
  card: "#1B1B1B", card2: "#151515", text1: "#FFFFFF", text2: "#A0A0A0", text3: "#606060",
  red: "#C1121F", redDim: "rgba(193,18,31,0.12)",
  gold: "#D4AF37", goldDim: "rgba(212,175,55,0.12)",
  green: "#22C55E", greenDim: "rgba(34,197,94,0.10)",
  blue: "#3B82F6", blueDim: "rgba(59,130,246,0.10)",
  amber: "#F59E0B", amberDim: "rgba(245,158,11,0.10)",
  purple: "#7C3AED", border: "rgba(255,255,255,0.07)",
};

type AITab = "insights" | "at-risk" | "recommendations" | "email-assist";

const INSIGHT_CONFIG = {
  risk:        { icon: "▲", label: "Risk Alert",    color: C.red,    dim: C.redDim },
  opportunity: { icon: "◆", label: "Opportunity",   color: C.green,  dim: C.greenDim },
  info:        { icon: "●", label: "Information",   color: C.blue,   dim: C.blueDim },
  achievement: { icon: "★", label: "Achievement",   color: C.gold,   dim: C.goldDim },
} as const;

const EMAIL_TEMPLATES = [
  {
    label: "At-Risk Outreach",
    subject: "We're Here to Support You — Let's Connect",
    body: `Dear [Student Name],

We've noticed that you haven't visited TRIO recently, and we want to make sure everything is going well on your academic journey.

TRIO is here to support you — whether you need help with financial aid, academic advising, transfer planning, or just someone to talk to.

Please schedule a meeting with your advisor at your earliest convenience. We have flexible office hours and virtual options available.

We believe in you and your success.

Warm regards,
[Advisor Name]
TRIO Connect — Student Success Program`,
  },
  {
    label: "Appointment Reminder",
    subject: "Reminder: Your TRIO Advising Appointment",
    body: `Dear [Student Name],

This is a friendly reminder that you have a scheduled advising appointment:

📅 Date: [Date]
⏰ Time: [Time]
📍 Location: [Location]

If you need to reschedule, please contact us at least 24 hours in advance. We look forward to seeing you!

Best,
[Advisor Name]
TRIO Success Program`,
  },
  {
    label: "Scholarship Invitation",
    subject: "Scholarship Opportunity Matched to Your Profile",
    body: `Dear [Student Name],

Great news! Based on your academic profile, you may be eligible for the following scholarship opportunity:

🎓 [Scholarship Name]
💰 Award Amount: $[Amount]
📅 Deadline: [Deadline]

Requirements: [Requirements]

Please schedule an appointment with your advisor to discuss next steps and receive assistance with your application.

Don't miss this opportunity!

Best regards,
[Advisor Name]
TRIO Connect`,
  },
  {
    label: "Event Invitation",
    subject: "You're Invited: [Event Name] — TRIO Connect",
    body: `Dear [Student Name],

We're excited to invite you to an upcoming TRIO event:

🎯 [Event Name]
📅 Date: [Date]
⏰ Time: [Time]
📍 Location: [Location]

This event is designed specifically for TRIO students and will cover [description]. Past attendees have found it extremely valuable for [benefit].

Registration is limited — please RSVP by [date].

We hope to see you there!

TRIO Connect Team`,
  },
  {
    label: "FAFSA Renewal",
    subject: "Action Required: FAFSA Renewal Deadline Approaching",
    body: `Dear [Student Name],

This is an important reminder that the FAFSA renewal deadline is approaching on [date].

Completing your FAFSA on time is critical to maintaining your financial aid for the upcoming academic year. Missing the deadline could affect your eligibility.

TRIO advisors are available to assist you with the FAFSA process:
• Walk-in hours: [Days/Times]
• Appointments available: [Link or Contact]

Please don't wait — schedule your FAFSA assistance session today.

TRIO Connect Financial Aid Support`,
  },
];

function RiskStudentCard({ student }: { student: TRIOStudent }) {
  const days = student.last_activity ? differenceInDays(new Date(), new Date(student.last_activity)) : 999;
  const level = days > 30 ? "High" : days > 14 ? "Medium" : "Low";
  const levelColor = level === "High" ? C.red : level === "Medium" ? C.amber : C.green;
  return (
    <div style={{ padding: "13px 16px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: C.redDim, border: `1.5px solid rgba(193,18,31,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.red }}>{student.full_name.split(" ").slice(0,2).map((n) => n[0]).join("")}</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{student.full_name}</p>
        <p style={{ fontSize: 11, color: C.text3 }}>{student.advisor_name ?? "Unassigned"} · {student.program}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: levelColor }}>{days === 999 ? "Never" : `${days}d ago`}</p>
        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 12, background: `${levelColor}12`, color: levelColor }}>{level} Risk</span>
      </div>
    </div>
  );
}

export default function AICenterPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AITab>("insights");
  const [students, setStudents] = useState<TRIOStudent[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [insights] = useState<AIInsight[]>(getAIInsights());
  const [loading, setLoading] = useState(true);
  const [emailTemplate, setEmailTemplate] = useState(EMAIL_TEMPLATES[0]);
  const [editedEmail, setEditedEmail] = useState({ subject: EMAIL_TEMPLATES[0].subject, body: EMAIL_TEMPLATES[0].body });
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    Promise.all([getStudents(), getMeetings()]).then(([s, m]) => {
      setStudents(s); setMeetings(m); setLoading(false);
    });
  }, []);

  const atRiskStudents = students.filter((s) => {
    if (s.enrollment_status !== "active") return false;
    const days = s.last_activity ? differenceInDays(new Date(), new Date(s.last_activity)) : 999;
    return days > 14;
  }).sort((a, b) => {
    const da = a.last_activity ? differenceInDays(new Date(), new Date(a.last_activity)) : 999;
    const db = b.last_activity ? differenceInDays(new Date(), new Date(b.last_activity)) : 999;
    return db - da;
  });

  const noShows = meetings.filter((m) => m.status === "No Show");
  const missingFafsa = students.filter((s) => s.low_income && s.enrollment_status === "active").slice(0, 12);
  const scholarshipCandidates = students.filter((s) => (s.gpa ?? 0) >= 3.0 && s.first_generation).slice(0, 8);

  function selectTemplate(t: typeof EMAIL_TEMPLATES[0]) {
    setEmailTemplate(t);
    setEditedEmail({ subject: t.subject, body: t.body });
  }

  function copyEmail() {
    navigator.clipboard.writeText(`Subject: ${editedEmail.subject}\n\n${editedEmail.body}`).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    });
  }

  const TABS: { id: AITab; label: string; icon: string }[] = [
    { id: "insights",       label: "AI Insights",      icon: "✦" },
    { id: "at-risk",        label: "At-Risk Students",  icon: "▲" },
    { id: "recommendations",label: "Recommendations",   icon: "◆" },
    { id: "email-assist",   label: "Email Assistant",   icon: "✉" },
  ];

  if (loading) return <div style={{ color: C.text3, padding: 40, textAlign: "center" }}>Loading AI Center…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.25s ease both" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: C.goldDim, border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 15, color: C.gold }}>✦</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text1, letterSpacing: "-0.5px" }}>AI Center</h1>
        </div>
        <p style={{ fontSize: 13, color: C.text3, marginLeft: 42 }}>Nova Systems Intelligence · Real-time student insights and recommendations</p>
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "At-Risk Students",      value: atRiskStudents.length, color: C.red,    icon: "⚠" },
          { label: "No-Show Alerts",        value: noShows.length,        color: C.amber,  icon: "⏰" },
          { label: "Scholarship Matches",   value: scholarshipCandidates.length, color: C.gold, icon: "◆" },
          { label: "FAFSA Follow-Ups",      value: missingFafsa.length,   color: C.blue,   icon: "📋" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: C.card, borderRadius: 12, padding: "16px", border: `1px solid ${C.border}`, borderTop: `2px solid ${color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14, color }}>{icon}</span>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.text3 }}>{label}</p>
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: C.text1, letterSpacing: "-1px" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 6, padding: "4px", background: C.card2, borderRadius: 12, width: "fit-content", border: `1px solid ${C.border}` }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 9, border: "none",
            background: tab === t.id ? C.card : "transparent",
            color: tab === t.id ? C.text1 : C.text3,
            fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
            cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.1s",
            boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
          }}>
            <span style={{ color: tab === t.id ? C.gold : C.text3 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* AI INSIGHTS */}
      {tab === "insights" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {insights.map((insight) => {
            const cfg = INSIGHT_CONFIG[insight.type];
            return (
              <div key={insight.id} style={{ background: C.card, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: cfg.color, flexShrink: 0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: cfg.color, background: cfg.dim, padding: "2px 7px", borderRadius: 8 }}>{cfg.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: insight.severity === "high" ? C.red : insight.severity === "medium" ? C.amber : C.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{insight.severity}</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.5, fontWeight: 500 }}>{insight.message}</p>
                  </div>
                  {insight.count !== undefined && (
                    <span style={{ fontSize: 18, fontWeight: 900, color: cfg.color, flexShrink: 0 }}>{insight.count}</span>
                  )}
                </div>
                {insight.action_label && insight.action_path && (
                  <button
                    onClick={() => navigate(insight.action_path!)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: cfg.dim, border: `1px solid ${cfg.color}25`, color: cfg.color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.1s" }}
                  >
                    {insight.action_label} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AT RISK */}
      {tab === "at-risk" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Students Not Visiting ({atRiskStudents.length})</p>
              <span style={{ fontSize: 10, color: C.text3 }}>Sorted by days since last visit</span>
            </div>
            {atRiskStudents.slice(0, 15).map((s) => <RiskStudentCard key={s.id} student={s} />)}
          </div>
          <div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, marginBottom: 12 }}>No-Show Tracking ({noShows.length})</p>
              {noShows.slice(0, 8).map((m) => (
                <div key={m.id} style={{ padding: "12px 16px", borderRadius: 10, background: C.card, border: `1px solid rgba(193,18,31,0.2)`, marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{m.student_name}</p>
                  <p style={{ fontSize: 11, color: C.text3 }}>{m.meeting_type} · {format(new Date(m.meeting_date + "T00:00"), "MMM d")} at {m.meeting_time}</p>
                  <p style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>Advisor: {m.advisor_name}</p>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, marginBottom: 12 }}>FAFSA Follow-Ups Needed ({missingFafsa.length})</p>
              {missingFafsa.slice(0, 6).map((s) => (
                <div key={s.id} style={{ padding: "10px 14px", borderRadius: 10, background: C.card, border: `1px solid rgba(245,158,11,0.2)`, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>{s.full_name}</p>
                    <p style={{ fontSize: 11, color: C.text3 }}>{s.advisor_name ?? "—"}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.amber }}>Low Income · Verify FAFSA</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS */}
      {tab === "recommendations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "📋", color: C.red, title: "Immediate Outreach Required", body: `${atRiskStudents.filter((s) => { const d = s.last_activity ? differenceInDays(new Date(), new Date(s.last_activity)) : 999; return d > 30; }).length} students have not visited TRIO in 30+ days. Send a personalized outreach message this week. Students who receive outreach within 48 hours of being flagged have a 73% higher re-engagement rate.`, action: "View At-Risk Students", path: null, tab: "at-risk" as AITab },
            { icon: "🎓", color: C.gold, title: "Host a Scholarship Workshop", body: `${scholarshipCandidates.length} students with GPA ≥ 3.0 qualify for merit scholarships currently accepting applications. Schedule a Scholarship Search Clinic to walk students through the application process. Consider partnering with the financial aid office.`, action: "Create Event", path: "/events", tab: null },
            { icon: "📋", color: C.blue, title: "FAFSA Renewal Campaign", body: `The FAFSA priority deadline is approaching. ${missingFafsa.length} low-income students need renewal support. Host a FAFSA Workshop session and send targeted reminders to all students who have not confirmed renewal.`, action: "Send Announcement", path: "/messages", tab: null },
            { icon: "📅", color: C.purple, title: "Address No-Show Rate", body: `Current no-show rate for scheduled appointments is ${Math.round((noShows.length / Math.max(meetings.length, 1)) * 100)}%. Implement automated appointment reminders 24 hours and 1 hour before meetings. Follow up with no-show students within 48 hours.`, action: "View Appointments", path: "/meetings", tab: null },
            { icon: "🔔", color: C.green, title: "Schedule Transfer Info Sessions", body: "Transfer application season is approaching. Students planning to transfer to 4-year institutions benefit from early planning. Schedule Transfer Advising sessions and invite partner institution reps.", action: "Create Event", path: "/events", tab: null },
          ].map(({ icon, color, title, body, action, path, tab: navTab }) => (
            <div key={title} style={{ padding: "18px 20px", borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.text1, marginBottom: 8 }}>{title}</p>
                  <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 14 }}>{body}</p>
                  <button
                    onClick={() => { if (path) navigate(path); else if (navTab) setTab(navTab); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: `${color}14`, border: `1px solid ${color}30`, color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                  >
                    {action} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMAIL ASSISTANT */}
      {tab === "email-assist" && (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
          {/* Template list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, marginBottom: 4 }}>Email Templates</p>
            {EMAIL_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => selectTemplate(t)}
                style={{
                  padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                  background: emailTemplate.label === t.label ? C.goldDim : C.card,
                  borderLeft: emailTemplate.label === t.label ? `3px solid ${C.gold}` : "3px solid transparent",
                  color: emailTemplate.label === t.label ? C.gold : C.text2,
                  fontSize: 12, fontWeight: emailTemplate.label === t.label ? 700 : 500,
                  fontFamily: "'Inter', sans-serif", transition: "all 0.1s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>✦ AI Email Draft</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={copyEmail}
                  style={{ padding: "7px 14px", borderRadius: 8, background: emailCopied ? "rgba(34,197,94,0.15)" : C.goldDim, border: `1px solid ${emailCopied ? "rgba(34,197,94,0.3)" : "rgba(212,175,55,0.25)"}`, color: emailCopied ? C.green : C.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                >
                  {emailCopied ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={() => navigate("/messages")}
                  style={{ padding: "7px 14px", borderRadius: 8, background: C.red, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                >
                  Send via Messaging →
                </button>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.text3, marginBottom: 5 }}>Subject</p>
              <input value={editedEmail.subject} onChange={(e) => setEditedEmail({ ...editedEmail, subject: e.target.value })} style={{ width: "100%", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#0B0B0B", color: C.text1, fontFamily: "'Inter', sans-serif" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.text3, marginBottom: 5 }}>Body</p>
              <textarea value={editedEmail.body} onChange={(e) => setEditedEmail({ ...editedEmail, body: e.target.value })} rows={16} style={{ width: "100%", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: "12px", fontSize: 12, outline: "none", boxSizing: "border-box", background: "#0B0B0B", color: C.text2, fontFamily: "monospace", resize: "vertical", lineHeight: 1.6 }} />
            </div>
            <p style={{ fontSize: 11, color: C.text3 }}>💡 Replace <strong>[Student Name]</strong>, <strong>[Advisor Name]</strong>, and other placeholders before sending.</p>
          </div>
        </div>
      )}
    </div>
  );
}
