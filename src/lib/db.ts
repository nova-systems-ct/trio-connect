/**
 * Database abstraction: uses Supabase when configured, localStorage demo otherwise.
 * All functions return the same shape regardless of backend.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  TRIOStudent, Activity, Meeting, TRIOEvent, EventRSVP,
  Notification, Scholarship, DashboardStats, Profile,
  ActivityType, MeetingStatus, ReportFilters, UserRole, AIInsight,
  StudentNote, Message, StudentDocument, Task, TaskStatus,
} from "./types";
import {
  DEMO_STUDENTS, DEMO_ACTIVITIES, DEMO_MEETINGS, DEMO_EVENTS,
  DEMO_RSVPS, DEMO_NOTIFICATIONS, DEMO_SCHOLARSHIPS, DEMO_STATS,
  DEMO_PROFILES, DEMO_ACCOUNTS, DEMO_AI_INSIGHTS,
  DEMO_STUDENT_NOTES, DEMO_MESSAGES, DEMO_DOCUMENTS, DEMO_TASKS,
} from "./demo-data";

// ── Local (demo) store ────────────────────────────────────────────────────────
const LOCAL_KEYS = {
  students: "trio-students-v1",
  activities: "trio-activities-v1",
  meetings: "trio-meetings-v1",
  events: "trio-events-v1",
  rsvps: "trio-rsvps-v1",
  notifications: "trio-notifications-v1",
  scholarships: "trio-scholarships-v1",
  profiles: "trio-profiles-v1",
  session: "trio-session-v1",
  notes: "trio-notes-v1",
  messages: "trio-messages-v1",
  documents: "trio-documents-v1",
  tasks: "trio-tasks-v1",
};

function read<T>(key: string, fallback: T[]): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[]; } catch { return fallback; }
}
function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function initDemo() {
  if (!localStorage.getItem(LOCAL_KEYS.students)) write(LOCAL_KEYS.students, DEMO_STUDENTS);
  if (!localStorage.getItem(LOCAL_KEYS.activities)) write(LOCAL_KEYS.activities, DEMO_ACTIVITIES);
  if (!localStorage.getItem(LOCAL_KEYS.meetings)) write(LOCAL_KEYS.meetings, DEMO_MEETINGS);
  if (!localStorage.getItem(LOCAL_KEYS.events)) write(LOCAL_KEYS.events, DEMO_EVENTS);
  if (!localStorage.getItem(LOCAL_KEYS.rsvps)) write(LOCAL_KEYS.rsvps, DEMO_RSVPS);
  if (!localStorage.getItem(LOCAL_KEYS.notifications)) write(LOCAL_KEYS.notifications, DEMO_NOTIFICATIONS);
  if (!localStorage.getItem(LOCAL_KEYS.scholarships)) write(LOCAL_KEYS.scholarships, DEMO_SCHOLARSHIPS);
  if (!localStorage.getItem(LOCAL_KEYS.profiles)) write(LOCAL_KEYS.profiles, DEMO_PROFILES);
  if (!localStorage.getItem(LOCAL_KEYS.notes)) write(LOCAL_KEYS.notes, DEMO_STUDENT_NOTES);
  if (!localStorage.getItem(LOCAL_KEYS.messages)) write(LOCAL_KEYS.messages, DEMO_MESSAGES);
  if (!localStorage.getItem(LOCAL_KEYS.documents)) write(LOCAL_KEYS.documents, DEMO_DOCUMENTS);
  if (!localStorage.getItem(LOCAL_KEYS.tasks)) write(LOCAL_KEYS.tasks, DEMO_TASKS);
}

initDemo();

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export async function signIn(email: string, password: string): Promise<{ user: SessionUser | null; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    if (!profile) return { user: null, error: "Profile not found" };
    return { user: { id: data.user.id, email: data.user.email!, full_name: profile.full_name, role: profile.role }, error: null };
  }

  // Demo mode
  const account = Object.values(DEMO_ACCOUNTS).find(
    (a) => a.email === email.trim() && a.password === password
  );
  if (!account) return { user: null, error: "Invalid email or password" };
  const user: SessionUser = { id: account.profile.id, email: account.email, full_name: account.profile.full_name, role: account.profile.role };
  localStorage.setItem(LOCAL_KEYS.session, JSON.stringify(user));
  return { user, error: null };
}

export function signOut() {
  if (isSupabaseConfigured && supabase) { supabase.auth.signOut(); }
  localStorage.removeItem(LOCAL_KEYS.session);
}

export function getSession(): SessionUser | null {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEYS.session) || "null"); } catch { return null; }
}

// ── Students ──────────────────────────────────────────────────────────────────
export async function getStudents(): Promise<TRIOStudent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("students").select("*, advisor:profiles!students_advisor_id_fkey(full_name)").order("last_name");
    return (data || []).map((s: Record<string, unknown>) => ({ ...s, full_name: `${s.first_name} ${s.last_name}`, advisor_name: (s.advisor as { full_name?: string })?.full_name })) as unknown as TRIOStudent[];
  }
  return read<TRIOStudent>(LOCAL_KEYS.students, DEMO_STUDENTS);
}

export async function createStudent(data: Partial<TRIOStudent>): Promise<TRIOStudent> {
  const now = new Date().toISOString();
  const student: TRIOStudent = {
    id: `stu-${Date.now()}`,
    student_number: `TRIO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    full_name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
    email: data.email,
    phone: data.phone,
    date_of_birth: data.date_of_birth,
    program: data.program || "TRIO SSS",
    enrollment_date: data.enrollment_date || now.split("T")[0],
    enrollment_status: data.enrollment_status || "active",
    gpa: data.gpa,
    credit_hours_completed: data.credit_hours_completed || 0,
    first_generation: data.first_generation ?? false,
    low_income: data.low_income ?? false,
    disabled: data.disabled ?? false,
    advisor_id: data.advisor_id,
    advisor_name: data.advisor_name,
    work_location: data.work_location,
    department: data.department,
    notes: data.notes,
    created_at: now,
    updated_at: now,
  };
  if (isSupabaseConfigured && supabase) {
    const { data: created } = await supabase.from("students").insert(student).select().single();
    return created || student;
  }
  const students = read<TRIOStudent>(LOCAL_KEYS.students, DEMO_STUDENTS);
  students.push(student);
  write(LOCAL_KEYS.students, students);
  return student;
}

export async function updateStudent(id: string, updates: Partial<TRIOStudent>): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("students").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    return;
  }
  const students = read<TRIOStudent>(LOCAL_KEYS.students, DEMO_STUDENTS);
  write(LOCAL_KEYS.students, students.map((s) => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
}

export async function deleteStudent(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) { await supabase.from("students").delete().eq("id", id); return; }
  write(LOCAL_KEYS.students, read<TRIOStudent>(LOCAL_KEYS.students, []).filter((s) => s.id !== id));
}

// ── Activities ────────────────────────────────────────────────────────────────
export async function getActivities(filters?: Partial<ReportFilters>): Promise<Activity[]> {
  if (isSupabaseConfigured && supabase) {
    let q = supabase.from("activities").select("*, student:students(first_name,last_name), staff:profiles(full_name)").order("check_in_time", { ascending: false });
    if (filters?.start_date) q = q.gte("check_in_time", filters.start_date);
    if (filters?.end_date) q = q.lte("check_in_time", filters.end_date + "T23:59:59");
    if (filters?.activity_type) q = q.eq("activity_type", filters.activity_type);
    const { data } = await q;
    return (data || []).map((a: Record<string, unknown>) => ({
      ...a,
      student_name: [(a.student as { first_name?: string })?.first_name, (a.student as { last_name?: string })?.last_name].filter(Boolean).join(" "),
      staff_name: (a.staff as { full_name?: string })?.full_name,
    })) as unknown as Activity[];
  }
  let acts = read<Activity>(LOCAL_KEYS.activities, DEMO_ACTIVITIES);
  if (filters?.start_date) acts = acts.filter((a) => a.check_in_time >= filters.start_date!);
  if (filters?.end_date) acts = acts.filter((a) => a.check_in_time <= filters.end_date! + "T23:59:59");
  if (filters?.activity_type) acts = acts.filter((a) => a.activity_type === filters.activity_type);
  return acts.sort((a, b) => b.check_in_time.localeCompare(a.check_in_time));
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  const now = new Date().toISOString();
  const activity: Activity = {
    id: `act-${Date.now()}`,
    student_id: data.student_id || "",
    student_name: data.student_name,
    activity_type: data.activity_type || "General Office Visit",
    check_in_time: data.check_in_time || now,
    check_out_time: data.check_out_time,
    duration_minutes: data.duration_minutes,
    notes: data.notes,
    staff_id: data.staff_id,
    staff_name: data.staff_name,
    location: data.location,
    meeting_id: data.meeting_id,
    event_id: data.event_id,
    created_at: now,
  };
  if (isSupabaseConfigured && supabase) {
    const { data: created } = await supabase.from("activities").insert(activity).select().single();
    return created || activity;
  }
  const acts = read<Activity>(LOCAL_KEYS.activities, DEMO_ACTIVITIES);
  acts.unshift(activity);
  write(LOCAL_KEYS.activities, acts);
  return activity;
}

export async function updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
  if (isSupabaseConfigured && supabase) { await supabase.from("activities").update(updates).eq("id", id); return; }
  write(LOCAL_KEYS.activities, read<Activity>(LOCAL_KEYS.activities, []).map((a) => a.id === id ? { ...a, ...updates } : a));
}

// ── Meetings ──────────────────────────────────────────────────────────────────
export async function getMeetings(advisorId?: string): Promise<Meeting[]> {
  if (isSupabaseConfigured && supabase) {
    let q = supabase.from("meetings").select("*, student:students(first_name,last_name), advisor:profiles(full_name)").order("meeting_date", { ascending: false }).order("meeting_time");
    if (advisorId) q = q.eq("advisor_id", advisorId);
    const { data } = await q;
    return (data || []).map((m: Record<string, unknown>) => ({
      ...m,
      student_name: [(m.student as { first_name?: string })?.first_name, (m.student as { last_name?: string })?.last_name].filter(Boolean).join(" "),
      advisor_name: (m.advisor as { full_name?: string })?.full_name,
    })) as unknown as Meeting[];
  }
  let meetings = read<Meeting>(LOCAL_KEYS.meetings, DEMO_MEETINGS);
  if (advisorId) meetings = meetings.filter((m) => m.advisor_id === advisorId);
  return meetings.sort((a, b) => b.meeting_date.localeCompare(a.meeting_date) || a.meeting_time.localeCompare(b.meeting_time));
}

export async function createMeeting(data: Partial<Meeting>): Promise<Meeting> {
  const now = new Date().toISOString();
  const meeting: Meeting = {
    id: `mtg-${Date.now()}`,
    student_id: data.student_id || "",
    student_name: data.student_name,
    advisor_id: data.advisor_id || "",
    advisor_name: data.advisor_name,
    meeting_date: data.meeting_date || now.split("T")[0],
    meeting_time: data.meeting_time || "09:00",
    duration_minutes: data.duration_minutes || 30,
    meeting_type: data.meeting_type || "Academic Advising",
    status: "Scheduled",
    notes: data.notes,
    location: data.location || "TRIO Office",
    created_at: now,
    updated_at: now,
  };
  if (isSupabaseConfigured && supabase) {
    const { data: created } = await supabase.from("meetings").insert(meeting).select().single();
    return created || meeting;
  }
  const meetings = read<Meeting>(LOCAL_KEYS.meetings, DEMO_MEETINGS);
  meetings.unshift(meeting);
  write(LOCAL_KEYS.meetings, meetings);
  return meeting;
}

export async function updateMeetingStatus(id: string, status: MeetingStatus, notes?: string): Promise<void> {
  const updates = { status, notes, updated_at: new Date().toISOString() };
  if (isSupabaseConfigured && supabase) { await supabase.from("meetings").update(updates).eq("id", id); return; }
  write(LOCAL_KEYS.meetings, read<Meeting>(LOCAL_KEYS.meetings, []).map((m) => m.id === id ? { ...m, ...updates } : m));
}

export async function deleteMeeting(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) { await supabase.from("meetings").delete().eq("id", id); return; }
  write(LOCAL_KEYS.meetings, read<Meeting>(LOCAL_KEYS.meetings, []).filter((m) => m.id !== id));
}

// ── Events ────────────────────────────────────────────────────────────────────
export async function getEvents(): Promise<TRIOEvent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("events").select("*, host:profiles(full_name)").order("event_date", { ascending: true });
    return (data || []).map((e: Record<string, unknown>) => ({ ...e, host_name: (e.host as { full_name?: string })?.full_name })) as unknown as TRIOEvent[];
  }
  return read<TRIOEvent>(LOCAL_KEYS.events, DEMO_EVENTS).sort((a, b) => a.event_date.localeCompare(b.event_date));
}

export async function createEvent(data: Partial<TRIOEvent>): Promise<TRIOEvent> {
  const now = new Date().toISOString();
  const event: TRIOEvent = {
    id: `evt-${Date.now()}`,
    title: data.title || "",
    description: data.description,
    event_type: data.event_type || "Workshop",
    event_date: data.event_date || now.split("T")[0],
    start_time: data.start_time || "09:00",
    end_time: data.end_time,
    location: data.location,
    capacity: data.capacity,
    program: data.program,
    host_id: data.host_id,
    host_name: data.host_name,
    is_active: true,
    rsvp_count: 0,
    attendance_count: 0,
    created_at: now,
    updated_at: now,
  };
  if (isSupabaseConfigured && supabase) {
    const { data: created } = await supabase.from("events").insert(event).select().single();
    return created || event;
  }
  const events = read<TRIOEvent>(LOCAL_KEYS.events, DEMO_EVENTS);
  events.push(event);
  write(LOCAL_KEYS.events, events);
  return event;
}

export async function updateEvent(id: string, updates: Partial<TRIOEvent>): Promise<void> {
  if (isSupabaseConfigured && supabase) { await supabase.from("events").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id); return; }
  write(LOCAL_KEYS.events, read<TRIOEvent>(LOCAL_KEYS.events, []).map((e) => e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e));
}

export async function rsvpToEvent(eventId: string, studentId: string, studentName: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("event_rsvps").upsert({ event_id: eventId, student_id: studentId, status: "registered" });
    return;
  }
  const rsvps = read<EventRSVP>(LOCAL_KEYS.rsvps, DEMO_RSVPS);
  const exists = rsvps.find((r) => r.event_id === eventId && r.student_id === studentId);
  if (!exists) {
    rsvps.push({ id: `rsvp-${Date.now()}`, event_id: eventId, student_id: studentId, student_name: studentName, status: "registered", created_at: new Date().toISOString() });
    write(LOCAL_KEYS.rsvps, rsvps);
    const events = read<TRIOEvent>(LOCAL_KEYS.events, []);
    write(LOCAL_KEYS.events, events.map((e) => e.id === eventId ? { ...e, rsvp_count: (e.rsvp_count || 0) + 1 } : e));
  }
}

export async function getEventRSVPs(eventId: string): Promise<EventRSVP[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("event_rsvps").select("*, student:students(first_name,last_name)").eq("event_id", eventId);
    return (data || []).map((r: Record<string, unknown>) => ({ ...r, student_name: [(r.student as { first_name?: string })?.first_name, (r.student as { last_name?: string })?.last_name].filter(Boolean).join(" ") })) as unknown as EventRSVP[];
  }
  return read<EventRSVP>(LOCAL_KEYS.rsvps, DEMO_RSVPS).filter((r) => r.event_id === eventId);
}

export async function markEventAttendance(eventId: string, studentId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("event_attendance").upsert({ event_id: eventId, student_id: studentId, checked_in_at: new Date().toISOString() });
    return;
  }
  const events = read<TRIOEvent>(LOCAL_KEYS.events, []);
  write(LOCAL_KEYS.events, events.map((e) => e.id === eventId ? { ...e, attendance_count: (e.attendance_count || 0) + 1 } : e));
  // Also create an activity record
  const student = read<TRIOStudent>(LOCAL_KEYS.students, []).find((s) => s.id === studentId);
  if (student) {
    await createActivity({ student_id: studentId, student_name: student.full_name, activity_type: "Event", event_id: eventId, check_in_time: new Date().toISOString() });
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────
export async function getNotifications(userId: string): Promise<Notification[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return data || [];
  }
  return read<Notification>(LOCAL_KEYS.notifications, DEMO_NOTIFICATIONS).filter((n) => n.user_id === userId);
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) { await supabase.from("notifications").update({ is_read: true }).eq("id", id); return; }
  write(LOCAL_KEYS.notifications, read<Notification>(LOCAL_KEYS.notifications, []).map((n) => n.id === id ? { ...n, is_read: true } : n));
}

// ── Scholarships ──────────────────────────────────────────────────────────────
export async function getScholarships(): Promise<Scholarship[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("scholarships").select("*").eq("is_active", true).order("deadline");
    return data || [];
  }
  return read<Scholarship>(LOCAL_KEYS.scholarships, DEMO_SCHOLARSHIPS);
}

// ── Profiles ──────────────────────────────────────────────────────────────────
export async function getAdvisors(): Promise<Profile[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("profiles").select("*").in("role", ["advisor", "director"]).eq("is_active", true).order("full_name");
    return data || [];
  }
  return read<Profile>(LOCAL_KEYS.profiles, DEMO_PROFILES).filter((p) => p.role !== "student");
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  if (isSupabaseConfigured && supabase) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const [{ count: total }, { count: active }, { count: monthActs }, { count: weekMtgs }, { count: upcoming }] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("students").select("*", { count: "exact", head: true }).eq("enrollment_status", "active"),
      supabase.from("activities").select("*", { count: "exact", head: true }).gte("check_in_time", monthStart),
      supabase.from("meetings").select("*", { count: "exact", head: true }).gte("meeting_date", weekAgo.split("T")[0]),
      supabase.from("events").select("*", { count: "exact", head: true }).gte("event_date", now.toISOString().split("T")[0]),
    ]);
    return { total_students: total || 0, active_students: active || 0, total_activities_this_month: monthActs || 0, meetings_this_week: weekMtgs || 0, upcoming_events: upcoming || 0, no_show_rate: 0, avg_activities_per_student: 0, students_needing_attention: 0, students_active_today: 0, total_service_hours: 0, grant_compliance_score: 0, scholarships_tracked: 0 };
  }
  return DEMO_STATS;
}

// ── Activity breakdown for reports ────────────────────────────────────────────
export async function getActivityBreakdown(filters?: ReportFilters): Promise<Record<ActivityType, number>> {
  const acts = await getActivities(filters);
  const breakdown: Record<string, number> = {};
  acts.forEach((a) => { breakdown[a.activity_type] = (breakdown[a.activity_type] || 0) + 1; });
  return breakdown as Record<ActivityType, number>;
}

export async function getStudentActivitySummary(filters?: ReportFilters): Promise<{ student: string; count: number; last_activity: string; types: string[] }[]> {
  const acts = await getActivities(filters);
  const map: Record<string, { count: number; last: string; types: Set<string> }> = {};
  acts.forEach((a) => {
    if (!map[a.student_name || a.student_id]) map[a.student_name || a.student_id] = { count: 0, last: a.check_in_time, types: new Set() };
    map[a.student_name || a.student_id].count++;
    if (a.check_in_time > map[a.student_name || a.student_id].last) map[a.student_name || a.student_id].last = a.check_in_time;
    map[a.student_name || a.student_id].types.add(a.activity_type);
  });
  return Object.entries(map).map(([student, v]) => ({ student, count: v.count, last_activity: v.last, types: Array.from(v.types) })).sort((a, b) => b.count - a.count);
}

// ── AI Insights ───────────────────────────────────────────────────────────────
export function getAIInsights(): AIInsight[] {
  if (isSupabaseConfigured) return []; // Real AI layer — implement with AI SDK
  return DEMO_AI_INSIGHTS;
}

// ── Student Notes ─────────────────────────────────────────────────────────────
export async function getStudentNotes(studentId: string): Promise<StudentNote[]> {
  const notes = read<StudentNote>(LOCAL_KEYS.notes, DEMO_STUDENT_NOTES);
  return notes.filter((n) => n.student_id === studentId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createStudentNote(data: Omit<StudentNote, "id" | "created_at">): Promise<StudentNote> {
  const note: StudentNote = { ...data, id: `note-${Date.now()}`, created_at: new Date().toISOString() };
  const notes = read<StudentNote>(LOCAL_KEYS.notes, DEMO_STUDENT_NOTES);
  notes.unshift(note);
  write(LOCAL_KEYS.notes, notes);
  return note;
}

export async function deleteStudentNote(id: string): Promise<void> {
  write(LOCAL_KEYS.notes, read<StudentNote>(LOCAL_KEYS.notes, []).filter((n) => n.id !== id));
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function getMessages(): Promise<Message[]> {
  return read<Message>(LOCAL_KEYS.messages, DEMO_MESSAGES).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function sendMessage(data: Omit<Message, "id" | "created_at" | "is_read">): Promise<Message> {
  const msg: Message = { ...data, id: `msg-${Date.now()}`, is_read: false, created_at: new Date().toISOString() };
  const msgs = read<Message>(LOCAL_KEYS.messages, DEMO_MESSAGES);
  msgs.unshift(msg);
  write(LOCAL_KEYS.messages, msgs);
  return msg;
}

// ── Documents ─────────────────────────────────────────────────────────────────
export async function getDocuments(studentId?: string): Promise<StudentDocument[]> {
  const docs = read<StudentDocument>(LOCAL_KEYS.documents, DEMO_DOCUMENTS).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return studentId ? docs.filter((d) => d.student_id === studentId) : docs;
}

export async function createDocument(data: Omit<StudentDocument, "id" | "created_at">): Promise<StudentDocument> {
  const doc: StudentDocument = { ...data, id: `doc-${Date.now()}`, created_at: new Date().toISOString() };
  const docs = read<StudentDocument>(LOCAL_KEYS.documents, DEMO_DOCUMENTS);
  docs.unshift(doc);
  write(LOCAL_KEYS.documents, docs);
  return doc;
}

export async function deleteDocument(id: string): Promise<void> {
  write(LOCAL_KEYS.documents, read<StudentDocument>(LOCAL_KEYS.documents, []).filter((d) => d.id !== id));
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export async function getTasks(): Promise<Task[]> {
  return read<Task>(LOCAL_KEYS.tasks, DEMO_TASKS).sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
}

export async function createTask(data: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = { ...data, id: `task-${Date.now()}`, created_at: now, updated_at: now };
  const tasks = read<Task>(LOCAL_KEYS.tasks, DEMO_TASKS);
  tasks.unshift(task);
  write(LOCAL_KEYS.tasks, tasks);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const now = new Date().toISOString();
  write(LOCAL_KEYS.tasks, read<Task>(LOCAL_KEYS.tasks, []).map((t) =>
    t.id === id ? { ...t, ...updates, updated_at: now } : t
  ));
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const now = new Date().toISOString();
  write(LOCAL_KEYS.tasks, read<Task>(LOCAL_KEYS.tasks, []).map((t) =>
    t.id === id ? { ...t, status, completed_at: status === "completed" ? now : undefined, updated_at: now } : t
  ));
}

export async function deleteTask(id: string): Promise<void> {
  write(LOCAL_KEYS.tasks, read<Task>(LOCAL_KEYS.tasks, []).filter((t) => t.id !== id));
}

// ── Reset demo data ───────────────────────────────────────────────────────────
export function resetDemoData() {
  Object.values(LOCAL_KEYS).forEach((k) => localStorage.removeItem(k));
  initDemo();
}

// Re-export Task type for consumers
export type { Task };
