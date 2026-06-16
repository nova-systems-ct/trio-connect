import { useState, useEffect } from "react";
import { getTasks, updateTaskStatus, createTask, deleteTask } from "../lib/db";
import type { Task, TaskStatus, TaskCategory, TaskPriority } from "../lib/types";
import { TASK_CATEGORIES } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import { format, isPast, parseISO } from "date-fns";

const C = {
  bg: "#0B0B0B", card: "#1B1B1B", card2: "#151515",
  text1: "#FFFFFF", text2: "#A0A0A0", text3: "#606060",
  red: "#C1121F", redDim: "rgba(193,18,31,0.12)",
  green: "#22C55E", blue: "#3B82F6", purple: "#7C3AED", amber: "#F59E0B",
  border: "rgba(255,255,255,0.07)",
};

function priorityColor(p: TaskPriority) {
  return p === "High" ? C.red : p === "Medium" ? C.amber : C.text3;
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const color = priorityColor(priority);
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: `${color}18`, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {priority}
    </span>
  );
}

function CategoryBadge({ category }: { category: TaskCategory }) {
  const colors: Record<string, string> = {
    "Follow-Up": C.blue, "Academic": C.purple, "Financial Aid": C.green,
    "FAFSA": "#0891B2", "Scholarship": "#D4AF37", "Event": C.amber,
    "Documentation": "#6366F1", "Outreach": "#EC4899", "Other": C.text3,
  };
  const color = colors[category] ?? C.text3;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${color}14`, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {category}
    </span>
  );
}

function TaskCard({ task, onStatusChange, onDelete }: { task: Task; onStatusChange: (id: string, s: TaskStatus) => void; onDelete: (id: string) => void }) {
  const isOverdue = task.due_date && task.status !== "completed" && isPast(parseISO(task.due_date + "T23:59:59"));
  const isDone = task.status === "completed";

  return (
    <div style={{
      background: C.card, border: `1px solid ${isOverdue ? "rgba(193,18,31,0.3)" : C.border}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 10,
      opacity: isDone ? 0.7 : 1, transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <button
          onClick={() => onStatusChange(task.id, isDone ? "pending" : "completed")}
          title={isDone ? "Mark incomplete" : "Mark complete"}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
            border: `1.5px solid ${isDone ? C.green : "rgba(255,255,255,0.2)"}`,
            background: isDone ? C.green : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.1s",
          }}
        >
          {isDone && <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: isDone ? C.text3 : C.text1, textDecoration: isDone ? "line-through" : "none", lineHeight: 1.4, marginBottom: 6 }}>
            {task.title}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: task.student_name || task.due_date ? 8 : 0 }}>
            <PriorityBadge priority={task.priority} />
            <CategoryBadge category={task.category} />
          </div>
          {(task.student_name || task.due_date) && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {task.student_name && (
                <span style={{ fontSize: 10, color: C.text3 }}>
                  <span style={{ color: C.text2 }}>Student:</span> {task.student_name}
                </span>
              )}
              {task.due_date && (
                <span style={{ fontSize: 10, color: isOverdue ? C.red : C.text3, fontWeight: isOverdue ? 700 : 400 }}>
                  {isOverdue ? "⚠ Overdue: " : "Due: "}
                  {format(parseISO(task.due_date), "MMM d")}
                </span>
              )}
            </div>
          )}
          {task.assigned_to_name && (
            <p style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Assigned to {task.assigned_to_name}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(task.id)}
          style={{ color: C.text3, background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0, padding: "0 2px", opacity: 0.5, transition: "opacity 0.1s" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
        >×</button>
      </div>
    </div>
  );
}

interface NewTaskForm {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string;
  student_name: string;
  description: string;
}

const BLANK_FORM: NewTaskForm = { title: "", category: "Follow-Up", priority: "Medium", due_date: "", student_name: "", description: "" };
const inp: React.CSSProperties = { width: "100%", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", background: "#0B0B0B", color: "#fff", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: C.text3, marginBottom: 6, display: "block" };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | TaskCategory>("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewTaskForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getTasks().then(setTasks); }, []);

  const pending    = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const completed  = tasks.filter((t) => t.status === "completed");

  const applyFilter = (list: Task[]) => filter === "all" ? list : list.filter((t) => t.category === filter);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateTaskStatus(id, status);
    setTasks(await getTasks());
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    setTasks(await getTasks());
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await createTask({
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      priority: form.priority,
      status: "pending",
      due_date: form.due_date || undefined,
      student_name: form.student_name || undefined,
      assigned_to_id: user?.id,
      assigned_to_name: user?.full_name,
      created_by_id: user?.id ?? "unknown",
      created_by_name: user?.full_name ?? "Unknown",
    });
    setTasks(await getTasks());
    setForm(BLANK_FORM);
    setShowModal(false);
    setSaving(false);
  };

  const overdueCount = pending.filter((t) => t.due_date && isPast(parseISO(t.due_date + "T23:59:59"))).length;

  const Column = ({ title, items, color, count }: { title: string; items: Task[]; color: string; count: number }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.text2 }}>{title}</h2>
        <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.07)", color: C.text3, padding: "2px 8px", borderRadius: 20 }}>{count}</span>
      </div>
      <div style={{ minHeight: 120 }}>
        {items.length === 0
          ? <div style={{ border: `1px dashed rgba(255,255,255,0.06)`, borderRadius: 12, padding: "32px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: C.text3 }}>No tasks</p>
            </div>
          : items.map((t) => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onDelete={handleDelete} />)
        }
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text1, letterSpacing: "-0.5px" }}>Task Management</h1>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>
            {tasks.length} tasks · {overdueCount > 0 && <span style={{ color: C.red, fontWeight: 700 }}>{overdueCount} overdue · </span>}
            {completed.length} completed
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: C.red, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 2px 10px rgba(193,18,31,0.35)" }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Task
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Pending", value: pending.length, color: C.amber },
          { label: "In Progress", value: inProgress.length, color: C.blue },
          { label: "Completed", value: completed.length, color: C.green },
          { label: "Overdue", value: overdueCount, color: C.red },
        ].map((s) => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${s.label === "Overdue" && s.value > 0 ? "rgba(193,18,31,0.3)" : C.border}`, borderRadius: 12, padding: "14px 18px", borderTop: `2px solid ${s.color}` }}>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text3, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: s.value > 0 && s.label === "Overdue" ? C.red : C.text1, letterSpacing: "-0.5px" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["all", ...TASK_CATEGORIES] as ("all" | TaskCategory)[]).map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: filter === cat ? 700 : 400, border: `1px solid ${filter === cat ? C.red : C.border}`, background: filter === cat ? "rgba(193,18,31,0.12)" : "transparent", color: filter === cat ? "#fff" : C.text2, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            {cat === "all" ? "All Tasks" : cat}
          </button>
        ))}
      </div>

      {/* Kanban columns */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Column title="Pending" items={applyFilter(pending)} color={C.amber} count={applyFilter(pending).length} />
        <Column title="In Progress" items={applyFilter(inProgress)} color={C.blue} count={applyFilter(inProgress).length} />
        <Column title="Completed" items={applyFilter(completed)} color={C.green} count={applyFilter(completed).length} />
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#161616", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 16, padding: "28px 32px", width: 480, maxWidth: "90vw" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text1 }}>New Task</h2>
              <button onClick={() => { setShowModal(false); setForm(BLANK_FORM); }} style={{ background: "none", border: "none", color: C.text3, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Task Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Follow up with student about FAFSA" style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })} style={{ ...inp }}>
                    {TASK_CATEGORIES.map((c) => <option key={c} value={c} style={{ background: "#1a1a1a" }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} style={{ ...inp }}>
                    {(["High", "Medium", "Low"] as TaskPriority[]).map((p) => <option key={p} value={p} style={{ background: "#1a1a1a" }}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Student (optional)</label>
                  <input value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} placeholder="Student name" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Additional details…" rows={2}
                  style={{ ...inp, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button onClick={() => { setShowModal(false); setForm(BLANK_FORM); }}
                  style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={!form.title.trim() || saving}
                  style={{ padding: "9px 20px", borderRadius: 9, background: !form.title.trim() || saving ? "#333" : C.red, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: !form.title.trim() || saving ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif" }}>
                  {saving ? "Saving…" : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
