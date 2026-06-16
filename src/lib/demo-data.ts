import type {
  Profile, TRIOStudent, Activity, Meeting, TRIOEvent, EventRSVP,
  Notification, Scholarship, ActivityType, MeetingType, MeetingStatus, EventType, AIInsight,
  StudentNote, Message, StudentDocument, Task,
} from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

// ── Advisors ─────────────────────────────────────────────────────────────────
export const DEMO_ADVISORS: Profile[] = [
  { id: "adv-001", full_name: "Maria Rodriguez", role: "advisor", email: "m.rodriguez@ctstate.edu", phone: "203-555-0101", is_active: true, created_at: daysAgo(365) },
  { id: "adv-002", full_name: "James Thompson", role: "advisor", email: "j.thompson@ctstate.edu", phone: "203-555-0102", is_active: true, created_at: daysAgo(365) },
  { id: "adv-003", full_name: "Angela Chen",    role: "advisor", email: "a.chen@ctstate.edu",    phone: "203-555-0103", is_active: true, created_at: daysAgo(300) },
  { id: "adv-004", full_name: "David Okafor",   role: "advisor", email: "d.okafor@ctstate.edu",  phone: "203-555-0104", is_active: true, created_at: daysAgo(280) },
  { id: "adv-005", full_name: "Sarah Patel",    role: "advisor", email: "s.patel@ctstate.edu",   phone: "203-555-0105", is_active: true, created_at: daysAgo(200) },
];

export const DEMO_DIRECTOR: Profile = {
  id: "dir-001", full_name: "Dr. Patricia Williams", role: "director",
  email: "p.williams@ctstate.edu", phone: "203-555-0100", is_active: true, created_at: daysAgo(400),
};

export const DEMO_PROFILES: Profile[] = [DEMO_DIRECTOR, ...DEMO_ADVISORS];

// ── Students ──────────────────────────────────────────────────────────────────
const firstNames = ["Aaliyah","Ahmad","Brianna","Carlos","Destiny","Emmanuel","Fatima","Giovanni","Haley","Isaiah","Jasmine","Kevin","Latoya","Marcus","Natasha","Omar","Priya","Quincy","Rebecca","Savion","Tanya","Ulises","Valentina","William","Xiomara","Yasmin","Zachary","Amara","Brandon","Chantal","Darius","Elena","Felix","Gabrielle","Hassan","Imani","Jordan","Kira","Lamar","Maya","Noah","Olivia","Patrick","Raven","Samuel","Tamara","Victor","Whitney","Xavier","Zoe"];
const lastNames  = ["Adams","Baker","Carter","Davis","Evans","Foster","Garcia","Harris","Jackson","Johnson","King","Lewis","Miller","Moore","Nelson","Parker","Quinn","Roberts","Smith","Taylor","Turner","Underwood","Vasquez","Walker","White","Williams","Wright","Young","Zimmerman","Anderson","Brown","Clark","Cooper","Cruz","Diaz","Edwards","Flores","Gonzalez","Hall","Hill","Hughes","Jenkins","Lee","Martinez","Nguyen","Ortiz","Perez","Rivera","Sanchez","Scott"];

const PROGRAMS = ["TRIO SSS", "TRIO Upward Bound", "WIOA Out Of School"];
const LOCATIONS = ["Naugatuck Valley CC", "Capital CC", "Asnuntuck CC", "Tunxis CC", "Middlesex CC"];
const DEPARTMENTS = ["Liberal Arts", "Business", "Health Sciences", "STEM", "Trades & Technology", "Early Childhood"];

export const DEMO_STUDENTS: TRIOStudent[] = firstNames.map((fn, i) => {
  const ln = lastNames[i];
  const advisorIdx = i % DEMO_ADVISORS.length;
  const advisor = DEMO_ADVISORS[advisorIdx];
  return {
    id: `stu-${String(i + 1).padStart(3, "0")}`,
    student_number: `TRIO-${new Date().getFullYear()}-${String(i + 1).padStart(3, "0")}`,
    first_name: fn, last_name: ln, full_name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.ctstate.edu`,
    phone: `203-555-${String(2000 + i).padStart(4, "0")}`,
    date_of_birth: `${1998 + (i % 8)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    program: PROGRAMS[i % PROGRAMS.length],
    enrollment_date: dateStr(-(300 - i * 2)),
    enrollment_status: i === 3 ? "graduated" : i === 7 ? "withdrawn" : "active",
    gpa: +(2.0 + Math.random() * 2).toFixed(2),
    credit_hours_completed: (i % 10) * 6 + 12,
    first_generation: i % 3 !== 0,
    low_income: i % 4 !== 0,
    disabled: i % 8 === 0,
    advisor_id: advisor.id,
    advisor_name: advisor.full_name,
    work_location: LOCATIONS[i % LOCATIONS.length],
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    notes: i % 5 === 0 ? "Needs follow-up on financial aid forms." : undefined,
    created_at: daysAgo(300 - i * 3),
    updated_at: daysAgo(i * 2),
    activity_count: Math.floor(Math.random() * 20) + 1,
    last_activity: daysAgo(Math.floor(Math.random() * 14)),
  };
});

// ── Activities ────────────────────────────────────────────────────────────────
const ACT_TYPES: ActivityType[] = [
  "Scheduled Meeting", "Walk-In Advising", "Workshop", "Event",
  "Study Hall", "Scholarship Assistance", "Transfer Assistance",
  "Academic Coaching", "Career Coaching", "Resource Center Visit",
  "Computer Lab Usage", "General Office Visit", "Other",
];

export const DEMO_ACTIVITIES: Activity[] = Array.from({ length: 100 }, (_, i) => {
  const student = DEMO_STUDENTS[i % DEMO_STUDENTS.length];
  const advisor = DEMO_ADVISORS[i % DEMO_ADVISORS.length];
  const daysBack = Math.floor(Math.random() * 90);
  const checkIn = new Date(Date.now() - daysBack * 86400000 - Math.random() * 28800000);
  const duration = [15, 20, 30, 45, 60, 90][Math.floor(Math.random() * 6)];
  return {
    id: `act-${String(i + 1).padStart(3, "0")}`,
    student_id: student.id,
    student_name: student.full_name,
    activity_type: ACT_TYPES[i % ACT_TYPES.length],
    check_in_time: checkIn.toISOString(),
    check_out_time: new Date(checkIn.getTime() + duration * 60000).toISOString(),
    duration_minutes: duration,
    notes: i % 4 === 0 ? "Discussed academic plan and upcoming deadlines." : undefined,
    staff_id: advisor.id,
    staff_name: advisor.full_name,
    location: LOCATIONS[i % LOCATIONS.length],
    created_at: checkIn.toISOString(),
  };
});

// ── Meetings ──────────────────────────────────────────────────────────────────
const MTG_TYPES: MeetingType[] = ["Academic Advising", "Financial Aid", "Career Planning", "Transfer Planning", "Personal Support", "Follow-Up", "Other"];
const MTG_STATUSES: MeetingStatus[] = ["Scheduled", "Completed", "No Show", "Cancelled", "Checked In"];
const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00"];

export const DEMO_MEETINGS: Meeting[] = Array.from({ length: 50 }, (_, i) => {
  const student = DEMO_STUDENTS[i % DEMO_STUDENTS.length];
  const advisor = DEMO_ADVISORS[i % DEMO_ADVISORS.length];
  const isPast = i < 35;
  return {
    id: `mtg-${String(i + 1).padStart(3, "0")}`,
    student_id: student.id,
    student_name: student.full_name,
    advisor_id: advisor.id,
    advisor_name: advisor.full_name,
    meeting_date: dateStr(isPast ? -(i * 2) : (i - 30)),
    meeting_time: TIMES[i % TIMES.length],
    duration_minutes: [30, 45, 60][i % 3],
    meeting_type: MTG_TYPES[i % MTG_TYPES.length],
    status: isPast ? MTG_STATUSES[(i % 4) + 1] : "Scheduled",
    notes: i % 3 === 0 ? "Student expressed concern about course load. Referred to tutoring center." : undefined,
    location: "TRIO Office - Room 204",
    created_at: daysAgo(i * 2 + 5),
    updated_at: daysAgo(i),
  };
});

// ── Events ────────────────────────────────────────────────────────────────────
const EVENT_DEFS: { title: string; type: EventType; desc: string }[] = [
  { title: "FAFSA Workshop", type: "Financial Literacy", desc: "Step-by-step assistance completing the FAFSA application for the upcoming academic year." },
  { title: "Transfer to UConn Info Session", type: "Transfer Event", desc: "Learn about transfer pathways, admission requirements, and scholarship opportunities at UConn." },
  { title: "Resume Building Workshop", type: "Career Event", desc: "Create a professional resume with guidance from career coaches." },
  { title: "TRIO Leadership Summit", type: "Leadership Event", desc: "Annual leadership development event for TRIO students across CT State campuses." },
  { title: "Scholarship Search Clinic", type: "Scholarship Session", desc: "Discover local and national scholarship opportunities matched to your profile." },
  { title: "Campus Tour: Southern CT State", type: "College Tour", desc: "Visit Southern CT State University and meet with admissions counselors." },
  { title: "Study Skills Workshop", type: "Workshop", desc: "Evidence-based study strategies for college success." },
  { title: "Financial Literacy Seminar", type: "Financial Literacy", desc: "Budgeting, debt management, and financial planning for college students." },
  { title: "Career Exploration Panel", type: "Career Event", desc: "Professionals from diverse fields share their career journeys." },
  { title: "Transfer Application Workshop", type: "Transfer Event", desc: "Hands-on assistance completing four-year transfer applications." },
  { title: "Tutoring Resources Orientation", type: "Workshop", desc: "Learn about all available tutoring and academic support resources." },
  { title: "STEM Career Night", type: "Career Event", desc: "Connect with employers and explore STEM career pathways." },
  { title: "Campus Tour: Central CT State", type: "College Tour", desc: "Explore the CCSU campus and learn about their programs." },
  { title: "Health & Wellness Workshop", type: "Workshop", desc: "Managing stress, mental health resources, and healthy habits for academic success." },
  { title: "Graduation Celebration", type: "Leadership Event", desc: "Celebrate TRIO student achievements and academic milestones." },
  { title: "Internship Fair", type: "Career Event", desc: "Meet employers offering internships and co-op opportunities." },
  { title: "Essay Writing Workshop", type: "Workshop", desc: "Improve academic and transfer essay writing skills." },
  { title: "Emergency Aid Information Session", type: "Financial Literacy", desc: "Learn about emergency financial assistance programs available to students." },
  { title: "TRIO Alumni Panel", type: "Leadership Event", desc: "Hear from TRIO graduates about their college and career success stories." },
  { title: "End of Year Recognition Ceremony", type: "Leadership Event", desc: "Annual recognition of student achievements and program milestones." },
];

export const DEMO_EVENTS: TRIOEvent[] = EVENT_DEFS.map((def, i) => {
  const host = DEMO_ADVISORS[i % DEMO_ADVISORS.length];
  const isPast = i < 12;
  return {
    id: `evt-${String(i + 1).padStart(3, "0")}`,
    title: def.title,
    description: def.desc,
    event_type: def.type,
    event_date: dateStr(isPast ? -(i * 5) : (i - 10) * 3),
    start_time: ["09:00", "10:00", "13:00", "14:00", "16:00", "18:00"][i % 6],
    end_time: ["11:00", "12:00", "15:00", "16:00", "18:00", "20:00"][i % 6],
    location: ["TRIO Conference Room", "Learning Resource Center", "Campus Center Rm 201", "Virtual - Zoom", "Auditorium"][i % 5],
    capacity: [20, 25, 30, 40, 50][i % 5],
    program: PROGRAMS[i % PROGRAMS.length],
    host_id: host.id,
    host_name: host.full_name,
    is_active: true,
    rsvp_count: Math.floor(Math.random() * 20) + 5,
    attendance_count: isPast ? Math.floor(Math.random() * 18) + 3 : 0,
    created_at: daysAgo(i * 5 + 30),
    updated_at: daysAgo(i * 2),
  };
});

// ── RSVPs ─────────────────────────────────────────────────────────────────────
export const DEMO_RSVPS: EventRSVP[] = DEMO_EVENTS.flatMap((evt, ei) =>
  Array.from({ length: Math.min(evt.rsvp_count ?? 0, 15) }, (_, si) => ({
    id: `rsvp-${evt.id}-${si}`,
    event_id: evt.id,
    student_id: DEMO_STUDENTS[(ei + si) % DEMO_STUDENTS.length].id,
    student_name: DEMO_STUDENTS[(ei + si) % DEMO_STUDENTS.length].full_name,
    status: "registered" as const,
    created_at: daysAgo((ei + si) * 2),
  }))
);

// ── Scholarships ──────────────────────────────────────────────────────────────
export const DEMO_SCHOLARSHIPS: Scholarship[] = [
  { id: "sch-001", title: "CT State TRIO Scholarship", description: "Annual scholarship for TRIO program participants demonstrating academic excellence.", amount: 1500, deadline: dateStr(45), requirements: "3.0+ GPA, TRIO enrollment, essay required", category: "Academic Merit", is_active: true, created_at: daysAgo(60) },
  { id: "sch-002", title: "First-Generation Student Award", description: "Supporting first-generation college students in achieving academic goals.", amount: 2000, deadline: dateStr(30), requirements: "First-generation college student, financial need demonstrated", category: "First-Generation", is_active: true, created_at: daysAgo(45) },
  { id: "sch-003", title: "STEM Opportunity Scholarship", description: "For students pursuing STEM degrees with demonstrated financial need.", amount: 2500, deadline: dateStr(60), requirements: "STEM major, 2.5+ GPA, financial need", category: "STEM", is_active: true, created_at: daysAgo(30) },
  { id: "sch-004", title: "CT Community Foundation Grant", description: "Community foundation grant for Connecticut residents pursuing higher education.", amount: 1000, deadline: dateStr(90), requirements: "CT resident, 2.0+ GPA, community involvement", category: "Community", is_active: true, created_at: daysAgo(20) },
  { id: "sch-005", title: "Transfer Student Excellence Award", description: "Recognizing outstanding achievement by transfer-bound students.", amount: 1750, deadline: dateStr(15), requirements: "Planning to transfer, 3.0+ GPA, advisor recommendation", category: "Transfer", is_active: true, created_at: daysAgo(15) },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "notif-001", user_id: DEMO_DIRECTOR.id, title: "New Scholarship Available", message: "CT State TRIO Scholarship applications are now open. Deadline in 45 days.", type: "info", is_read: false, related_type: "scholarship", related_id: "sch-001", created_at: daysAgo(1) },
  { id: "notif-002", user_id: DEMO_ADVISORS[0].id, title: "No Show Alert", message: "Marcus Johnson missed their scheduled advising appointment at 10:00 AM.", type: "warning", is_read: false, related_type: "meeting", created_at: daysAgo(0) },
  { id: "notif-003", user_id: DEMO_ADVISORS[1].id, title: "Meeting Tomorrow", message: "Reminder: 3 meetings scheduled for tomorrow.", type: "reminder", is_read: true, related_type: "meeting", created_at: daysAgo(1) },
  { id: "notif-004", user_id: DEMO_DIRECTOR.id, title: "Event Capacity Reached", message: "FAFSA Workshop has reached full capacity. 3 students on waitlist.", type: "warning", is_read: false, related_type: "event", related_id: "evt-001", created_at: daysAgo(2) },
  { id: "notif-005", user_id: DEMO_ADVISORS[2].id, title: "Student Needs Follow-Up", message: "Fatima Al-Rashid has not checked in for 3 weeks. Consider outreach.", type: "warning", is_read: false, created_at: daysAgo(0) },
];

// ── Demo accounts ─────────────────────────────────────────────────────────────
const DEMO_ADMIN_PROFILE: Profile = {
  id: "adm-001", full_name: "Nova Admin", role: "admin",
  email: "admin@trio-demo.edu", phone: "203-555-0099", is_active: true, created_at: daysAgo(400),
};

export const DEMO_ACCOUNTS = {
  admin:    { email: "admin@trio-demo.edu",    password: "NovaTRIO2026!",      profile: DEMO_ADMIN_PROFILE },
  director: { email: "director@trio-demo.edu", password: "TRIODirector2026!",  profile: DEMO_DIRECTOR },
  advisor:  { email: "advisor@trio-demo.edu",  password: "TRIOAdvisor2026!",   profile: DEMO_ADVISORS[0] },
  student:  { email: "student@trio-demo.edu",  password: "TRIOStudent2026!",   profile: { id: "stu-001", full_name: DEMO_STUDENTS[0].full_name, role: "student" as const, email: "student@trio-demo.edu", is_active: true, created_at: daysAgo(300) } },
};

// ── AI Insights ───────────────────────────────────────────────────────────────
export const DEMO_AI_INSIGHTS: AIInsight[] = [
  { id: "ai-001", type: "risk", severity: "high", message: "27 students have not visited TRIO in 30+ days.", count: 27, action_label: "View Students", action_path: "/students", created_at: daysAgo(0) },
  { id: "ai-002", type: "risk", severity: "medium", message: "12 students may be missing FAFSA documents before the deadline.", count: 12, action_label: "Send Reminder", action_path: "/students", created_at: daysAgo(0) },
  { id: "ai-003", type: "opportunity", severity: "medium", message: "8 students match criteria for new scholarship opportunities.", count: 8, action_label: "View Matches", action_path: "/reports", created_at: daysAgo(0) },
  { id: "ai-004", type: "risk", severity: "medium", message: "5 students have declining attendance trends this semester.", count: 5, action_label: "Review", action_path: "/students", created_at: daysAgo(0) },
  { id: "ai-005", type: "info", severity: "low", message: "End-of-semester grant report due in 14 days.", action_label: "Generate Report", action_path: "/reports", created_at: daysAgo(0) },
];

// ── Student Notes ─────────────────────────────────────────────────────────────
export const DEMO_STUDENT_NOTES: StudentNote[] = [
  ...DEMO_STUDENTS.slice(0, 15).flatMap((s, i) => [
    { id: `note-${s.id}-1`, student_id: s.id, author_id: DEMO_ADVISORS[i % 5].id, author_name: DEMO_ADVISORS[i % 5].full_name, content: "Student met with advisor to discuss academic plan. On track for next semester. Encouraged to maintain current GPA and register for FAFSA renewal.", category: "Academic" as const, priority: (["High","Medium","Low"] as const)[i % 3], created_at: daysAgo(i * 3 + 1) },
    { id: `note-${s.id}-2`, student_id: s.id, author_id: DEMO_ADVISORS[(i+1) % 5].id, author_name: DEMO_ADVISORS[(i+1) % 5].full_name, content: i % 2 === 0 ? "Discussed scholarship opportunities. Student is a strong candidate for CT State TRIO Scholarship." : "Follow-up needed on financial aid appeal letter. Student should contact financial aid office this week.", category: i % 2 === 0 ? "Financial" as const : "Follow-Up" as const, priority: i % 2 === 0 ? "Medium" as const : "High" as const, created_at: daysAgo(i * 2 + 5) },
  ]),
];

// ── Messages ──────────────────────────────────────────────────────────────────
export const DEMO_MESSAGES: Message[] = [
  { id: "msg-001", sender_id: DEMO_ADVISORS[0].id, sender_name: DEMO_ADVISORS[0].full_name, recipient_type: "program", recipient_name: "All TRIO Students", subject: "FAFSA Renewal Reminder", body: "Dear TRIO Students,\n\nThis is a reminder that FAFSA renewal applications are due by June 30th. Please schedule an appointment with your advisor if you need assistance.\n\nBest,\nMaria Rodriguez", channel: "in_app", is_read: false, created_at: daysAgo(1) },
  { id: "msg-002", sender_id: DEMO_DIRECTOR.id, sender_name: DEMO_DIRECTOR.full_name, recipient_type: "advisors", recipient_name: "All Advisors", subject: "Monthly Progress Report Due", body: "Please submit your monthly student progress reports by end of week. Contact me with any questions.", channel: "in_app", is_read: true, created_at: daysAgo(3) },
  { id: "msg-003", sender_id: DEMO_ADVISORS[1].id, sender_name: DEMO_ADVISORS[1].full_name, recipient_type: "group", recipient_name: "First-Generation Students", subject: "Leadership Summit Registration Open", body: "Registration for the TRIO Leadership Summit is now open. This is a great opportunity for all first-generation students. Limited spots available.", channel: "in_app", is_read: false, created_at: daysAgo(2) },
  { id: "msg-004", sender_id: DEMO_ADVISORS[2].id, sender_name: DEMO_ADVISORS[2].full_name, recipient_type: "student", recipient_id: DEMO_STUDENTS[0].id, recipient_name: DEMO_STUDENTS[0].full_name, subject: "Appointment Reminder", body: `Dear ${DEMO_STUDENTS[0].first_name},\n\nThis is a reminder of your upcoming advising appointment. Please come prepared with any questions about your academic plan.\n\nSee you soon,\nAngela Chen`, channel: "in_app", is_read: true, created_at: daysAgo(0) },
  { id: "msg-005", sender_id: DEMO_ADVISORS[3].id, sender_name: DEMO_ADVISORS[3].full_name, recipient_type: "group", recipient_name: "At-Risk Students", subject: "Check-In Outreach", body: "We notice you haven't visited TRIO in a while. We're here to support you. Please schedule a meeting or drop by during office hours.", channel: "in_app", is_read: false, created_at: daysAgo(5) },
];

// ── Documents ─────────────────────────────────────────────────────────────────
export const DEMO_DOCUMENTS: StudentDocument[] = [
  { id: "doc-001", student_id: DEMO_STUDENTS[0].id, student_name: DEMO_STUDENTS[0].full_name, uploaded_by_id: DEMO_ADVISORS[0].id, uploaded_by_name: DEMO_ADVISORS[0].full_name, file_name: "FAFSA_2025_26_Aaliyah_Adams.pdf", file_size: "142 KB", category: "FAFSA", notes: "Completed and submitted", created_at: daysAgo(10) },
  { id: "doc-002", student_id: DEMO_STUDENTS[0].id, student_name: DEMO_STUDENTS[0].full_name, uploaded_by_id: DEMO_ADVISORS[0].id, uploaded_by_name: DEMO_ADVISORS[0].full_name, file_name: "TRIO_Consent_Form_Signed.pdf", file_size: "89 KB", category: "Consent Form", created_at: daysAgo(45) },
  { id: "doc-003", student_id: DEMO_STUDENTS[1].id, student_name: DEMO_STUDENTS[1].full_name, uploaded_by_id: DEMO_ADVISORS[1].id, uploaded_by_name: DEMO_ADVISORS[1].full_name, file_name: "CT_State_Scholarship_App_Ahmad_Baker.pdf", file_size: "256 KB", category: "Scholarship", notes: "Application submitted for TRIO Scholarship", created_at: daysAgo(8) },
  { id: "doc-004", student_id: DEMO_STUDENTS[2].id, student_name: DEMO_STUDENTS[2].full_name, uploaded_by_id: DEMO_ADVISORS[2].id, uploaded_by_name: DEMO_ADVISORS[2].full_name, file_name: "Unofficial_Transcript_Brianna_Carter.pdf", file_size: "312 KB", category: "Academic", created_at: daysAgo(15) },
  { id: "doc-005", student_id: DEMO_STUDENTS[3].id, student_name: DEMO_STUDENTS[3].full_name, uploaded_by_id: DEMO_ADVISORS[0].id, uploaded_by_name: DEMO_ADVISORS[0].full_name, file_name: "Transfer_Application_Carlos_Davis.pdf", file_size: "189 KB", category: "Academic", notes: "UConn transfer application", created_at: daysAgo(5) },
  { id: "doc-006", student_id: DEMO_STUDENTS[4].id, student_name: DEMO_STUDENTS[4].full_name, uploaded_by_id: DEMO_ADVISORS[3].id, uploaded_by_name: DEMO_ADVISORS[3].full_name, file_name: "Financial_Aid_Appeal_Destiny_Evans.pdf", file_size: "94 KB", category: "FAFSA", notes: "Appeal submitted; awaiting response", created_at: daysAgo(12) },
  { id: "doc-007", student_id: DEMO_STUDENTS[5].id, student_name: DEMO_STUDENTS[5].full_name, uploaded_by_id: DEMO_ADVISORS[1].id, uploaded_by_name: DEMO_ADVISORS[1].full_name, file_name: "TRIO_Program_Agreement_Emmanuel_Foster.pdf", file_size: "67 KB", category: "Program Form", created_at: daysAgo(60) },
  { id: "doc-008", student_id: DEMO_STUDENTS[6].id, student_name: DEMO_STUDENTS[6].full_name, uploaded_by_id: DEMO_ADVISORS[2].id, uploaded_by_name: DEMO_ADVISORS[2].full_name, file_name: "FAFSA_2025_26_Fatima_Garcia.pdf", file_size: "155 KB", category: "FAFSA", created_at: daysAgo(20) },
];

// ── Demo stats ────────────────────────────────────────────────────────────────
export const DEMO_STATS = {
  total_students: DEMO_STUDENTS.length,
  active_students: DEMO_STUDENTS.filter((s) => s.enrollment_status === "active").length,
  total_activities_this_month: DEMO_ACTIVITIES.filter((a) => {
    const d = new Date(a.check_in_time);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length,
  meetings_this_week: DEMO_MEETINGS.filter((m) => {
    const d = new Date(m.meeting_date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return d >= weekAgo && d <= now;
  }).length,
  upcoming_events: DEMO_EVENTS.filter((e) => new Date(e.event_date) >= new Date()).length,
  no_show_rate: Math.round((DEMO_MEETINGS.filter((m) => m.status === "No Show").length / DEMO_MEETINGS.length) * 100),
  avg_activities_per_student: +(DEMO_ACTIVITIES.length / DEMO_STUDENTS.length).toFixed(1),
  students_needing_attention: DEMO_STUDENTS.filter((s) => {
    if (!s.last_activity) return true;
    const d = new Date(s.last_activity);
    return (Date.now() - d.getTime()) > 21 * 86400000;
  }).length,
  // Extended metrics
  students_active_today: 24,
  total_service_hours: 156,
  grant_compliance_score: 87,
  scholarships_tracked: 5,
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

export const DEMO_TASKS: Task[] = [
  { id: "task-001", title: "Send FAFSA deadline reminder to 12 students", category: "FAFSA", priority: "High", status: "pending", due_date: futureDate(2), assigned_to_id: "adv-001", assigned_to_name: "Maria Rodriguez", created_by_id: "adv-001", created_by_name: "Maria Rodriguez", created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "task-002", title: "Follow up with Isaiah Johnson — missed appointment", category: "Follow-Up", priority: "High", status: "pending", due_date: futureDate(1), student_id: "stu-010", student_name: "Isaiah Johnson", assigned_to_id: "adv-001", assigned_to_name: "Maria Rodriguez", created_by_id: "adv-001", created_by_name: "Maria Rodriguez", created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "task-003", title: "Review scholarship applications — Spring cohort", category: "Scholarship", priority: "High", status: "in_progress", due_date: futureDate(5), assigned_to_id: "adv-002", assigned_to_name: "James Thompson", created_by_id: "dir-001", created_by_name: "Dr. Patricia Williams", created_at: daysAgo(3), updated_at: daysAgo(1) },
  { id: "task-004", title: "Schedule FAFSA workshop — early registration", category: "Event", priority: "Medium", status: "in_progress", due_date: futureDate(7), assigned_to_id: "adv-003", assigned_to_name: "Angela Chen", created_by_id: "adv-003", created_by_name: "Angela Chen", created_at: daysAgo(2), updated_at: daysAgo(2) },
  { id: "task-005", title: "Update consent forms for 8 new students", category: "Documentation", priority: "Medium", status: "pending", due_date: futureDate(3), assigned_to_id: "adv-001", assigned_to_name: "Maria Rodriguez", created_by_id: "adv-001", created_by_name: "Maria Rodriguez", created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "task-006", title: "Academic coaching session plan — STEM cohort", category: "Academic", priority: "Medium", status: "pending", due_date: futureDate(6), assigned_to_id: "adv-002", assigned_to_name: "James Thompson", created_by_id: "adv-002", created_by_name: "James Thompson", created_at: daysAgo(4), updated_at: daysAgo(4) },
  { id: "task-007", title: "Outreach emails — students with no visits this month", category: "Outreach", priority: "Medium", status: "in_progress", due_date: futureDate(2), assigned_to_id: "adv-004", assigned_to_name: "David Okafor", created_by_id: "adv-004", created_by_name: "David Okafor", created_at: daysAgo(1), updated_at: daysAgo(0) },
  { id: "task-008", title: "Submit quarterly program report to director", category: "Documentation", priority: "High", status: "completed", due_date: futureDate(-1), assigned_to_id: "adv-001", assigned_to_name: "Maria Rodriguez", created_by_id: "dir-001", created_by_name: "Dr. Patricia Williams", completed_at: daysAgo(0), created_at: daysAgo(7), updated_at: daysAgo(0), student_id: undefined, student_name: undefined },
  { id: "task-009", title: "Financial aid verification — 5 students flagged", category: "Financial Aid", priority: "High", status: "completed", due_date: futureDate(-2), assigned_to_id: "adv-003", assigned_to_name: "Angela Chen", created_by_id: "adv-003", created_by_name: "Angela Chen", completed_at: daysAgo(1), created_at: daysAgo(5), updated_at: daysAgo(1), student_id: undefined, student_name: undefined },
  { id: "task-010", title: "Transfer planning workshop — prep materials", category: "Event", priority: "Low", status: "pending", due_date: futureDate(14), assigned_to_id: "adv-005", assigned_to_name: "Sarah Patel", created_by_id: "adv-005", created_by_name: "Sarah Patel", created_at: daysAgo(2), updated_at: daysAgo(2) },
  { id: "task-011", title: "Career fair registration — student sign-up sheet", category: "Outreach", priority: "Low", status: "pending", due_date: futureDate(10), assigned_to_id: "adv-002", assigned_to_name: "James Thompson", created_by_id: "adv-002", created_by_name: "James Thompson", created_at: daysAgo(3), updated_at: daysAgo(3) },
  { id: "task-012", title: "Complete annual student success surveys", category: "Documentation", priority: "Medium", status: "completed", due_date: futureDate(-3), assigned_to_id: "adv-004", assigned_to_name: "David Okafor", created_by_id: "adv-004", created_by_name: "David Okafor", completed_at: daysAgo(2), created_at: daysAgo(10), updated_at: daysAgo(2) },
];
