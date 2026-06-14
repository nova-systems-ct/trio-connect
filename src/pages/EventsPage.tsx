import { useState, useEffect } from "react";
import { getEvents, createEvent, getEventRSVPs, markEventAttendance, getStudents } from "../lib/db";
import type { TRIOEvent, EventRSVP, TRIOStudent, EventType } from "../lib/types";
import { EVENT_TYPES } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format, isFuture, isPast, isToday } from "date-fns";

const NAVY = "#1B3A6B";
const CARD_DARK = "#1E293B";

const TYPE_COLORS: Record<string, string> = {
  "Workshop": "#F59E0B",
  "College Tour": "#10B981",
  "Financial Literacy": "#3B82F6",
  "Scholarship Session": "#C5A028",
  "Transfer Event": "#8B5CF6",
  "Leadership Event": "#EF4444",
  "Career Event": "#EC4899",
  "Other": "#64748B",
};

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents]       = useState<TRIOEvent[]>([]);
  const [students, setStudents]   = useState<TRIOStudent[]>([]);
  const [modal, setModal]         = useState<"create" | "detail" | null>(null);
  const [selected, setSelected]   = useState<TRIOEvent | null>(null);
  const [rsvps, setRsvps]         = useState<EventRSVP[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterView, setFilter]   = useState<"upcoming" | "past" | "all">("upcoming");
  const [form, setForm]           = useState<Partial<TRIOEvent>>({
    title: "", description: "", event_type: "Workshop",
    event_date: new Date().toISOString().split("T")[0],
    start_time: "10:00", end_time: "12:00",
    location: "TRIO Conference Room", capacity: 25,
    program: "TRIO SSS",
  });

  useEffect(() => {
    Promise.all([getEvents(), getStudents()]).then(([e, s]) => {
      setEvents(e); setStudents(s); setLoading(false);
    });
  }, []);

  const openDetail = async (evt: TRIOEvent) => {
    setSelected(evt);
    const r = await getEventRSVPs(evt.id);
    setRsvps(r);
    setModal("detail");
  };

  const handleCreate = async () => {
    const evt = await createEvent({ ...form, host_id: user?.id, host_name: user?.full_name });
    setEvents((p) => [...p, evt].sort((a, b) => a.event_date.localeCompare(b.event_date)));
    setModal(null);
  };

  const handleAttendance = async (eventId: string, studentId: string) => {
    await markEventAttendance(eventId, studentId);
    setSelected((p) => p ? { ...p, attendance_count: (p.attendance_count || 0) + 1 } : p);
    setRsvps((p) => p.filter((r) => r.student_id !== studentId));
  };

  const filtered = events.filter((e) => {
    const d = new Date(e.event_date);
    if (filterView === "upcoming") return isFuture(d) || isToday(d);
    if (filterView === "past") return isPast(d) && !isToday(d);
    return true;
  });

  const upcoming = events.filter((e) => isFuture(new Date(e.event_date)) || isToday(new Date(e.event_date)));
  const past = events.filter((e) => isPast(new Date(e.event_date)) && !isToday(new Date(e.event_date)));
  const totalAttendance = events.reduce((sum, e) => sum + (e.attendance_count || 0), 0);

  const inp = { width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
  const lbl = { fontSize: 11, fontWeight: 700 as const, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#64748B", marginBottom: 5, display: "block" as const };

  if (loading) return <div style={{ color: "#94A3B8", padding: 40, textAlign: "center" }}>Loading events…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>Events</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{events.length} events · {upcoming.length} upcoming</p>
        </div>
        {(user?.role === "director" || user?.role === "advisor") && (
          <button onClick={() => setModal("create")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Event
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <div style={{ background: NAVY, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Total Events</p>
          <p style={{ fontSize: 26, fontWeight: 900 }}>{events.length}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>All programs</p>
        </div>
        <div style={{ background: CARD_DARK, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Upcoming</p>
          <p style={{ fontSize: 26, fontWeight: 900 }}>{upcoming.length}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Scheduled events</p>
        </div>
        <div style={{ background: CARD_DARK, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Past Events</p>
          <p style={{ fontSize: 26, fontWeight: 900 }}>{past.length}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Completed</p>
        </div>
        <div style={{ background: CARD_DARK, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>Total Attendance</p>
          <p style={{ fontSize: 26, fontWeight: 900 }}>{totalAttendance}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Students served</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["upcoming", "past", "all"] as const).map((v) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize", background: filterView === v ? NAVY : "#F1F5F9", color: filterView === v ? "#fff" : "#64748B" }}>
            {v}
          </button>
        ))}
      </div>

      {/* Events grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {filtered.map((evt) => {
          const isPastEvt = isPast(new Date(evt.event_date)) && !isToday(new Date(evt.event_date));
          const fillRate = evt.capacity ? Math.round((evt.rsvp_count || 0) / evt.capacity * 100) : null;
          return (
            <div key={evt.id} onClick={() => openDetail(evt)}
              style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px", cursor: "pointer", transition: "box-shadow 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${TYPE_COLORS[evt.event_type] || "#64748B"}18`, color: TYPE_COLORS[evt.event_type] || "#64748B" }}>{evt.event_type}</span>
                {isPastEvt ? <span style={{ fontSize: 10, color: "#94A3B8" }}>Completed</span> : <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981" }}>Upcoming</span>}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{evt.title}</h3>
              {evt.description && <p style={{ fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{evt.description}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
                  <span style={{ fontSize: 12, color: "#475569" }}>{format(new Date(evt.event_date), "EEEE, MMM d, yyyy")} · {evt.start_time}{evt.end_time ? ` – ${evt.end_time}` : ""}</span>
                </div>
                {evt.location && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    <span style={{ fontSize: 12, color: "#475569" }}>{evt.location}</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#0F172A" }}>{evt.rsvp_count || 0}</p>
                  <p style={{ fontSize: 10, color: "#94A3B8" }}>RSVPs</p>
                </div>
                {isPastEvt && (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "#059669" }}>{evt.attendance_count || 0}</p>
                    <p style={{ fontSize: 10, color: "#94A3B8" }}>Attended</p>
                  </div>
                )}
                {evt.capacity && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>Capacity</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: fillRate! >= 100 ? "#DC2626" : "#0F172A" }}>{fillRate}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, background: "#F1F5F9" }}>
                      <div style={{ width: `${Math.min(fillRate || 0, 100)}%`, height: "100%", borderRadius: 4, background: fillRate! >= 100 ? "#EF4444" : fillRate! >= 80 ? "#F59E0B" : "#10B981" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{evt.rsvp_count || 0} / {evt.capacity} registered</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "48px 0", textAlign: "center", color: "#94A3B8" }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>No events in this view</p>
        </div>
      )}

      {/* Create Modal */}
      {modal === "create" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 22 }}>Create Event</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>Title *</label><input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="FAFSA Workshop" style={inp} /></div>
              <div><label style={lbl}>Event Type</label>
                <select value={form.event_type || "Workshop"} onChange={(e) => setForm({ ...form, event_type: e.target.value as EventType })} style={inp}>
                  {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Date *</label><input type="date" value={form.event_date || ""} onChange={(e) => setForm({ ...form, event_date: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Start Time</label><input type="time" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>End Time</label><input type="time" value={form.end_time || ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} style={inp} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lbl}>Location</label><input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Capacity</label><input type="number" value={form.capacity || ""} onChange={(e) => setForm({ ...form, capacity: +e.target.value })} style={inp} /></div>
              </div>
              <div><label style={lbl}>Description</label><textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inp, resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontWeight: 600, fontSize: 13, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreate} disabled={!form.title?.trim()}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: form.title?.trim() ? "pointer" : "not-allowed", opacity: form.title?.trim() ? 1 : 0.4 }}>
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {modal === "detail" && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${TYPE_COLORS[selected.event_type] || "#64748B"}18`, color: TYPE_COLORS[selected.event_type] || "#64748B", display: "inline-block", marginBottom: 8 }}>{selected.event_type}</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{selected.title}</h2>
              </div>
              <button onClick={() => setModal(null)} style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontSize: 20, flexShrink: 0 }}>×</button>
            </div>

            {selected.description && <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, marginBottom: 16 }}>{selected.description}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { l: "Date", v: format(new Date(selected.event_date), "EEEE, MMMM d, yyyy") },
                { l: "Time", v: `${selected.start_time}${selected.end_time ? ` – ${selected.end_time}` : ""}` },
                { l: "Location", v: selected.location || "TBD" },
                { l: "Capacity", v: selected.capacity ? `${selected.capacity} students` : "Unlimited" },
                { l: "Host", v: selected.host_name || "—" },
                { l: "Program", v: selected.program || "—" },
                { l: "RSVPs", v: selected.rsvp_count || 0 },
                { l: "Attended", v: selected.attendance_count || 0 },
              ].map((item) => (
                <div key={item.l} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", marginBottom: 4 }}>{item.l}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{item.v}</p>
                </div>
              ))}
            </div>

            {/* RSVP list */}
            {rsvps.length > 0 && (
              <>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>Registered Students ({rsvps.length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                  {rsvps.map((r) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "#F8FAFC" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{(r.student_name || "??").split(" ").slice(0,2).map((n) => n[0]).join("")}</span>
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{r.student_name}</span>
                      <button onClick={() => handleAttendance(selected.id, r.student_id)}
                        style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                        Mark Present
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Manual attendance */}
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>Add Walk-In Attendance</h3>
              <select onChange={async (e) => { if (e.target.value) { await handleAttendance(selected.id, e.target.value); e.target.value = ""; } }}
                style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}>
                <option value="">— Select student to mark attended —</option>
                {students.filter((s) => !rsvps.find((r) => r.student_id === s.id)).map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
