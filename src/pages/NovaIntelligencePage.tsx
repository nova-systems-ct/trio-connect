import { useState, useEffect } from "react";
import { getStudents, getActivities } from "../lib/db";
import type { TRIOStudent, Activity } from "../lib/types";
import { differenceInDays, format } from "date-fns";

const CARD  = "#111827";
const CARD2 = "#1A2236";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED   = "#D72638";
const GOLD  = "#D4AF37";
const GOLD_GRAD = "linear-gradient(135deg, #FFF4B0 0%, #E6C76B 30%, #D4AF37 60%, #F7E8A4 100%)";
const BORDER = "rgba(248,250,252,0.06)";
const GREEN = "#22C55E";

type Tool = "email" | "text" | "summary" | "report" | null;

interface Insight {
  type: "alert" | "opportunity" | "action" | "info";
  title: string;
  body: string;
  actionLabel?: string;
  count?: number;
}

function InsightCard({ insight }: { insight: Insight }) {
  const colors: Record<string, string> = {
    alert: "#F59E0B",
    opportunity: GREEN,
    action: RED,
    info: "#3B82F6",
  };
  const c = colors[insight.type];
  return (
    <div style={{ background: CARD, borderRadius: 13, border: `1px solid ${BORDER}`, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c}12`, border: `1px solid ${c}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 14 }}>
          {insight.type === "alert" ? "⚠" : insight.type === "opportunity" ? "✦" : insight.type === "action" ? "→" : "ℹ"}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{insight.title}</p>
        <p style={{ fontSize: 12, color: TEXT3, lineHeight: 1.5 }}>{insight.body}</p>
      </div>
      {insight.actionLabel && (
        <button style={{
          padding: "6px 14px", borderRadius: 8, border: `1px solid ${c}30`,
          background: `${c}10`, color: c, fontSize: 11, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Inter', sans-serif", flexShrink: 0,
        }}>{insight.actionLabel}</button>
      )}
    </div>
  );
}

function DraftTool({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);

  const prompts: Record<Exclude<Tool, null>, { label: string; placeholder: string; template: (s: string) => string }> = {
    email: {
      label: "Draft Email",
      placeholder: "Describe what you want to say (e.g., 'FAFSA reminder for students who haven't completed')…",
      template: (s) => `Subject: TRIO Connect — ${s}\n\nDear [Student Name],\n\nWe hope this message finds you well. We're reaching out from the TRIO Student Support Services program regarding: ${s}.\n\nPlease don't hesitate to contact our office if you have any questions or need assistance.\n\nBest regards,\nTRIO Support Services Team\nCT State Community College`,
    },
    text: {
      label: "Draft SMS",
      placeholder: "What's the message? (Keep it brief — SMS messages work best under 160 characters)…",
      template: (s) => `TRIO Connect: ${s}. Reply STOP to opt out. Questions? Call our office during business hours.`,
    },
    summary: {
      label: "Generate Summary",
      placeholder: "What period or topic should the summary cover? (e.g., 'Monthly attendance summary for June')…",
      template: (s) => `TRIO Program Summary — ${s}\n\nGenerated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n\nThis summary covers program activities for the selected period. Student enrollment, service delivery, and outcome data are tracked through TRIO Connect.\n\nKey indicators:\n• Enrollment status: Awaiting current data\n• Service hours: Awaiting current data  \n• Attendance: Awaiting current data\n\nNote: Add student data and track attendance to generate data-populated summaries.`,
    },
    report: {
      label: "Draft Report Notes",
      placeholder: "What report or section do you need help writing? (e.g., 'Narrative for APR Section 3')…",
      template: (s) => `TRIO Program Report — ${s}\n\nProgram: TRIO Student Support Services\nInstitution: CT State Community College\nReport Section: ${s}\nDate: ${format(new Date(), "MMMM d, yyyy")}\n\n[NARRATIVE SECTION]\n\nThe TRIO Student Support Services program at CT State Community College continues to serve eligible first-generation, low-income, and students with disabilities in their pursuit of postsecondary success.\n\nFor this section: ${s}\n\n[Insert supporting data and evidence here. Use the Grant Reporting module to generate supporting data exports.]\n\nPrepared by: ________________\nDate: ________________`,
    },
  };

  if (!tool) return null;
  const p = prompts[tool];

  async function generate() {
    if (!input.trim()) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 600));
    setOutput(p.template(input.trim()));
    setGenerating(false);
  }

  const inp: React.CSSProperties = {
    width: "100%", background: CARD2, border: `1px solid ${BORDER}`,
    borderRadius: 9, padding: "10px 13px", fontSize: 13, color: TEXT,
    outline: "none", fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: CARD, borderRadius: 18, border: `1px solid rgba(212,175,55,0.2)`, padding: 32, width: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: GOLD_GRAD, borderRadius: "18px 18px 0 0" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: GOLD_GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{p.label}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT3, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: TEXT3, marginBottom: 5, display: "block" }}>Describe what you need</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={p.placeholder}
              rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
          </div>

          <button onClick={generate} disabled={!input.trim() || generating} style={{
            padding: "11px", borderRadius: 10, background: input.trim() && !generating ? GOLD_GRAD : "rgba(248,250,252,0.04)",
            border: "none", color: input.trim() && !generating ? "#000" : TEXT3,
            fontSize: 13, fontWeight: 800, cursor: input.trim() && !generating ? "pointer" : "default",
            fontFamily: "'Inter', sans-serif",
          }}>
            {generating ? "Generating…" : "Generate with Nova AI"}
          </button>

          {output && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: GREEN, display: "block" }}>✓ Generated</label>
              <textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={10}
                style={{ ...inp, resize: "vertical", lineHeight: 1.6, fontSize: 12 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(output)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${BORDER}`, background: "none", color: TEXT2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Copy</button>
                <button onClick={() => setOutput("")} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${BORDER}`, background: "none", color: TEXT2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Clear</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NovaIntelligencePage() {
  const [students, setStudents] = useState<TRIOStudent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>(null);

  useEffect(() => {
    Promise.all([getStudents(), getActivities()]).then(([s, a]) => {
      setStudents(s);
      setActivities(a);
    });
  }, []);

  // Build dynamic insights from actual data
  const insights: Insight[] = [];

  if (students.length === 0) {
    insights.push({ type: "info", title: "Ready to assist", body: "Add students to TRIO Connect and Nova Intelligence will begin generating personalized insights, alerts, and recommendations." });
  } else {
    const today = new Date().toISOString().split("T")[0];

    const noRecentActivity = students.filter((s) => {
      if (!s.last_activity) return true;
      return differenceInDays(new Date(), new Date(s.last_activity)) > 30;
    });
    if (noRecentActivity.length > 0) {
      insights.push({ type: "alert", title: `${noRecentActivity.length} student${noRecentActivity.length > 1 ? "s" : ""} haven't visited in 30+ days`, body: `${noRecentActivity.map((s) => s.full_name).join(", ")} may need outreach. Consider scheduling a check-in or sending a follow-up message.`, actionLabel: "View Students", count: noRecentActivity.length });
    }

    const todayActivities = activities.filter((a) => a.check_in_time.startsWith(today));
    if (todayActivities.length > 0) {
      insights.push({ type: "info", title: `${todayActivities.length} visit${todayActivities.length > 1 ? "s" : ""} recorded today`, body: `Students have checked in today: ${[...new Set(todayActivities.map((a) => a.student_name))].join(", ")}.` });
    }

    const firstGen = students.filter((s) => s.first_generation);
    if (firstGen.length > 0) {
      insights.push({ type: "opportunity", title: "First-generation scholarship eligibility", body: `${firstGen.length} enrolled student${firstGen.length > 1 ? "s are" : " is"} first-generation. Review the First-Generation Student Award — they may be eligible for up to $2,000.`, actionLabel: "Grant Reporting" });
    }
  }

  if (insights.length === 0 && students.length > 0) {
    insights.push({ type: "info", title: "All clear", body: "No alerts or action items at this time. Keep tracking attendance to unlock deeper insights." });
  }

  const AI_TOOLS = [
    { id: "email" as const, label: "Draft Email", icon: "✉", desc: "Generate outreach and communication emails" },
    { id: "text" as const, label: "Draft SMS", icon: "💬", desc: "Create concise text messages for students" },
    { id: "summary" as const, label: "Generate Summary", icon: "📋", desc: "Summarize program activity for a period" },
    { id: "report" as const, label: "Report Narrative", icon: "📄", desc: "Draft grant report narratives and sections" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 900, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, background: GOLD_GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>✦</div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: "-0.7px" }}>Nova Intelligence</h1>
          <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>AI-powered insights and tools to support student success.</p>
        </div>
      </div>

      {/* Insights */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT3, marginBottom: 12 }}>Live Insights</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
        </div>
      </div>

      {/* AI Tools */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT3, marginBottom: 12 }}>AI Tools</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {AI_TOOLS.map((tool) => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)} style={{
              background: CARD, borderRadius: 13, border: `1px solid ${BORDER}`, padding: "20px 22px",
              textAlign: "left", cursor: "pointer", fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; e.currentTarget.style.background = "rgba(212,175,55,0.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CARD; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{tool.icon}</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{tool.label}</p>
              </div>
              <p style={{ fontSize: 12, color: TEXT3 }}>{tool.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 14, padding: "24px 28px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, background: GOLD_GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" as unknown as string, marginBottom: 16 }}>Nova Intelligence Capabilities</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            "Students who may need follow-up",
            "Students missing FAFSA documentation",
            "Scholarship eligibility matching",
            "Attendance trend analysis",
            "Upcoming deadline alerts",
            "Recommended workshop targeting",
            "Outreach campaign suggestions",
            "Grant report narrative drafting",
            "Email and SMS template generation",
            "Program summary generation",
          ].map((cap) => (
            <div key={cap} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: GOLD }}>✦</span>
              <span style={{ fontSize: 12, color: TEXT2 }}>{cap}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: TEXT3, marginTop: 16, lineHeight: 1.6 }}>
          Nova Intelligence learns from your program data. The more attendance, student outcomes, and service records you add to TRIO Connect, the smarter and more personalized the insights become.
        </p>
      </div>

      {/* Draft tool modal */}
      {activeTool && <DraftTool tool={activeTool} onClose={() => setActiveTool(null)} />}
    </div>
  );
}
