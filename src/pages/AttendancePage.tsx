import { useState, useEffect, useRef } from "react";
import { getStudents, getActivities, createActivity, updateActivity } from "../lib/db";
import type { TRIOStudent, Activity, ActivityType } from "../lib/types";
import { ACTIVITY_TYPES } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format, differenceInMinutes, startOfWeek, startOfMonth } from "date-fns";

const CARD  = "#111827";
const CARD2 = "#1A2236";
const TEXT  = "#F8FAFC";
const TEXT2 = "#94A3B8";
const TEXT3 = "#475569";
const RED   = "#D72638";
const GREEN = "#22C55E";
const BORDER = "rgba(248,250,252,0.06)";

type Period = "today" | "week" | "month";

const inp: React.CSSProperties = {
  width: "100%", background: CARD2, border: `1px solid ${BORDER}`,
  borderRadius: 9, padding: "10px 13px", fontSize: 13, color: TEXT,
  outline: "none", fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const,
  letterSpacing: "0.08em", color: TEXT3, marginBottom: 5, display: "block",
};

function StatCard({ label, value, sub, color = TEXT }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "22px 24px" }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 900, color, letterSpacing: "-1.5px", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: TEXT3, marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px" }}>
      <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: TEXT2, marginBottom: 4 }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: TEXT3 }}>{sub}</p>}
    </div>
  );
}

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function timeSince(iso: string) {
  const mins = differenceInMinutes(new Date(), new Date(iso));
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [students, setStudents]       = useState<TRIOStudent[]>([]);
  const [activities, setActivities]   = useState<Activity[]>([]);
  const [period, setPeriod]           = useState<Period>("today");
  const [showModal, setShowModal]     = useState(false);
  const [modalStep, setModalStep]     = useState<"search" | "reason">("search");
  const [searchQ, setSearchQ]         = useState("");
  const [selectedStudent, setSelected] = useState<TRIOStudent | null>(null);
  const [actType, setActType]         = useState<ActivityType>("Walk-In Advising");
  const [notes, setNotes]             = useState("");
  const [location, setLocation]       = useState("TRIO Office");
  const [submitting, setSubmitting]   = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];
  const monthStart = startOfMonth(new Date()).toISOString().split("T")[0];

  async function reload() {
    const [s, a] = await Promise.all([getStudents(), getActivities()]);
    setStudents(s);
    setActivities(a);
  }

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (showModal && modalStep === "search") setTimeout(() => searchRef.current?.focus(), 80);
  }, [showModal, modalStep]);

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.student_number.toLowerCase().includes(searchQ.toLowerCase())
  ).slice(0, 6);

  // Period filtering
  const cutoff = period === "today" ? today
    : period === "week" ? weekStart
    : monthStart;
  const periodActivities = activities.filter((a) => a.check_in_time.slice(0, 10) >= cutoff);
  const todayActivities  = activities.filter((a) => a.check_in_time.startsWith(today));

  // Currently checked in = no checkout time (use today's activities)
  const active = todayActivities.filter((a) => !a.check_out_time);
  const completed = periodActivities.filter((a) => a.check_out_time);

  // Stats
  const avgDuration = completed.length > 0
    ? Math.round(completed.reduce((sum, a) => sum + (a.duration_minutes ?? 0), 0) / completed.length)
    : 0;
  const longCheckins = active.filter((a) => differenceInMinutes(new Date(), new Date(a.check_in_time)) > 120);

  // Visit reason breakdown (today)
  const reasonCounts: Record<string, number> = {};
  todayActivities.forEach((a) => { reasonCounts[a.activity_type] = (reasonCounts[a.activity_type] ?? 0) + 1; });
  const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  async function handleCheckIn() {
    if (!selectedStudent) return;
    setSubmitting(true);
    await createActivity({
      student_id: selectedStudent.id,
      student_name: selectedStudent.full_name,
      activity_type: actType,
      check_in_time: new Date().toISOString(),
      notes: notes || undefined,
      staff_id: user?.id,
      staff_name: user?.full_name,
      location,
    });
    setSubmitting(false);
    setSuccessMsg(`${selectedStudent.full_name} checked in successfully.`);
    setTimeout(() => setSuccessMsg(""), 3000);
    resetModal();
    reload();
  }

  async function handleCheckOut(activity: Activity) {
    const now = new Date();
    const mins = differenceInMinutes(now, new Date(activity.check_in_time));
    await updateActivity(activity.id, {
      check_out_time: now.toISOString(),
      duration_minutes: mins,
    });
    reload();
  }

  function resetModal() {
    setShowModal(false);
    setModalStep("search");
    setSearchQ("");
    setSelected(null);
    setActType("Walk-In Advising");
    setNotes("");
    setLocation("TRIO Office");
  }

  function handleStudentSelect(s: TRIOStudent) {
    setSelected(s);
    setModalStep("reason");
  }

  const isStaff = user?.role !== "student";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1080, animation: "fadeIn 0.2s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: "-0.7px" }}>Attendance</h1>
          <p style={{ fontSize: 13, color: TEXT3, marginTop: 4 }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")} · Live attendance tracking
          </p>
        </div>
        {isStaff && (
          <button onClick={() => setShowModal(true)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "11px 22px", borderRadius: 10, background: RED,
            color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Inter', sans-serif",
            boxShadow: "0 4px 16px rgba(215,38,56,0.3)",
          }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Check In Student
          </button>
        )}
      </div>

      {/* Success toast */}
      {successMsg && (
        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 18px", fontSize: 13, color: GREEN, display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          {successMsg}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Checked In Now" value={active.length} sub="currently in office" color={active.length > 0 ? GREEN : TEXT} />
        <StatCard label="Today's Visits" value={todayActivities.length} sub="total check-ins today" />
        <StatCard label="Avg Visit Length" value={avgDuration > 0 ? durationLabel(avgDuration) : "—"} sub="completed sessions" />
        <StatCard label="Need Check-Out" value={longCheckins.length} sub="checked in 2h+" color={longCheckins.length > 0 ? "#F59E0B" : TEXT} />
      </div>

      {/* Active + Log */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, alignItems: "start" }}>

        {/* Currently Checked In */}
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "15px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, flexShrink: 0, animation: active.length > 0 ? "liveDot 2s ease-in-out infinite" : "none" }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Currently Checked In</p>
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, background: active.length > 0 ? `${GREEN}15` : "rgba(248,250,252,0.05)", color: active.length > 0 ? GREEN : TEXT3, padding: "2px 8px", borderRadius: 20 }}>{active.length}</span>
          </div>
          <div>
            {active.length === 0 ? (
              <EmptyState icon="✓" title="No One Checked In" sub="Check in a student to see them here." />
            ) : (
              active.map((a) => {
                const mins = differenceInMinutes(new Date(), new Date(a.check_in_time));
                const overdue = mins > 120;
                return (
                  <div key={a.id} style={{ padding: "13px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${RED}14`, border: `1px solid ${RED}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: RED }}>{a.student_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{a.student_name}</p>
                        <p style={{ fontSize: 11, color: TEXT3 }}>{a.activity_type}</p>
                      </div>
                      <span style={{ fontSize: 10, color: overdue ? "#F59E0B" : TEXT3, fontWeight: overdue ? 700 : 400 }}>{timeSince(a.check_in_time)}</span>
                    </div>
                    {isStaff && (
                      <button onClick={() => handleCheckOut(a)} style={{
                        width: "100%", padding: "6px", borderRadius: 7, background: "none",
                        border: `1px solid ${BORDER}`, color: TEXT2, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'Inter', sans-serif",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${GREEN}40`; e.currentTarget.style.color = GREEN; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; }}>
                        Check Out
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {topReasons.length > 0 && (
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT3, marginBottom: 8 }}>Today's Top Reasons</p>
              {topReasons.map(([reason, count]) => (
                <div key={reason} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: TEXT2 }}>{reason}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Log */}
        <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "15px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Attendance Log</p>
            <div style={{ display: "flex", gap: 4 }}>
              {(["today", "week", "month"] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: period === p ? RED : "transparent",
                  color: period === p ? "#fff" : TEXT3,
                  fontSize: 11, fontWeight: period === p ? 700 : 400,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          {periodActivities.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 130px 100px 80px", padding: "9px 18px", borderBottom: `1px solid ${BORDER}` }}>
              {["Student", "Reason", "Check In", "Duration", ""].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT3 }}>{h}</span>
              ))}
            </div>
          )}

          <div>
            {periodActivities.length === 0 ? (
              <EmptyState icon="📋" title="No Attendance Records" sub={`No visits recorded ${period === "today" ? "today" : period === "week" ? "this week" : "this month"} yet.`} />
            ) : (
              periodActivities.map((a) => (
                <div key={a.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 180px 130px 100px 80px",
                  padding: "12px 18px", borderBottom: `1px solid ${BORDER}`,
                  alignItems: "center",
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(248,250,252,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{a.student_name ?? "Unknown"}</p>
                    {a.notes && <p style={{ fontSize: 10, color: TEXT3, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.notes}</p>}
                  </div>
                  <span style={{ fontSize: 12, color: TEXT2 }}>{a.activity_type}</span>
                  <span style={{ fontSize: 12, color: TEXT3 }}>{format(new Date(a.check_in_time), "h:mm a")}</span>
                  <span style={{ fontSize: 12, color: a.check_out_time ? TEXT2 : "#F59E0B", fontWeight: a.check_out_time ? 400 : 600 }}>
                    {a.check_out_time ? durationLabel(a.duration_minutes ?? 0) : "Active"}
                  </span>
                  <div>
                    {!a.check_out_time && isStaff && (
                      <button onClick={() => handleCheckOut(a)} style={{
                        padding: "4px 10px", borderRadius: 6, background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.2)", color: GREEN,
                        fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                      }}>Out</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {periodActivities.length > 0 && (
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: TEXT3 }}>{periodActivities.length} record{periodActivities.length !== 1 ? "s" : ""}</span>
              <button style={{
                padding: "6px 14px", borderRadius: 7, border: `1px solid ${BORDER}`,
                background: "none", color: TEXT2, fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>Export CSV</button>
            </div>
          )}
        </div>
      </div>

      {/* Check-In Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) resetModal(); }}>
          <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: "32px", width: 460, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, letterSpacing: "-0.4px" }}>
                  {modalStep === "search" ? "Check In Student" : `Check In — ${selectedStudent?.full_name}`}
                </h2>
                <p style={{ fontSize: 12, color: TEXT3, marginTop: 3 }}>
                  {modalStep === "search" ? "Search by name or student ID" : "Select visit reason and any notes"}
                </p>
              </div>
              <button onClick={resetModal} style={{ background: "none", border: "none", color: TEXT3, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            {modalStep === "search" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={lbl}>Search Student</label>
                  <input ref={searchRef} value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Name or student ID…" style={inp} />
                </div>

                {searchQ.trim().length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {filteredStudents.length === 0 ? (
                      <p style={{ fontSize: 12, color: TEXT3, padding: "12px 0", textAlign: "center" }}>No students found.</p>
                    ) : (
                      filteredStudents.map((s) => {
                        const alreadyIn = active.some((a) => a.student_id === s.id);
                        return (
                          <button key={s.id} onClick={() => !alreadyIn && handleStudentSelect(s)} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                            borderRadius: 10, border: `1px solid ${alreadyIn ? "rgba(34,197,94,0.2)" : BORDER}`,
                            background: alreadyIn ? "rgba(34,197,94,0.05)" : "rgba(248,250,252,0.03)",
                            color: TEXT, textAlign: "left", cursor: alreadyIn ? "default" : "pointer",
                            fontFamily: "'Inter', sans-serif",
                          }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${RED}14`, border: `1px solid ${RED}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: RED }}>{s.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: alreadyIn ? TEXT3 : TEXT }}>{s.full_name}</p>
                              <p style={{ fontSize: 11, color: TEXT3 }}>{s.student_number} · {s.advisor_name?.split(" ")[0]}</p>
                            </div>
                            {alreadyIn && <span style={{ fontSize: 10, fontWeight: 700, color: GREEN, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.1)" }}>Checked In</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {searchQ.trim().length === 0 && students.length === 0 && (
                  <p style={{ fontSize: 12, color: TEXT3, textAlign: "center", padding: "20px 0" }}>No students in the system yet.</p>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Student summary */}
                <div style={{ background: CARD2, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${RED}14`, border: `1px solid ${RED}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: RED }}>{selectedStudent?.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{selectedStudent?.full_name}</p>
                    <p style={{ fontSize: 11, color: TEXT3 }}>{selectedStudent?.student_number} · {selectedStudent?.advisor_name}</p>
                  </div>
                  <button onClick={() => setModalStep("search")} style={{ marginLeft: "auto", fontSize: 11, color: TEXT3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Change</button>
                </div>

                {/* Visit reason */}
                <div>
                  <label style={lbl}>Visit Reason</label>
                  <select value={actType} onChange={(e) => setActType(e.target.value as ActivityType)} style={{ ...inp, cursor: "pointer" }}>
                    {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label style={lbl}>Location</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    {["TRIO Office", "Advising Room", "Computer Lab", "Study Hall", "Conference Room", "Virtual", "Other"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label style={lbl}>Session Notes <span style={{ color: TEXT3, fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brief notes about this visit…"
                    rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={resetModal} style={{
                    flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${BORDER}`,
                    background: "none", color: TEXT2, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  }}>Cancel</button>
                  <button onClick={handleCheckIn} disabled={submitting} style={{
                    flex: 2, padding: "11px", borderRadius: 10, background: submitting ? "#7F1D28" : RED,
                    border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: submitting ? "default" : "pointer", fontFamily: "'Inter', sans-serif",
                  }}>
                    {submitting ? "Checking In…" : "Check In"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
