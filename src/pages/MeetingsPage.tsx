import { useState, useEffect } from "react";
import { getMeetings, createMeeting, updateMeetingStatus, deleteMeeting, getStudents, getAdvisors, createActivity } from "../lib/db";
import type { Meeting, TRIOStudent, Profile, MeetingType, MeetingStatus } from "../lib/types";
import { MEETING_TYPES } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format, isToday, isFuture, isPast } from "date-fns";

const NAVY = "#1B3A6B";
const CARD_DARK = "#1E293B";

const STATUS_MAP: Record<MeetingStatus, { bg: string; color: string }> = {
  "Scheduled":   { bg: "#EFF6FF", color: "#2563EB" },
  "Checked In":  { bg: "#ECFDF5", color: "#059669" },
  "Completed":   { bg: "#F0FDF4", color: "#16A34A" },
  "No Show":     { bg: "#FEF2F2", color: "#DC2626" },
  "Cancelled":   { bg: "#F8FAFC", color: "#64748B" },
  "Rescheduled": { bg: "#FFFBEB", color: "#D97706" },
};

function StatusBadge({ status }: { status: MeetingStatus }) {
  const s = STATUS_MAP[status];
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color }}>{status}</span>;
}

export default function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings]     = useState<Meeting[]>([]);
  const [students, setStudents]     = useState<TRIOStudent[]>([]);
  const [advisors, setAdvisors]     = useState<Profile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<"create" | "status" | null>(null);
  const [statusTarget, setStatusTarget] = useState<Meeting | null>(null);
  const [newStatus, setNewStatus]   = useState<MeetingStatus>("Completed");
  const [statusNotes, setStatusNotes] = useState("");
  const [filterView, setFilterView] = useState<"upcoming" | "today" | "past" | "all">("upcoming");
  const [form, setForm]             = useState<{
    student_id: string; advisor_id: string;
    meeting_date: string; meeting_time: string;
    duration_minutes: number; meeting_type: MeetingType;
    notes: string; location: string;
  }>({
    student_id: "", advisor_id: user?.id || "",
    meeting_date: new Date().toISOString().split("T")[0],
    meeting_time: "09:00", duration_minutes: 30,
    meeting_type: "Academic Advising", notes: "", location: "TRIO Office",
  });

  useEffect(() => {
    Promise.all([
      getMeetings(user?.role === "advisor" ? user.id : undefined),
      getStudents(),
      getAdvisors(),
    ]).then(([m, s, a]) => { setMeetings(m); setStudents(s); setAdvisors(a); setLoading(false); });
  }, [user]);

  const filtered = meetings.filter((m) => {
    const d = new Date(m.meeting_date);
    if (filterView === "today") return isToday(d);
    if (filterView === "upcoming") return isFuture(d) || isToday(d);
    if (filterView === "past") return isPast(d) && !isToday(d);
    return true;
  });

  const handleCreate = async () => {
    const student = students.find((s) => s.id === form.student_id);
    const advisor = advisors.find((a) => a.id === form.advisor_id);
    const meeting = await createMeeting({ ...form, student_name: student?.full_name, advisor_name: advisor?.full_name });
    setMeetings((p) => [meeting, ...p].sort((a, b) => b.meeting_date.localeCompare(a.meeting_date)));
    setModal(null);
  };

  const handleStatusUpdate = async () => {
    if (!statusTarget) return;
    await updateMeetingStatus(statusTarget.id, newStatus, statusNotes || undefined);
    setMeetings((p) => p.map((m) => m.id === statusTarget.id ? { ...m, status: newStatus, notes: statusNotes || m.notes } : m));
    // If checked in, also auto-log activity
    if (newStatus === "Checked In" || newStatus === "Completed") {
      await createActivity({
        student_id: statusTarget.student_id,
        student_name: statusTarget.student_name,
        activity_type: "Scheduled Meeting",
        check_in_time: new Date().toISOString(),
        notes: statusNotes || undefined,
        staff_id: user?.id,
        staff_name: user?.full_name,
        meeting_id: statusTarget.id,
        location: statusTarget.location,
      });
    }
    setModal(null);
    setStatusTarget(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this meeting?")) return;
    await deleteMeeting(id);
    setMeetings((p) => p.filter((m) => m.id !== id));
  };

  const todayCount    = meetings.filter((m) => isToday(new Date(m.meeting_date))).length;
  const upcomingCount = meetings.filter((m) => isFuture(new Date(m.meeting_date))).length;
  const noShowCount   = meetings.filter((m) => m.status === "No Show").length;
  const completedCount = meetings.filter((m) => m.status === "Completed").length;

  const inp  = { width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
  const lbl  = { fontSize: 11, fontWeight: 700 as const, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#64748B", marginBottom: 5, display: "block" as const };

  if (loading) return <div style={{ color: "#94A3B8", padding: 40, textAlign: "center" }}>Loading meetings…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>Meetings</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{meetings.length} total · {upcomingCount} upcoming</p>
        </div>
        <button onClick={() => setModal("create")}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Schedule Meeting
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <div style={{ background: NAVY, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Today</p>
          <p style={{ fontSize: 26, fontWeight: 900 }}>{todayCount}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Scheduled for today</p>
        </div>
        <div style={{ background: CARD_DARK, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Upcoming</p>
          <p style={{ fontSize: 26, fontWeight: 900 }}>{upcomingCount}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Future appointments</p>
        </div>
        <div style={{ background: CARD_DARK, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Completed</p>
          <p style={{ fontSize: 26, fontWeight: 900 }}>{completedCount}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Successful meetings</p>
        </div>
        <div style={{ background: noShowCount > 3 ? "#7F1D1D" : CARD_DARK, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>No Shows</p>
          <p style={{ fontSize: 26, fontWeight: 900 }}>{noShowCount}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{meetings.length > 0 ? Math.round(noShowCount/meetings.length*100) : 0}% of all meetings</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["upcoming", "today", "past", "all"] as const).map((v) => (
          <button key={v} onClick={() => setFilterView(v)}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize", background: filterView === v ? NAVY : "#F1F5F9", color: filterView === v ? "#fff" : "#64748B" }}>
            {v}
          </button>
        ))}
      </div>

      {/* Meetings table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
              {["Date & Time", "Student", "Advisor", "Type", "Duration", "Location", "Status", ""].map((h, i) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: i === 7 ? "right" : "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #F8FAFC" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 16px" }}>
                  <p style={{ fontWeight: 600, color: "#0F172A" }}>{format(new Date(m.meeting_date), "MMM d, yyyy")}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8" }}>{m.meeting_time}</p>
                </td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0F172A" }}>{m.student_name}</td>
                <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 12 }}>{m.advisor_name}</td>
                <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 12 }}>{m.meeting_type}</td>
                <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 12 }}>{m.duration_minutes} min</td>
                <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 12 }}>{m.location}</td>
                <td style={{ padding: "12px 16px" }}><StatusBadge status={m.status} /></td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    {(m.status === "Scheduled" || m.status === "Checked In") && (
                      <button onClick={() => { setStatusTarget(m); setNewStatus(m.status === "Scheduled" ? "Checked In" : "Completed"); setStatusNotes(m.notes || ""); setModal("status"); }}
                        style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#475569" }}>
                        Update
                      </button>
                    )}
                    <button onClick={() => handleDelete(m.id)}
                      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", color: "#EF4444" }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8" }}>
            <p style={{ fontWeight: 600, fontSize: 14 }}>No meetings in this view</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Schedule a meeting to get started</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modal === "create" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 22 }}>Schedule Meeting</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Student *</label>
                <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} style={inp}>
                  <option value="">— Select student —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} · {s.student_number}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Advisor *</label>
                <select value={form.advisor_id} onChange={(e) => setForm({ ...form, advisor_id: e.target.value })} style={inp}>
                  <option value="">— Select advisor —</option>
                  {advisors.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Date *</label><input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Time *</label><input type="time" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} style={inp} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Duration (minutes)</label>
                  <select value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })} style={inp}>
                    {[15, 20, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Meeting Type</label>
                  <select value={form.meeting_type} onChange={(e) => setForm({ ...form, meeting_type: e.target.value as MeetingType })} style={inp}>
                    {MEETING_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl}>Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontWeight: 600, fontSize: 13, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreate} disabled={!form.student_id || !form.advisor_id}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: form.student_id && form.advisor_id ? "pointer" : "not-allowed", opacity: form.student_id && form.advisor_id ? 1 : 0.4 }}>
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {modal === "status" && statusTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Update Meeting Status</h3>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>{statusTarget.student_name} · {format(new Date(statusTarget.meeting_date), "MMM d")} at {statusTarget.meeting_time}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lbl}>Status</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {(["Checked In", "Completed", "No Show", "Cancelled", "Rescheduled"] as MeetingStatus[]).map((s) => {
                    const style = STATUS_MAP[s];
                    return (
                      <button key={s} onClick={() => setNewStatus(s)}
                        style={{ padding: "8px 12px", borderRadius: 8, border: `2px solid ${newStatus === s ? style.color : "#E2E8F0"}`, background: newStatus === s ? style.bg : "#fff", color: newStatus === s ? style.color : "#64748B", fontSize: 12, fontWeight: newStatus === s ? 700 : 400, cursor: "pointer" }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div><label style={lbl}>Notes</label><textarea value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} rows={2} placeholder="Add meeting notes…" style={{ ...inp, resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontWeight: 600, fontSize: 13, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleStatusUpdate} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Save Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
