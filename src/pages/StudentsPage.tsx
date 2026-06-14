import { useState, useEffect, type ReactNode } from "react";
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  getAdvisors, getActivities, getMeetings, getEvents,
  getStudentNotes, createStudentNote, deleteStudentNote,
  getDocuments, getScholarships,
} from "../lib/db";
import type { TRIOStudent, Profile, Activity, Meeting, TRIOEvent, StudentNote, Scholarship, StudentDocument } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format, differenceInDays } from "date-fns";

const C = {
  bg: "#0B0B0B", card: "#1B1B1B", card2: "#151515",
  text1: "#FFFFFF", text2: "#A0A0A0", text3: "#606060",
  red: "#C1121F", redDim: "rgba(193,18,31,0.12)",
  gold: "#D4AF37", goldDim: "rgba(212,175,55,0.12)",
  green: "#22C55E", blue: "#3B82F6", purple: "#7C3AED", amber: "#F59E0B",
  border: "rgba(255,255,255,0.07)",
};

const PROGRAMS  = ["TRIO SSS", "TRIO Upward Bound", "WIOA Out Of School"];
const DEPTS     = ["Liberal Arts", "Business", "Health Sciences", "STEM", "Trades & Technology", "Early Childhood"];
const LOCATIONS = ["Naugatuck Valley CC", "Capital CC", "Asnuntuck CC", "Tunxis CC", "Middlesex CC"];
const NOTE_CATEGORIES = ["Academic", "Financial", "Personal", "Follow-Up", "General"] as const;
const NOTE_PRIORITIES = ["High", "Medium", "Low"] as const;

function initials(name: string) { return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase(); }
function daysAgo(s: string) { return differenceInDays(new Date(), new Date(s)); }

// ── Dark input styles ─────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8,
  padding: "9px 12px", fontSize: 13, outline: "none",
  boxSizing: "border-box", background: C.bg, color: C.text1,
  fontFamily: "'Inter', sans-serif",
};
const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
  color: C.text3, marginBottom: 6, display: "block",
};

function EnrollBadge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    active:      ["rgba(34,197,94,0.12)",  "#22C55E"],
    inactive:    ["rgba(193,18,31,0.12)",  "#C1121F"],
    graduated:   ["rgba(59,130,246,0.12)", "#3B82F6"],
    transferred: ["rgba(124,58,237,0.12)", "#7C3AED"],
    withdrawn:   ["rgba(255,255,255,0.07)", "#606060"],
  };
  const [bg, color] = m[status] ?? m.active;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: bg, color, textTransform: "capitalize" }}>{status}</span>;
}

function priorityColor(p: string) {
  return p === "High" ? C.red : p === "Medium" ? C.amber : C.text3;
}

// ── Profile Tab Panel ─────────────────────────────────────────────────────────
type ProfileTab = "overview" | "attendance" | "appointments" | "events" | "scholarships" | "notes" | "ai";

interface ProfileData {
  student: TRIOStudent;
  activities: Activity[];
  meetings: Meeting[];
  events: TRIOEvent[];
  notes: StudentNote[];
  docs: StudentDocument[];
  scholarships: Scholarship[];
}

function StudentProfile({ data, user, onClose }: { data: ProfileData; user: { id: string; full_name: string; role: string } | null; onClose: () => void }) {
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [notes, setNotes] = useState<StudentNote[]>(data.notes);
  const [noteForm, setNoteForm] = useState({ content: "", category: "General" as typeof NOTE_CATEGORIES[number], priority: "Medium" as typeof NOTE_PRIORITIES[number] });
  const [addingNote, setAddingNote] = useState(false);

  const { student } = data;
  const daysSinceLast = student.last_activity ? daysAgo(student.last_activity) : 999;
  const riskLevel = daysSinceLast > 30 ? "high" : daysSinceLast > 14 ? "medium" : "low";

  const tabs: { id: ProfileTab; label: string; count?: number }[] = [
    { id: "overview",      label: "Overview" },
    { id: "attendance",    label: "Attendance",    count: data.activities.length },
    { id: "appointments",  label: "Appointments",  count: data.meetings.length },
    { id: "events",        label: "Events",        count: data.events.length },
    { id: "scholarships",  label: "Scholarships",  count: data.scholarships.length },
    { id: "notes",         label: "Notes",         count: notes.length },
    { id: "ai",            label: "AI Insights" },
  ];

  async function handleAddNote() {
    if (!noteForm.content.trim() || !user) return;
    const note = await createStudentNote({
      student_id: student.id,
      author_id: user.id,
      author_name: user.full_name,
      content: noteForm.content,
      category: noteForm.category,
      priority: noteForm.priority,
    });
    setNotes((p) => [note, ...p]);
    setNoteForm({ content: "", category: "General", priority: "Medium" });
    setAddingNote(false);
  }

  async function handleDeleteNote(id: string) {
    await deleteStudentNote(id);
    setNotes((p) => p.filter((n) => n.id !== id));
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "stretch", justifyContent: "flex-end", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: C.card2, width: "100%", maxWidth: 700, overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(0,0,0,0.6)" }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.card }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: C.redDim, border: `2px solid rgba(193,18,31,0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: C.red }}>{initials(student.full_name)}</span>
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text1, letterSpacing: "-0.3px" }}>{student.full_name}</h2>
                <p style={{ fontSize: 12, color: C.text3, marginTop: 3, fontFamily: "monospace" }}>{student.student_number}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <EnrollBadge status={student.enrollment_status} />
                  <span style={{ fontSize: 11, color: C.text3 }}>{student.program}</span>
                  {riskLevel !== "low" && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: riskLevel === "high" ? C.redDim : "rgba(245,158,11,0.12)", color: riskLevel === "high" ? C.red : C.amber }}>
                      {riskLevel === "high" ? "⚠ At Risk" : "⚡ Watch"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "none", color: C.text2, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: tab === t.id ? C.red : "transparent",
                color: tab === t.id ? "#fff" : C.text3,
                fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                fontFamily: "'Inter', sans-serif", transition: "all 0.1s",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 800, background: tab === t.id ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 10 }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, padding: "22px 28px", overflowY: "auto" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Success Score */}
              <div style={{ background: "linear-gradient(135deg, #1E1500 0%, #2D1F00 100%)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(212,175,55,0.2)" }}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(212,175,55,0.6)", marginBottom: 8 }}>Student Success Score</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <p style={{ fontSize: 42, fontWeight: 900, color: C.gold, lineHeight: 1, letterSpacing: "-2px" }}>
                    {student.success_score ?? Math.max(20, Math.min(98, Math.round(((student.gpa || 2.5) / 4) * 50 + (Math.min(student.activity_count || 0, 20) / 20) * 30 + (daysSinceLast < 7 ? 20 : daysSinceLast < 21 ? 10 : 0))))}
                  </p>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 6, borderRadius: 10, background: "rgba(255,255,255,0.08)", marginBottom: 6 }}>
                      <div style={{ height: "100%", borderRadius: 10, background: "linear-gradient(90deg, #B8860B, #D4AF37, #FFF6C5)", width: `${student.success_score ?? 72}%` }} />
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(212,175,55,0.6)" }}>Based on attendance, GPA, and engagement</p>
                  </div>
                </div>
              </div>

              {/* Personal info */}
              <Section title="Personal Information">
                <InfoGrid items={[
                  { label: "Full Name", value: student.full_name },
                  { label: "Email", value: student.email || "—" },
                  { label: "Phone", value: student.phone || "—" },
                  { label: "Date of Birth", value: student.date_of_birth ? format(new Date(student.date_of_birth), "MMMM d, yyyy") : "—" },
                ]} />
              </Section>

              <Section title="Academic Information">
                <InfoGrid items={[
                  { label: "Program", value: student.program },
                  { label: "Department", value: student.department || "—" },
                  { label: "Campus", value: student.work_location || "—" },
                  { label: "GPA", value: student.gpa ? student.gpa.toFixed(2) : "—" },
                  { label: "Credits Completed", value: String(student.credit_hours_completed) },
                  { label: "Enrollment Date", value: format(new Date(student.enrollment_date), "MMM d, yyyy") },
                  { label: "Last Activity", value: student.last_activity ? `${daysSinceLast}d ago` : "Never" },
                  { label: "Total Visits", value: String(student.activity_count ?? 0) },
                ]} />
              </Section>

              <Section title="Advisor Information">
                <InfoGrid items={[
                  { label: "Assigned Advisor", value: student.advisor_name || "Unassigned" },
                ]} />
              </Section>

              <Section title="Program Eligibility">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <EligBadge label="First-Generation" active={student.first_generation} />
                  <EligBadge label="Low Income" active={student.low_income} />
                  <EligBadge label="Documented Disability" active={student.disabled} />
                  <EligBadge label="Veteran" active={student.veteran ?? false} />
                </div>
              </Section>
            </div>
          )}

          {/* ATTENDANCE */}
          {tab === "attendance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <p style={{ fontSize: 12, color: C.text3, marginBottom: 14 }}>{data.activities.length} activity records found</p>
              {data.activities.length === 0 ? (
                <EmptyState icon="📋" message="No attendance records yet" />
              ) : (
                data.activities.map((a) => (
                  <div key={a.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{a.activity_type}</p>
                      <p style={{ fontSize: 11, color: C.text3 }}>{format(new Date(a.check_in_time), "EEEE, MMM d, yyyy · h:mm a")}{a.duration_minutes ? ` · ${a.duration_minutes} min` : ""}</p>
                      {a.notes && <p style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{a.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* APPOINTMENTS */}
          {tab === "appointments" && (
            <div>
              <p style={{ fontSize: 12, color: C.text3, marginBottom: 14 }}>{data.meetings.length} appointment records</p>
              {data.meetings.length === 0 ? (
                <EmptyState icon="📅" message="No appointments scheduled" />
              ) : (
                data.meetings.map((m) => (
                  <div key={m.id} style={{ padding: "13px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{m.meeting_type}</p>
                        <p style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>
                          {format(new Date(m.meeting_date + "T00:00"), "EEEE, MMM d, yyyy")} · {m.meeting_time} · {m.duration_minutes}min
                        </p>
                        <p style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>with {m.advisor_name} · {m.location}</p>
                        {m.notes && <p style={{ fontSize: 12, color: C.text2, marginTop: 5 }}>{m.notes}</p>}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 12, background: m.status === "Completed" ? "rgba(34,197,94,0.12)" : m.status === "No Show" ? C.redDim : "rgba(59,130,246,0.12)", color: m.status === "Completed" ? C.green : m.status === "No Show" ? C.red : C.blue, whiteSpace: "nowrap" }}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* EVENTS */}
          {tab === "events" && (
            <div>
              {data.events.length === 0 ? (
                <EmptyState icon="🎯" message="No event registrations" />
              ) : (
                data.events.map((e) => (
                  <div key={e.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{e.title}</p>
                    <p style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{format(new Date(e.event_date + "T00:00"), "MMM d, yyyy")} · {e.start_time} · {e.location}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "rgba(59,130,246,0.1)", color: C.blue, marginTop: 6, display: "inline-block" }}>{e.event_type}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SCHOLARSHIPS */}
          {tab === "scholarships" && (
            <div>
              <p style={{ fontSize: 12, color: C.text3, marginBottom: 14 }}>{data.scholarships.length} scholarship opportunities</p>
              {data.scholarships.length === 0 ? (
                <EmptyState icon="🎓" message="No scholarship matches found" />
              ) : (
                data.scholarships.map((s) => (
                  <div key={s.id} style={{ padding: "14px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>{s.title}</p>
                      {s.amount && <span style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>${s.amount.toLocaleString()}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>{s.description}</p>
                    {s.deadline && <p style={{ fontSize: 11, color: C.amber }}>Deadline: {format(new Date(s.deadline + "T00:00"), "MMMM d, yyyy")}</p>}
                    {s.requirements && <p style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Requirements: {s.requirements}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* NOTES */}
          {tab === "notes" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: C.text3 }}>{notes.length} staff notes</p>
                <button
                  onClick={() => setAddingNote(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: C.red, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                >
                  + Add Note
                </button>
              </div>

              {addingNote && (
                <div style={{ background: C.card, borderRadius: 12, padding: "16px", border: `1px solid rgba(193,18,31,0.3)`, marginBottom: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={lbl}>Category</label>
                      <select value={noteForm.category} onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value as typeof NOTE_CATEGORIES[number] })} style={inp}>
                        {NOTE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Priority</label>
                      <select value={noteForm.priority} onChange={(e) => setNoteForm({ ...noteForm, priority: e.target.value as typeof NOTE_PRIORITIES[number] })} style={inp}>
                        {NOTE_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <label style={lbl}>Note Content</label>
                  <textarea value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} rows={3} placeholder="Write a staff note…" style={{ ...inp, resize: "vertical", marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setAddingNote(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                    <button onClick={handleAddNote} disabled={!noteForm.content.trim()} style={{ flex: 2, padding: "8px", borderRadius: 8, background: C.red, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Save Note</button>
                  </div>
                </div>
              )}

              {notes.length === 0 && !addingNote ? (
                <EmptyState icon="📝" message="No staff notes yet. Click 'Add Note' to add one." />
              ) : (
                notes.map((n) => (
                  <div key={n.id} style={{ padding: "14px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 12, background: "rgba(255,255,255,0.07)", color: C.text2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{n.category}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: priorityColor(n.priority) }}>● {n.priority}</span>
                      </div>
                      <button onClick={() => handleDeleteNote(n.id)} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 16, padding: "0 4px" }} title="Delete note">×</button>
                    </div>
                    <p style={{ fontSize: 13, color: C.text1, lineHeight: 1.5, marginBottom: 10 }}>{n.content}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: C.redDim, border: `1px solid rgba(193,18,31,0.2)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: C.red }}>
                        {n.author_name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                      </span>
                      <span style={{ fontSize: 11, color: C.text3 }}>{n.author_name} · {format(new Date(n.created_at), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AI INSIGHTS */}
          {tab === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <AIInsightCard icon="⚠" color={C.red} title="Engagement Risk" body={daysSinceLast > 30 ? `${student.first_name} has not visited TRIO in ${daysSinceLast} days. Immediate outreach recommended.` : daysSinceLast > 14 ? `${student.first_name}'s visits have slowed. Consider a check-in.` : `${student.first_name} is actively engaged with TRIO services.`} />
              <AIInsightCard icon="📚" color={C.blue} title="Academic Standing" body={student.gpa ? (student.gpa >= 3.0 ? `GPA of ${student.gpa.toFixed(2)} is strong. Consider nominating for merit scholarships.` : student.gpa >= 2.0 ? `GPA of ${student.gpa.toFixed(2)} is satisfactory. Recommend academic coaching resources.` : `GPA of ${student.gpa.toFixed(2)} is below satisfactory. Priority intervention needed.`) : "No GPA on record. Schedule academic review."} />
              <AIInsightCard icon="💰" color={C.gold} title="Financial Aid" body={student.low_income ? "Student qualifies for income-based financial aid support. Verify FAFSA completion and review emergency aid eligibility." : "No income-based flag. Confirm eligibility criteria are up to date."} />
              <AIInsightCard icon="◆" color={C.green} title="Scholarship Opportunity" body={`${data.scholarships.length} active scholarship${data.scholarships.length !== 1 ? "s" : ""} match ${student.first_name}'s profile. ${data.scholarships.length > 0 ? `Nearest deadline: ${data.scholarships[0].deadline ? format(new Date(data.scholarships[0].deadline + "T00:00"), "MMMM d, yyyy") : "Open"}` : "Encourage scholarship search."}`} />
              <AIInsightCard icon="🎯" color={C.purple} title="Recommended Actions" body={`Suggested next steps for ${student.first_name}: ${[daysSinceLast > 14 && "Schedule a check-in meeting", !student.gpa && "Record GPA from transcript", student.low_income && "Verify FAFSA renewal", data.notes.length === 0 && "Add initial advising note"].filter(Boolean).join("; ") || "Student appears on track. Continue regular advising contact."}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, marginBottom: 10 }}>{title}</p>
      {children}
    </div>
  );
}

function InfoGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {items.map((item) => (
        <div key={item.label} style={{ background: C.card, borderRadius: 8, padding: "10px 12px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.text3, marginBottom: 4 }}>{item.label}</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function EligBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20, background: active ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", color: active ? "#22C55E" : C.text3, border: `1px solid ${active ? "rgba(34,197,94,0.25)" : "transparent"}` }}>
      {active ? "✓" : "○"} {label}
    </span>
  );
}

function AIInsightCard({ icon, color, title, body }: { icon: string; color: string; title: string; body: string }) {
  return (
    <div style={{ padding: "14px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>{title}</p>
      </div>
      <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>{icon}</p>
      <p style={{ fontSize: 14, color: C.text3, fontWeight: 500 }}>{message}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents]     = useState<TRIOStudent[]>([]);
  const [advisors, setAdvisors]     = useState<Profile[]>([]);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");
  const [filterAdvisor, setFilterAdvisor] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<"add" | "edit" | "delete" | null>(null);
  const [editTarget, setEditTarget] = useState<TRIOStudent | null>(null);
  const [profile, setProfile]       = useState<ProfileData | null>(null);
  const [form, setForm]             = useState<Partial<TRIOStudent>>({
    first_name: "", last_name: "", email: "", phone: "",
    program: "TRIO SSS", department: "Liberal Arts",
    work_location: "Naugatuck Valley CC", enrollment_status: "active",
    first_generation: true, low_income: true, disabled: false,
    credit_hours_completed: 0,
  });

  useEffect(() => {
    Promise.all([getStudents(), getAdvisors()]).then(([s, a]) => {
      setStudents(s); setAdvisors(a); setLoading(false);
    });
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.full_name.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").includes(q) ||
      (s.major ?? "").toLowerCase().includes(q) ||
      (s.advisor_name ?? "").toLowerCase().includes(q);
    const matchStatus  = filterStatus === "all"  || s.enrollment_status === filterStatus;
    const matchAdvisor = filterAdvisor === "all" || s.advisor_id === filterAdvisor;
    const matchProgram = filterProgram === "all" || s.program === filterProgram;
    return matchSearch && matchStatus && matchAdvisor && matchProgram;
  });

  async function openProfile(s: TRIOStudent) {
    const [allActs, allMtgs, allEvts, notes, docs, scholarships] = await Promise.all([
      getActivities(), getMeetings(), getEvents(),
      getStudentNotes(s.id), getDocuments(s.id), getScholarships(),
    ]);
    setProfile({
      student: s,
      activities: allActs.filter((a) => a.student_id === s.id),
      meetings: allMtgs.filter((m) => m.student_id === s.id),
      events: allEvts.slice(0, 5),
      notes,
      docs,
      scholarships,
    });
  }

  const openAdd = () => {
    setForm({ first_name: "", last_name: "", email: "", phone: "", program: "TRIO SSS", department: "Liberal Arts", work_location: "Naugatuck Valley CC", enrollment_status: "active", first_generation: true, low_income: true, disabled: false, credit_hours_completed: 0 });
    setEditTarget(null); setModal("add");
  };
  const openEdit = (s: TRIOStudent) => { setEditTarget(s); setForm({ ...s }); setModal("edit"); };

  const handleSave = async () => {
    const advisor = advisors.find((a) => a.id === form.advisor_id);
    const data = { ...form, advisor_name: advisor?.full_name };
    if (modal === "add") {
      const s = await createStudent(data);
      setStudents((p) => [...p, s]);
    } else if (editTarget) {
      await updateStudent(editTarget.id, data);
      setStudents((p) => p.map((s) => s.id === editTarget.id ? { ...s, ...data, full_name: `${data.first_name} ${data.last_name}` } : s));
    }
    setModal(null);
  };

  const handleDelete = async () => {
    if (!editTarget) return;
    await deleteStudent(editTarget.id);
    setStudents((p) => p.filter((s) => s.id !== editTarget.id));
    setModal(null);
  };

  if (loading) return <div style={{ color: C.text3, padding: 40, textAlign: "center" }}>Loading students…</div>;

  const active    = students.filter((s) => s.enrollment_status === "active").length;
  const firstGen  = students.filter((s) => s.first_generation).length;
  const needAttn  = students.filter((s) => s.last_activity && daysAgo(s.last_activity) > 21 && s.enrollment_status === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.25s ease both" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text1, letterSpacing: "-0.5px" }}>Students</h1>
          <p style={{ fontSize: 13, color: C.text3, marginTop: 3 }}>{students.length} enrolled · {active} active · full CRM</p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: C.red, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 2px 8px rgba(193,18,31,0.35)" }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Student
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Enrolled", value: students.length, sub: "All programs", color: C.blue },
          { label: "Active", value: active, sub: "Currently enrolled", color: "#22C55E" },
          { label: "First-Generation", value: firstGen, sub: `${Math.round(firstGen / Math.max(students.length, 1) * 100)}% of students`, color: C.purple },
          { label: "Need Attention", value: needAttn, sub: "No activity 21+ days", color: needAttn > 0 ? C.red : C.text3 },
        ].map((s) => (
          <div key={s.label} style={{ background: C.card, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.border}`, borderTop: `2px solid ${s.color}` }}>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: C.text1, letterSpacing: "-0.5px", marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: C.text3 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={C.text3} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, email, phone, advisor…" style={{ ...inp, paddingLeft: 34, background: C.bg }} />
          </div>
          {/* Status filter */}
          <select value={filterStatus} onChange={(e) => setFilter(e.target.value)} style={{ ...inp, width: "auto", padding: "9px 14px" }}>
            <option value="all">All Statuses</option>
            {["active","inactive","graduated","transferred","withdrawn"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          {/* Program filter */}
          <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} style={{ ...inp, width: "auto", padding: "9px 14px" }}>
            <option value="all">All Programs</option>
            {PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {/* Advisor filter */}
          <select value={filterAdvisor} onChange={(e) => setFilterAdvisor(e.target.value)} style={{ ...inp, width: "auto", padding: "9px 14px" }}>
            <option value="all">All Advisors</option>
            {advisors.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
          {(search || filterStatus !== "all" || filterAdvisor !== "all" || filterProgram !== "all") && (
            <button onClick={() => { setSearch(""); setFilter("all"); setFilterAdvisor("all"); setFilterProgram("all"); }} style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.text3, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>Clear filters</button>
          )}
          <span style={{ fontSize: 11, color: C.text3, marginLeft: "auto" }}>{filtered.length} of {students.length}</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.card2 }}>
              {["Student", "ID", "Program", "Advisor", "GPA", "Last Visit", "Status", ""].map((h, i) => (
                <th key={`h${i}`} style={{ padding: "12px 16px", textAlign: i === 7 ? "right" : "left", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const days = s.last_activity ? daysAgo(s.last_activity) : 999;
              const risk = days > 30 ? C.red : days > 14 ? C.amber : C.green;
              return (
                <tr
                  key={s.id}
                  style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => openProfile(s)}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: C.redDim, border: `1.5px solid rgba(193,18,31,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: C.red }}>{initials(s.full_name)}</span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: C.text1 }}>{s.full_name}</p>
                        <p style={{ fontSize: 11, color: C.text3 }}>{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: C.text3 }}>{s.student_number}</td>
                  <td style={{ padding: "12px 16px", color: C.text2, fontSize: 12 }}>{s.program}</td>
                  <td style={{ padding: "12px 16px", color: C.text2, fontSize: 12 }}>{s.advisor_name || "—"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: s.gpa && s.gpa < 2.0 ? C.red : C.text1 }}>{s.gpa?.toFixed(2) || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {s.last_activity ? (
                      <span style={{ fontSize: 12, color: risk, fontWeight: days > 21 ? 700 : 400 }}>
                        {days === 0 ? "Today" : `${days}d ago`}
                      </span>
                    ) : <span style={{ color: C.text3, fontSize: 12 }}>Never</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}><EnrollBadge status={s.enrollment_status} /></td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "none", cursor: "pointer", color: C.text3 }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditTarget(s); setModal("delete"); }} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(193,18,31,0.3)", background: C.redDim, cursor: "pointer", color: C.red }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: C.text3 }}>No students found</p>
            {search && <p style={{ fontSize: 12, color: C.text3, marginTop: 6 }}>Try adjusting your search or filters</p>}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16, backdropFilter: "blur(4px)" }} onClick={() => setModal(null)}>
          <div style={{ background: C.card2, borderRadius: 18, padding: 28, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${C.border}`, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text1, marginBottom: 24 }}>{modal === "add" ? "Add Student" : "Edit Student"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label style={lbl}>First Name *</label><input value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Last Name *</label><input value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Phone</label><input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Program</label>
                <select value={form.program || "TRIO SSS"} onChange={(e) => setForm({ ...form, program: e.target.value })} style={inp}>
                  {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Department</label>
                <select value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} style={inp}>
                  {DEPTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Campus</label>
                <select value={form.work_location || ""} onChange={(e) => setForm({ ...form, work_location: e.target.value })} style={inp}>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Advisor</label>
                <select value={form.advisor_id || ""} onChange={(e) => setForm({ ...form, advisor_id: e.target.value })} style={inp}>
                  <option value="">— Unassigned —</option>
                  {advisors.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                </select>
              </div>
              <div><label style={lbl}>GPA</label><input type="number" step="0.01" min="0" max="4" value={form.gpa || ""} onChange={(e) => setForm({ ...form, gpa: +e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Credits Completed</label><input type="number" value={form.credit_hours_completed || 0} onChange={(e) => setForm({ ...form, credit_hours_completed: +e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Status</label>
                <select value={form.enrollment_status || "active"} onChange={(e) => setForm({ ...form, enrollment_status: e.target.value as TRIOStudent["enrollment_status"] })} style={inp}>
                  {["active","inactive","graduated","transferred","withdrawn"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 22 }}>
                {(["first_generation", "low_income", "disabled"] as const).map((key) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", color: C.text2 }}>
                    <input type="checkbox" checked={!!form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                    {key === "first_generation" ? "First-Gen" : key === "low_income" ? "Low Income" : "Disabled"}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Notes</label>
              <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", fontWeight: 600, fontSize: 13, color: C.text2, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              <button onClick={handleSave} disabled={!form.first_name?.trim() || !form.last_name?.trim()} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: C.red, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                {modal === "add" ? "Add Student" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }} onClick={() => setModal(null)}>
          <div style={{ background: C.card2, borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, border: `1px solid rgba(193,18,31,0.3)` }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text1, marginBottom: 8 }}>Remove {editTarget.full_name}?</h3>
            <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>This will remove the student and all records. This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", fontWeight: 600, fontSize: 13, color: C.text2, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: C.red, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Panel */}
      {profile && (
        <StudentProfile
          data={profile}
          user={user}
          onClose={() => setProfile(null)}
        />
      )}
    </div>
  );
}
