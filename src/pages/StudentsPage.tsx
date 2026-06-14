import { useState, useEffect } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent, getAdvisors, getActivities } from "../lib/db";
import type { TRIOStudent, Profile, Activity } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format, differenceInDays } from "date-fns";

const NAVY = "#1B3A6B";
const CARD_DARK = "#1E293B";

const PROGRAMS = ["TRIO SSS", "TRIO Upward Bound", "WIOA Out Of School"];
const DEPARTMENTS = ["Liberal Arts", "Business", "Health Sciences", "STEM", "Trades & Technology", "Early Childhood"];
const LOCATIONS = ["Naugatuck Valley CC", "Capital CC", "Asnuntuck CC", "Tunxis CC", "Middlesex CC"];

function StatCard({ label, value, sub, color = CARD_DARK }: { label: string; value: string | number; sub: string; color?: string }) {
  return (
    <div style={{ background: color, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{sub}</p>
    </div>
  );
}

function EnrollmentBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active: { bg: "#ECFDF5", color: "#059669" },
    inactive: { bg: "#FEF2F2", color: "#DC2626" },
    graduated: { bg: "#EFF6FF", color: "#2563EB" },
    transferred: { bg: "#F5F3FF", color: "#7C3AED" },
    withdrawn: { bg: "#F8FAFC", color: "#64748B" },
  };
  const s = map[status] || map.active;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, textTransform: "capitalize" }}>{status}</span>;
}

interface StudentDrawer {
  student: TRIOStudent;
  activities: Activity[];
}

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents]     = useState<TRIOStudent[]>([]);
  const [advisors, setAdvisors]     = useState<Profile[]>([]);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<"add" | "edit" | "delete" | null>(null);
  const [editTarget, setEditTarget] = useState<TRIOStudent | null>(null);
  const [drawer, setDrawer]         = useState<StudentDrawer | null>(null);
  const [form, setForm]             = useState<Partial<TRIOStudent>>({
    first_name: "", last_name: "", email: "", phone: "",
    program: "TRIO SSS", department: "Liberal Arts",
    work_location: "Naugatuck Valley CC", enrollment_status: "active",
    first_generation: true, low_income: true, disabled: false,
    gpa: undefined, credit_hours_completed: 0,
  });

  useEffect(() => {
    Promise.all([getStudents(), getAdvisors()]).then(([s, a]) => {
      setStudents(s); setAdvisors(a); setLoading(false);
    });
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = s.full_name.toLowerCase().includes(q) || s.student_number.toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || s.enrollment_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setForm({ first_name: "", last_name: "", email: "", phone: "", program: "TRIO SSS", department: "Liberal Arts", work_location: "Naugatuck Valley CC", enrollment_status: "active", first_generation: true, low_income: true, disabled: false, credit_hours_completed: 0 });
    setEditTarget(null);
    setModal("add");
  };

  const openEdit = (s: TRIOStudent) => { setEditTarget(s); setForm({ ...s }); setModal("edit"); };

  const openDrawer = async (s: TRIOStudent) => {
    const acts = await getActivities();
    setDrawer({ student: s, activities: acts.filter((a) => a.student_id === s.id).slice(0, 10) });
  };

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

  const daysSinceActivity = (s: TRIOStudent) => {
    if (!s.last_activity) return 999;
    return differenceInDays(new Date(), new Date(s.last_activity));
  };

  const inp = { width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const };
  const lbl = { fontSize: 11, fontWeight: 700 as const, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#64748B", marginBottom: 5, display: "block" as const };

  if (loading) return <div style={{ color: "#94A3B8", padding: 40, textAlign: "center" }}>Loading students…</div>;

  const active = students.filter((s) => s.enrollment_status === "active").length;
  const firstGen = students.filter((s) => s.first_generation).length;
  const needAttn = students.filter((s) => daysSinceActivity(s) > 21 && s.enrollment_status === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>Students</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{students.length} enrolled · {active} active</p>
        </div>
        {(user?.role === "director" || user?.role === "advisor") && (
          <button onClick={openAdd}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Student
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Total Enrolled" value={students.length} sub="All programs" color={NAVY} />
        <StatCard label="Active" value={active} sub="Currently enrolled" />
        <StatCard label="First-Generation" value={firstGen} sub={`${Math.round(firstGen / students.length * 100)}% of students`} />
        <StatCard label="Need Attention" value={needAttn} sub="No activity 21+ days" color={needAttn > 0 ? "#92400E" : CARD_DARK} />
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…"
              style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px 9px 36px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#F8FAFC" }} />
          </div>
          {(["all", "active", "inactive", "graduated", "transferred", "withdrawn"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: filterStatus === s ? NAVY : "#F1F5F9", color: filterStatus === s ? "#fff" : "#64748B", textTransform: "capitalize" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
              {["Student", "ID", "Program", "Advisor", "GPA", "Last Activity", "Status", ""].map((h, i) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: i === 7 ? "right" : "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const days = daysSinceActivity(s);
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid #F8FAFC", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => openDrawer(s)}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{s.full_name.split(" ").slice(0,2).map((n) => n[0]).join("")}</span>
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: "#0F172A" }}>{s.full_name}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8" }}>{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "#64748B" }}>{s.student_number}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 12 }}>{s.program}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 12 }}>{s.advisor_name || "—"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: s.gpa && s.gpa < 2.0 ? "#DC2626" : "#0F172A" }}>{s.gpa?.toFixed(2) || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {s.last_activity ? (
                      <span style={{ fontSize: 12, color: days > 21 ? "#DC2626" : days > 14 ? "#D97706" : "#059669", fontWeight: days > 21 ? 700 : 400 }}>
                        {days === 0 ? "Today" : `${days}d ago`}
                      </span>
                    ) : <span style={{ color: "#CBD5E1" }}>Never</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}><EnrollmentBadge status={s.enrollment_status} /></td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button onClick={() => openEdit(s)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", color: "#64748B" }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      </button>
                      <button onClick={() => { setEditTarget(s); setModal("delete"); }} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", color: "#EF4444" }}>
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
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8" }}>
            <p style={{ fontWeight: 600, fontSize: 14 }}>No students found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 22 }}>{modal === "add" ? "Add Student" : "Edit Student"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label style={lbl}>First Name *</label><input value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Last Name *</label><input value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Phone</label><input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Program</label>
                <select value={form.program || ""} onChange={(e) => setForm({ ...form, program: e.target.value })} style={inp}>
                  {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Department</label>
                <select value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} style={inp}>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Campus / Location</label>
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
              <div><label style={lbl}>Credit Hours Completed</label><input type="number" value={form.credit_hours_completed || 0} onChange={(e) => setForm({ ...form, credit_hours_completed: +e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Status</label>
                <select value={form.enrollment_status || "active"} onChange={(e) => setForm({ ...form, enrollment_status: e.target.value as TRIOStudent["enrollment_status"] })} style={inp}>
                  {["active","inactive","graduated","transferred","withdrawn"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 22 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.first_generation || false} onChange={(e) => setForm({ ...form, first_generation: e.target.checked })} />
                  First-Gen
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.low_income || false} onChange={(e) => setForm({ ...form, low_income: e.target.checked })} />
                  Low Income
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.disabled || false} onChange={(e) => setForm({ ...form, disabled: e.target.checked })} />
                  Disabled
                </label>
              </div>
            </div>
            <div style={{ gridColumn: "1/-1", marginTop: 10 }}>
              <label style={lbl}>Notes</label>
              <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontWeight: 600, fontSize: 13, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={!form.first_name?.trim() || !form.last_name?.trim()} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                {modal === "add" ? "Add Student" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && editTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Remove {editTarget.full_name}?</h3>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 22 }}>This will remove the student and all their records. This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontWeight: 600, fontSize: 13, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#EF4444", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Drawer */}
      {drawer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "stretch", justifyContent: "flex-end", zIndex: 999 }} onClick={() => setDrawer(null)}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 480, overflowY: "auto", padding: 28, boxShadow: "-8px 0 32px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{drawer.student.full_name.split(" ").slice(0,2).map((n) => n[0]).join("")}</span>
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{drawer.student.full_name}</h2>
                  <p style={{ fontSize: 12, color: "#94A3B8" }}>{drawer.student.student_number} · {drawer.student.program}</p>
                </div>
              </div>
              <button onClick={() => setDrawer(null)} style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "GPA", value: drawer.student.gpa?.toFixed(2) || "—" },
                { label: "Credits", value: drawer.student.credit_hours_completed || 0 },
                { label: "Advisor", value: drawer.student.advisor_name || "—" },
                { label: "Status", value: drawer.student.enrollment_status },
                { label: "Campus", value: drawer.student.work_location || "—" },
                { label: "Department", value: drawer.student.department || "—" },
              ].map((item) => (
                <div key={item.label} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {drawer.student.first_generation && <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#EFF6FF", color: "#2563EB" }}>First-Gen</span>}
              {drawer.student.low_income && <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#ECFDF5", color: "#059669" }}>Low Income</span>}
              {drawer.student.disabled && <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#F5F3FF", color: "#7C3AED" }}>Disabled</span>}
            </div>

            {drawer.student.notes && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#92400E", marginBottom: 4 }}>Staff Notes</p>
                <p style={{ fontSize: 13, color: "#78350F" }}>{drawer.student.notes}</p>
              </div>
            )}

            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Recent Activity</h3>
            {drawer.activities.length === 0 ? (
              <p style={{ fontSize: 13, color: "#94A3B8" }}>No activity recorded yet.</p>
            ) : (
              drawer.activities.map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{a.activity_type}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>{format(new Date(a.check_in_time), "MMM d, yyyy h:mm a")}{a.duration_minutes ? ` · ${a.duration_minutes} min` : ""}</p>
                    {a.notes && <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{a.notes}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
