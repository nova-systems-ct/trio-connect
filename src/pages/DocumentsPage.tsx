import { useState, useEffect } from "react";
import { getDocuments, createDocument, deleteDocument, getStudents } from "../lib/db";
import type { StudentDocument, DocumentCategory, TRIOStudent } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format } from "date-fns";

const C = {
  card: "#1B1B1B", card2: "#151515", text1: "#FFFFFF", text2: "#A0A0A0", text3: "#606060",
  red: "#C1121F", redDim: "rgba(193,18,31,0.12)",
  gold: "#D4AF37", goldDim: "rgba(212,175,55,0.12)",
  green: "#22C55E", blue: "#3B82F6", amber: "#F59E0B", purple: "#7C3AED",
  border: "rgba(255,255,255,0.07)",
};
const inp: React.CSSProperties = { width: "100%", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#0B0B0B", color: C.text1, fontFamily: "'Inter', sans-serif" };
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.text3, marginBottom: 6, display: "block" };

const CATEGORIES: DocumentCategory[] = ["FAFSA", "Consent Form", "Scholarship", "Academic", "Program Form", "Other"];

const CAT_STYLE: Record<DocumentCategory, [string, string]> = {
  "FAFSA":        [C.blue,   "rgba(59,130,246,0.12)"],
  "Consent Form": [C.green,  "rgba(34,197,94,0.10)"],
  "Scholarship":  [C.gold,   "rgba(212,175,55,0.12)"],
  "Academic":     [C.purple, "rgba(124,58,237,0.10)"],
  "Program Form": [C.amber,  "rgba(245,158,11,0.10)"],
  "Other":        [C.text3,  "rgba(255,255,255,0.07)"],
};

const CAT_ICON: Record<DocumentCategory, string> = {
  "FAFSA": "📋", "Consent Form": "✍️", "Scholarship": "🎓",
  "Academic": "📚", "Program Form": "📄", "Other": "📎",
};

function fileTypeIcon(name: string) {
  if (name.endsWith(".pdf")) return "📕";
  if (name.endsWith(".docx") || name.endsWith(".doc")) return "📘";
  if (name.endsWith(".xlsx") || name.endsWith(".csv")) return "📗";
  if (name.endsWith(".jpg") || name.endsWith(".png")) return "🖼";
  return "📄";
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs]         = useState<StudentDocument[]>([]);
  const [students, setStudents] = useState<TRIOStudent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filterCat, setFilterCat] = useState<DocumentCategory | "all">("all");
  const [filterStudent, setFilterStudent] = useState("");
  const [search, setSearch]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm]         = useState<Partial<StudentDocument & { file_name_input: string }>>({
    student_id: "", category: "Academic", notes: "", file_name_input: "",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    Promise.all([getDocuments(), getStudents()]).then(([d, s]) => {
      setDocs(d); setStudents(s); setLoading(false);
    });
  }, []);

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.file_name.toLowerCase().includes(q) || (d.student_name ?? "").toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
    const matchCat = filterCat === "all" || d.category === filterCat;
    const matchStudent = !filterStudent || d.student_id === filterStudent;
    return matchSearch && matchCat && matchStudent;
  });

  async function handleUpload() {
    if (!user || !form.student_id || !form.file_name_input?.trim()) return;
    setSaveStatus("saving");
    const student = students.find((s) => s.id === form.student_id);
    const doc = await createDocument({
      student_id: form.student_id!,
      student_name: student?.full_name,
      uploaded_by_id: user.id,
      uploaded_by_name: user.full_name,
      file_name: form.file_name_input!.trim(),
      file_size: "—",
      category: (form.category as DocumentCategory) || "Other",
      notes: form.notes,
    });
    setDocs((p) => [doc, ...p]);
    setSaveStatus("saved");
    setTimeout(() => { setSaveStatus("idle"); setUploading(false); setForm({ student_id: "", category: "Academic", notes: "", file_name_input: "" }); }, 1200);
  }

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setDocs((p) => p.filter((d) => d.id !== id));
  }

  const catCounts: Partial<Record<DocumentCategory, number>> = {};
  docs.forEach((d) => { catCounts[d.category] = (catCounts[d.category] ?? 0) + 1; });

  if (loading) return <div style={{ color: C.text3, padding: 40, textAlign: "center" }}>Loading documents…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.25s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text1, letterSpacing: "-0.5px" }}>Document Center</h1>
          <p style={{ fontSize: 13, color: C.text3, marginTop: 3 }}>Store and manage all student-related files · FERPA-compliant</p>
        </div>
        <button onClick={() => setUploading(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: C.red, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 2px 8px rgba(193,18,31,0.3)" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          Add Document
        </button>
      </div>

      {/* Category overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
        {CATEGORIES.map((cat) => {
          const [color, bg] = CAT_STYLE[cat];
          const count = catCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? "all" : cat)}
              style={{ padding: "14px 10px", borderRadius: 12, background: filterCat === cat ? bg : C.card, border: `1.5px solid ${filterCat === cat ? color + "40" : C.border}`, cursor: "pointer", textAlign: "center", transition: "all 0.1s", fontFamily: "'Inter', sans-serif" }}
            >
              <p style={{ fontSize: 22, marginBottom: 6 }}>{CAT_ICON[cat]}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: filterCat === cat ? color : C.text2, marginBottom: 2 }}>{cat}</p>
              <p style={{ fontSize: 11, fontWeight: 800, color: filterCat === cat ? color : C.text3 }}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={C.text3} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" style={{ ...inp, paddingLeft: 34 }} />
        </div>
        <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} style={{ ...inp, width: "auto", padding: "9px 14px" }}>
          <option value="">All Students</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        {(search || filterCat !== "all" || filterStudent) && (
          <button onClick={() => { setSearch(""); setFilterCat("all"); setFilterStudent(""); }} style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.text3, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Clear</button>
        )}
        <span style={{ fontSize: 11, color: C.text3, marginLeft: "auto" }}>{filtered.length} of {docs.length} documents</span>
      </div>

      {/* Document list */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📂</p>
            <p style={{ fontSize: 14, color: C.text3 }}>No documents found</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.card2 }}>
                {["Document", "Student", "Category", "Uploaded By", "Date", ""].map((h, i) => (
                  <th key={`hd${i}`} style={{ padding: "11px 16px", textAlign: i === 5 ? "right" : "left", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.text3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const [catColor, catBg] = CAT_STYLE[d.category];
                return (
                  <tr key={d.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: "background 0.1s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{fileTypeIcon(d.file_name)}</span>
                        <div>
                          <p style={{ fontWeight: 600, color: C.text1 }}>{d.file_name}</p>
                          {d.notes && <p style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{d.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: C.text2, fontSize: 12 }}>{d.student_name ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 12, background: catBg, color: catColor }}>{d.category}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: C.text2, fontSize: 12 }}>{d.uploaded_by_name}</td>
                    <td style={{ padding: "12px 16px", color: C.text3, fontSize: 12 }}>{format(new Date(d.created_at), "MMM d, yyyy")}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button onClick={() => handleDelete(d.id)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(193,18,31,0.25)", background: C.redDim, cursor: "pointer", color: C.red }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload modal */}
      {uploading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={() => setUploading(false)}>
          <div style={{ background: C.card2, borderRadius: 18, padding: 28, width: "100%", maxWidth: 480, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text1 }}>Add Document</h3>
              <button onClick={() => setUploading(false)} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: C.text2, cursor: "pointer", borderRadius: 8, width: 32, height: 32, fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Student *</label>
                <select value={form.student_id || ""} onChange={(e) => setForm({ ...form, student_id: e.target.value })} style={inp}>
                  <option value="">— Select a student —</option>
                  {students.filter((s) => s.enrollment_status === "active").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>File Name *</label>
                <input value={form.file_name_input || ""} onChange={(e) => setForm({ ...form, file_name_input: e.target.value })} placeholder="e.g. FAFSA_2025_26_John_Doe.pdf" style={inp} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select value={form.category || "Academic"} onChange={(e) => setForm({ ...form, category: e.target.value as DocumentCategory })} style={inp}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Notes (optional)</label>
                <input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Brief description…" style={inp} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: C.text3, marginTop: 14, marginBottom: 18 }}>📎 In production, this will upload the actual file to secure FERPA-compliant cloud storage.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setUploading(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${C.border}`, background: "none", color: C.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              <button onClick={handleUpload} disabled={!form.student_id || !form.file_name_input?.trim() || saveStatus === "saving"} style={{ flex: 2, padding: "11px", borderRadius: 10, background: saveStatus === "saved" ? "#22C55E" : C.red, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "background 0.2s" }}>
                {saveStatus === "saved" ? "✓ Added!" : saveStatus === "saving" ? "Adding…" : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
