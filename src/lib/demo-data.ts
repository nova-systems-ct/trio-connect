import type {
  Profile, TRIOStudent, Activity, Meeting, TRIOEvent, EventRSVP,
  Notification, Scholarship, AIInsight,
  StudentNote, Message, StudentDocument, Task,
} from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ── Staff Profiles ────────────────────────────────────────────────────────────
export const DEMO_ADVISORS: Profile[] = [
  { id: "adv-001", full_name: "Maria Rodriguez", role: "advisor", email: "m.rodriguez@ctstate.edu", phone: "203-555-0101", is_active: true, created_at: daysAgo(365) },
  { id: "adv-002", full_name: "James Thompson",  role: "advisor", email: "j.thompson@ctstate.edu",  phone: "203-555-0102", is_active: true, created_at: daysAgo(365) },
  { id: "adv-003", full_name: "Angela Chen",      role: "advisor", email: "a.chen@ctstate.edu",      phone: "203-555-0103", is_active: true, created_at: daysAgo(300) },
];

export const DEMO_DIRECTOR: Profile = {
  id: "dir-001", full_name: "Dr. Patricia Williams", role: "director",
  email: "p.williams@ctstate.edu", phone: "203-555-0100", is_active: true, created_at: daysAgo(400),
};

export const DEMO_PROFILES: Profile[] = [DEMO_DIRECTOR, ...DEMO_ADVISORS];

// ── Placeholder Students (3 only) ─────────────────────────────────────────────
export const DEMO_STUDENTS: TRIOStudent[] = [
  {
    id: "stu-001",
    student_number: "TRIO-2026-001",
    first_name: "Isaac", last_name: "Nova", full_name: "Isaac Nova",
    email: "isaac.nova@student.ctstate.edu",
    phone: "203-555-1001",
    program: "TRIO SSS",
    enrollment_date: "2025-09-01",
    enrollment_status: "active",
    credit_hours_completed: 30,
    first_generation: true,
    low_income: true,
    disabled: false,
    advisor_id: "adv-001",
    advisor_name: "Maria Rodriguez",
    work_location: "Naugatuck Valley CC",
    major: "Business Administration",
    created_at: daysAgo(180),
    updated_at: daysAgo(5),
  },
  {
    id: "stu-002",
    student_number: "TRIO-2026-002",
    first_name: "Aliyah", last_name: "Rodriguez", full_name: "Aliyah Rodriguez",
    email: "aliyah.rodriguez@student.ctstate.edu",
    phone: "203-555-1002",
    program: "TRIO SSS",
    enrollment_date: "2025-09-01",
    enrollment_status: "active",
    credit_hours_completed: 24,
    first_generation: true,
    low_income: true,
    disabled: false,
    advisor_id: "adv-002",
    advisor_name: "James Thompson",
    work_location: "Capital CC",
    major: "Health Sciences",
    created_at: daysAgo(170),
    updated_at: daysAgo(3),
  },
  {
    id: "stu-003",
    student_number: "TRIO-2026-003",
    first_name: "Matthew", last_name: "Johnson", full_name: "Matthew Johnson",
    email: "matthew.johnson@student.ctstate.edu",
    phone: "203-555-1003",
    program: "TRIO SSS",
    enrollment_date: "2026-01-15",
    enrollment_status: "active",
    credit_hours_completed: 12,
    first_generation: false,
    low_income: true,
    disabled: false,
    advisor_id: "adv-003",
    advisor_name: "Angela Chen",
    work_location: "Tunxis CC",
    major: "Computer Science",
    created_at: daysAgo(60),
    updated_at: daysAgo(1),
  },
];

// ── Empty collections (no fake data) ─────────────────────────────────────────
export const DEMO_ACTIVITIES: Activity[]       = [];
export const DEMO_MEETINGS: Meeting[]          = [];
export const DEMO_EVENTS: TRIOEvent[]          = [];
export const DEMO_RSVPS: EventRSVP[]           = [];
export const DEMO_NOTIFICATIONS: Notification[] = [];
export const DEMO_STUDENT_NOTES: StudentNote[] = [];
export const DEMO_MESSAGES: Message[]          = [];
export const DEMO_DOCUMENTS: StudentDocument[] = [];
export const DEMO_TASKS: Task[]                = [];

// ── Reference data ────────────────────────────────────────────────────────────
export const DEMO_SCHOLARSHIPS: Scholarship[] = [
  { id: "sch-001", title: "CT State TRIO Scholarship", description: "Annual scholarship for TRIO program participants demonstrating academic excellence.", amount: 1500, deadline: new Date(Date.now() + 45*86400000).toISOString().split("T")[0], requirements: "3.0+ GPA, TRIO enrollment, essay required", category: "Academic Merit", is_active: true, created_at: daysAgo(60) },
  { id: "sch-002", title: "First-Generation Student Award", description: "Supporting first-generation college students in achieving academic goals.", amount: 2000, deadline: new Date(Date.now() + 30*86400000).toISOString().split("T")[0], requirements: "First-generation college student, financial need demonstrated", category: "First-Generation", is_active: true, created_at: daysAgo(45) },
  { id: "sch-003", title: "STEM Opportunity Scholarship", description: "For students pursuing STEM degrees with demonstrated financial need.", amount: 2500, deadline: new Date(Date.now() + 60*86400000).toISOString().split("T")[0], requirements: "STEM major, 2.5+ GPA, financial need", category: "STEM", is_active: true, created_at: daysAgo(30) },
];

// ── AI Insights (data-driven, not fake counts) ────────────────────────────────
export const DEMO_AI_INSIGHTS: AIInsight[] = [
  { id: "ai-001", type: "info", severity: "low", message: "TRIO Connect is ready. Add students and begin tracking attendance.", action_label: "Add Student", action_path: "/students", created_at: daysAgo(0) },
  { id: "ai-002", type: "opportunity", severity: "medium", message: "3 scholarship opportunities are available. Review enrolled students for eligibility.", action_label: "View Scholarships", action_path: "/grant-reporting", created_at: daysAgo(0) },
];

// ── Demo stats (reflects actual empty state) ──────────────────────────────────
export const DEMO_STATS = {
  total_students: DEMO_STUDENTS.length,
  active_students: DEMO_STUDENTS.filter((s) => s.enrollment_status === "active").length,
  total_activities_this_month: 0,
  meetings_this_week: 0,
  upcoming_events: 0,
  no_show_rate: 0,
  avg_activities_per_student: 0,
  students_needing_attention: 0,
  students_active_today: 0,
  total_service_hours: 0,
  grant_compliance_score: 0,
  scholarships_tracked: DEMO_SCHOLARSHIPS.length,
};

// ── Demo accounts ─────────────────────────────────────────────────────────────
const DEMO_ADMIN_PROFILE: Profile = {
  id: "adm-001", full_name: "Nova Admin", role: "admin",
  email: "admin@trio-demo.edu", phone: "203-555-0099", is_active: true, created_at: daysAgo(400),
};

export const DEMO_ACCOUNTS = {
  admin:    { email: "admin@trio-demo.edu",    password: "NovaTRIO2026!",     profile: DEMO_ADMIN_PROFILE },
  director: { email: "director@trio-demo.edu", password: "TRIODirector2026!", profile: DEMO_DIRECTOR },
  advisor:  { email: "advisor@trio-demo.edu",  password: "TRIOAdvisor2026!",  profile: DEMO_ADVISORS[0] },
  student:  { email: "student@trio-demo.edu",  password: "TRIOStudent2026!",  profile: { id: "stu-001", full_name: "Isaac Nova", role: "student" as const, email: "student@trio-demo.edu", is_active: true, created_at: daysAgo(180) } },
};
