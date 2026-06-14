import { useState, useEffect, useRef } from "react";
import { getStudents, createActivity, getMeetings, updateMeetingStatus } from "../lib/db";
import type { TRIOStudent, ActivityType, Meeting } from "../lib/types";
import { ACTIVITY_TYPES } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format } from "date-fns";

const NAVY = "#1B3A6B";

const TYPE_COLORS: Record<string, string> = {
  "Scheduled Meeting": "#3B82F6",
  "Walk-In Advising": "#8B5CF6",
  "Workshop": "#F59E0B",
  "Event": "#10B981",
  "Study Hall": "#06B6D4",
  "Scholarship Assistance": "#C5A028",
  "Transfer Assistance": "#EF4444",
  "Academic Coaching": "#6366F1",
  "Career Coaching": "#EC4899",
  "Resource Center Visit": "#14B8A6",
  "Computer Lab Usage": "#64748B",
  "General Office Visit": "#94A3B8",
  "Other": "#CBD5E1",
};

interface CheckedInRecord {
  id: string;
  student_name: string;
  activity_type: ActivityType;
  check_in_time: string;
  notes?: string;
}

export default function CheckInPage() {
  const { user } = useAuth();
  const [students, setStudents]         = useState<TRIOStudent[]>([]);
  const [search, setSearch]             = useState("");
  const [selectedStudent, setSelected]  = useState<TRIOStudent | null>(null);
  const [activityType, setActivityType] = useState<ActivityType>("Walk-In Advising");
  const [notes, setNotes]               = useState("");
  const [location, setLocation]         = useState("TRIO Office");
  const [checkedIn, setCheckedIn]       = useState<CheckedInRecord[]>([]);
  const [success, setSuccess]           = useState("");
  const [todayMeetings, setTodayMeetings] = useState<Meeting[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStudents().then(setStudents);
    const today = new Date().toISOString().split("T")[0];
    getMeetings().then((m) => setTodayMeetings(m.filter((mtg) => mtg.meeting_date === today && mtg.status === "Scheduled")));
    // Load today's check-ins from session
    const saved = JSON.parse(sessionStorage.getItem("trio-checkins-today") || "[]") as CheckedInRecord[];
    setCheckedIn(saved);
    searchRef.current?.focus();
  }, []);

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_number.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const handleCheckIn = async () => {
    if (!selectedStudent) return;
    const now = new Date().toISOString();

    // Auto-match meeting
    const matchedMeeting = todayMeetings.find((m) =>
      m.student_id === selectedStudent.id &&
      (activityType === "Scheduled Meeting" || m.meeting_type)
    );
    if (matchedMeeting) {
      await updateMeetingStatus(matchedMeeting.id, "Checked In");
      setTodayMeetings((p) => p.map((m) => m.id === matchedMeeting.id ? { ...m, status: "Checked In" } : m));
    }

    await createActivity({
      student_id: selectedStudent.id,
      student_name: selectedStudent.full_name,
      activity_type: activityType,
      check_in_time: now,
      notes: notes || undefined,
      staff_id: user?.id,
      staff_name: user?.full_name,
      location,
      meeting_id: matchedMeeting?.id,
    });

    const record: CheckedInRecord = { id: `ci-${Date.now()}`, student_name: selectedStudent.full_name, activity_type: activityType, check_in_time: now, notes: notes || undefined };
    const updated = [record, ...checkedIn];
    setCheckedIn(updated);
    sessionStorage.setItem("trio-checkins-today", JSON.stringify(updated));

    setSuccess(`${selectedStudent.full_name} checked in${matchedMeeting ? " — meeting auto-confirmed" : ""}`);
    setSelected(null);
    setSearch("");
    setNotes("");
    searchRef.current?.focus();
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginBottom: 4 }}>Student Check-In</h1>
        <p style={{ fontSize: 13, color: "#64748B" }}>Log every interaction with an activity type · {format(new Date(), "EEEE, MMMM d")}</p>
      </div>

      {success && (
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#065F46" }}>{success}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
        {/* Left: Check-in form */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "24px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>Log Interaction</h2>

          {/* Student search */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", display: "block", marginBottom: 6 }}>Student Name or ID</label>
            <input ref={searchRef} value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Search by name or student number…"
              style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
              onBlur={(e) => e.currentTarget.style.borderColor = "#E2E8F0"} />
            {search && !selectedStudent && (
              <div style={{ border: "1px solid #E2E8F0", borderTop: "none", borderRadius: "0 0 8px 8px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                {filteredStudents.length === 0 ? (
                  <p style={{ padding: "12px 16px", fontSize: 13, color: "#94A3B8" }}>No students found</p>
                ) : (
                  filteredStudents.map((s) => (
                    <button key={s.id} onClick={() => { setSelected(s); setSearch(s.full_name); }}
                      style={{ width: "100%", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{s.full_name.split(" ").slice(0,2).map((n) => n[0]).join("")}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{s.full_name}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8" }}>{s.student_number} · {s.program}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected student card */}
          {selectedStudent && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{selectedStudent.full_name.split(" ").slice(0,2).map((n) => n[0]).join("")}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D4ED8" }}>{selectedStudent.full_name}</p>
                <p style={{ fontSize: 12, color: "#3B82F6" }}>{selectedStudent.student_number} · {selectedStudent.program} · {selectedStudent.enrollment_status}</p>
              </div>
              <button onClick={() => { setSelected(null); setSearch(""); }} style={{ color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
          )}

          {/* Activity Type */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", display: "block", marginBottom: 10 }}>Activity Type *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {ACTIVITY_TYPES.map((t) => (
                <button key={t} onClick={() => setActivityType(t)}
                  style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: activityType === t ? 700 : 400, border: `2px solid ${activityType === t ? (TYPE_COLORS[t] || NAVY) : "#E2E8F0"}`, background: activityType === t ? `${(TYPE_COLORS[t] || NAVY)}14` : "#fff", color: activityType === t ? (TYPE_COLORS[t] || NAVY) : "#64748B", cursor: "pointer", textAlign: "left", transition: "all 0.1s", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[t] || NAVY, flexShrink: 0 }} />
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Location + Notes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", display: "block", marginBottom: 6 }}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", display: "block", marginBottom: 6 }}>Notes (optional)</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brief description…"
                style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          <button onClick={handleCheckIn} disabled={!selectedStudent}
            style={{ width: "100%", padding: "14px", borderRadius: 10, background: selectedStudent ? "#10B981" : "#E2E8F0", color: selectedStudent ? "#fff" : "#94A3B8", fontWeight: 800, fontSize: 15, border: "none", cursor: selectedStudent ? "pointer" : "not-allowed", letterSpacing: "0.03em" }}>
            {selectedStudent ? `Check In ${selectedStudent.first_name}` : "Select a Student"}
          </button>
        </div>

        {/* Right: Today's log + Today's meetings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Today's meetings with matching */}
          {todayMeetings.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "18px 20px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Today's Scheduled Meetings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {todayMeetings.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: m.status === "Checked In" ? "#ECFDF5" : "#F8FAFC", border: `1px solid ${m.status === "Checked In" ? "#A7F3D0" : "#F1F5F9"}` }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{m.student_name}</p>
                      <p style={{ fontSize: 11, color: "#94A3B8" }}>{m.meeting_time} · {m.meeting_type}</p>
                    </div>
                    {m.status === "Checked In" ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "2px 8px", borderRadius: 10 }}>Checked In</span>
                    ) : (
                      <button onClick={() => { setSelected(students.find((s) => s.id === m.student_id) || null); setSearch(m.student_name || ""); setActivityType("Scheduled Meeting"); }}
                        style={{ fontSize: 11, fontWeight: 700, color: NAVY, background: "#EFF6FF", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                        Check In
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's log */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
              Today's Log <span style={{ fontWeight: 400, color: "#94A3B8" }}>({checkedIn.length})</span>
            </h3>
            {checkedIn.length === 0 ? (
              <p style={{ fontSize: 12, color: "#CBD5E1", textAlign: "center", padding: "20px 0" }}>No check-ins today yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                {checkedIn.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "#F8FAFC" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLORS[c.activity_type] || "#CBD5E1", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.student_name}</p>
                      <p style={{ fontSize: 11, color: "#94A3B8" }}>{c.activity_type} · {format(new Date(c.check_in_time), "h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity type breakdown */}
          {checkedIn.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "18px 20px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Today's Breakdown</h3>
              {Object.entries(
                checkedIn.reduce<Record<string, number>>((acc, c) => { acc[c.activity_type] = (acc[c.activity_type] || 0) + 1; return acc; }, {})
              ).map(([type, count]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLORS[type] || "#CBD5E1", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{type}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
