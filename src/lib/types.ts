// TRIO Success OS — Core Types

export type UserRole =
  | "director"
  | "advisor"
  | "tutor"
  | "staff"
  | "student_worker"
  | "admin"
  | "student";

export const STAFF_ROLES: UserRole[] = ["director", "advisor", "tutor", "staff", "student_worker", "admin"];

export type EnrollmentStatus = "active" | "inactive" | "graduated" | "transferred" | "withdrawn";

export type ActivityType =
  | "Scheduled Meeting"
  | "Walk-In Advising"
  | "Workshop"
  | "Event"
  | "Study Hall"
  | "Scholarship Assistance"
  | "Transfer Assistance"
  | "Academic Coaching"
  | "Career Coaching"
  | "Resource Center Visit"
  | "Computer Lab Usage"
  | "General Office Visit"
  | "Other";

export const ACTIVITY_TYPES: ActivityType[] = [
  "Scheduled Meeting",
  "Walk-In Advising",
  "Workshop",
  "Event",
  "Study Hall",
  "Scholarship Assistance",
  "Transfer Assistance",
  "Academic Coaching",
  "Career Coaching",
  "Resource Center Visit",
  "Computer Lab Usage",
  "General Office Visit",
  "Other",
];

export type CheckInReason =
  | "Advising Meeting"
  | "Tutoring"
  | "Financial Aid"
  | "Study Space"
  | "Workshop"
  | "Event"
  | "Computer Use"
  | "Quick Question"
  | "Other";

export const CHECK_IN_REASONS: CheckInReason[] = [
  "Advising Meeting",
  "Tutoring",
  "Financial Aid",
  "Study Space",
  "Workshop",
  "Event",
  "Computer Use",
  "Quick Question",
  "Other",
];

export type MeetingType =
  | "Academic Advising"
  | "Financial Aid"
  | "Career Planning"
  | "Transfer Planning"
  | "Personal Support"
  | "Follow-Up"
  | "Other";

export const MEETING_TYPES: MeetingType[] = [
  "Academic Advising",
  "Financial Aid",
  "Career Planning",
  "Transfer Planning",
  "Personal Support",
  "Follow-Up",
  "Other",
];

export type MeetingStatus =
  | "Scheduled"
  | "Checked In"
  | "Completed"
  | "No Show"
  | "Cancelled"
  | "Rescheduled";

export type EventType =
  | "Workshop"
  | "College Tour"
  | "Financial Literacy"
  | "Scholarship Session"
  | "Transfer Event"
  | "Leadership Event"
  | "Career Event"
  | "Other";

export const EVENT_TYPES: EventType[] = [
  "Workshop",
  "College Tour",
  "Financial Literacy",
  "Scholarship Session",
  "Transfer Event",
  "Leadership Event",
  "Career Event",
  "Other",
];

export type RSVPStatus = "registered" | "cancelled" | "waitlist";

export type AIInsightType = "risk" | "opportunity" | "info" | "achievement";
export type AIInsightSeverity = "high" | "medium" | "low";

export interface AIInsight {
  id: string;
  type: AIInsightType;
  severity: AIInsightSeverity;
  message: string;
  count?: number;
  action_label?: string;
  action_path?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface TRIOStudent {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  program: string;
  enrollment_date: string;
  enrollment_status: EnrollmentStatus;
  gpa?: number;
  credit_hours_completed: number;
  first_generation: boolean;
  low_income: boolean;
  disabled: boolean;
  veteran?: boolean;
  advisor_id?: string;
  advisor_name?: string;
  work_location?: string;
  department?: string;
  major?: string;
  graduation_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // computed
  full_name: string;
  activity_count?: number;
  last_activity?: string;
  success_score?: number;
}

export interface Activity {
  id: string;
  student_id: string;
  student_name?: string;
  activity_type: ActivityType;
  check_in_reason?: CheckInReason;
  check_in_time: string;
  check_out_time?: string;
  duration_minutes?: number;
  notes?: string;
  staff_id?: string;
  staff_name?: string;
  // advisor being met (distinct from staff who processed the check-in)
  advisor_met_id?: string;
  advisor_met_name?: string;
  follow_up_requested?: boolean;
  location?: string;
  meeting_id?: string;
  event_id?: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  student_id: string;
  student_name?: string;
  advisor_id: string;
  advisor_name?: string;
  meeting_date: string;
  meeting_time: string;
  duration_minutes: number;
  meeting_type: MeetingType;
  status: MeetingStatus;
  notes?: string;
  location?: string;
  virtual_link?: string;
  created_at: string;
  updated_at: string;
}

export interface TRIOEvent {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  event_date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  capacity?: number;
  program?: string;
  grant_category?: string;
  host_id?: string;
  host_name?: string;
  is_active: boolean;
  rsvp_count?: number;
  attendance_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  student_id: string;
  student_name?: string;
  status: RSVPStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "reminder";
  is_read: boolean;
  related_type?: string;
  related_id?: string;
  created_at: string;
}

export interface Scholarship {
  id: string;
  title: string;
  description?: string;
  amount?: number;
  deadline?: string;
  source_url?: string;
  requirements?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_students: number;
  active_students: number;
  total_activities_this_month: number;
  meetings_this_week: number;
  upcoming_events: number;
  no_show_rate: number;
  avg_activities_per_student: number;
  students_needing_attention: number;
  // Extended metrics
  students_active_today: number;
  total_service_hours: number;
  grant_compliance_score: number;
  scholarships_tracked: number;
}

export interface ReportFilters {
  start_date: string;
  end_date: string;
  activity_type?: ActivityType;
  advisor_id?: string;
  program?: string;
}

export type NoteCategory = "Academic" | "Financial" | "Personal" | "Follow-Up" | "General";
export type NotePriority = "High" | "Medium" | "Low";

export interface StudentNote {
  id: string;
  student_id: string;
  author_id: string;
  author_name: string;
  content: string;
  category: NoteCategory;
  priority: NotePriority;
  created_at: string;
}

export type MessageRecipientType = "student" | "group" | "program" | "parents" | "advisors";
export type MessageChannel = "in_app" | "email" | "sms";
export type MessageGroup = "first_gen" | "low_income" | "at_risk" | "all_active";

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_type: MessageRecipientType;
  recipient_id?: string;
  recipient_name: string;
  subject: string;
  body: string;
  channel: MessageChannel;
  is_read: boolean;
  created_at: string;
}

export type DocumentCategory = "FAFSA" | "Consent Form" | "Scholarship" | "Academic" | "Program Form" | "Other";

export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskCategory = "Follow-Up" | "Academic" | "Financial Aid" | "FAFSA" | "Scholarship" | "Event" | "Documentation" | "Outreach" | "Other";

export const TASK_CATEGORIES: TaskCategory[] = [
  "Follow-Up", "Academic", "Financial Aid", "FAFSA", "Scholarship",
  "Event", "Documentation", "Outreach", "Other",
];

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  assigned_to_id?: string;
  assigned_to_name?: string;
  student_id?: string;
  student_name?: string;
  created_by_id: string;
  created_by_name: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  student_name?: string;
  uploaded_by_id: string;
  uploaded_by_name: string;
  file_name: string;
  file_size?: string;
  category: DocumentCategory;
  notes?: string;
  created_at: string;
}
