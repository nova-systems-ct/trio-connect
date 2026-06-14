import { useState, useEffect } from "react";
import { getActivities, getMeetings, getStudents, getEvents, getActivityBreakdown, getStudentActivitySummary } from "../lib/db";
import type { Activity, Meeting, TRIOStudent, TRIOEvent, ActivityType, ReportFilters } from "../lib/types";
import { ACTIVITY_TYPES } from "../lib/types";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const NAVY = "#1B3A6B";
const CARD_DARK = "#1E293B";

type ReportType = "attendance" | "meetings" | "engagement" | "grant";

function StatCard({ label, value, sub, color = CARD_DARK }: { label: string; value: string | number; sub: string; color?: string }) {
  return (
    <div style={{ background: color, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{sub}</p>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  "Scheduled Meeting": "#3B82F6", "Walk-In Advising": "#8B5CF6", "Workshop": "#F59E0B",
  "Event": "#10B981", "Study Hall": "#06B6D4", "Scholarship Assistance": "#C5A028",
  "Transfer Assistance": "#EF4444", "Academic Coaching": "#6366F1", "Career Coaching": "#EC4899",
  "Resource Center Visit": "#14B8A6", "Computer Lab Usage": "#64748B", "General Office Visit": "#94A3B8",
  "Other": "#CBD5E1",
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meetings, setMeetings]     = useState<Meeting[]>([]);
  const [students, setStudents]     = useState<TRIOStudent[]>([]);
  const [events, setEvents]         = useState<TRIOEvent[]>([]);
  const [breakdown, setBreakdown]   = useState<Record<string, number>>({});
  const [summaries, setSummaries]   = useState<{ student: string; count: number; last_activity: string; types: string[] }[]>([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);

  const now = new Date();
  const [filters, setFilters] = useState<ReportFilters>({
    start_date: format(startOfMonth(now), "yyyy-MM-dd"),
    end_date: format(endOfMonth(now), "yyyy-MM-dd"),
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getActivities(filters),
      getMeetings(),
      getStudents(),
      getEvents(),
      getActivityBreakdown(filters),
      getStudentActivitySummary(filters),
    ]).then(([a, m, s, e, b, sum]) => {
      setActivities(a);
      setMeetings(m.filter((mtg) => mtg.meeting_date >= filters.start_date && mtg.meeting_date <= filters.end_date));
      setStudents(s);
      setEvents(e.filter((ev) => ev.event_date >= filters.start_date && ev.event_date <= filters.end_date));
      setBreakdown(b);
      setSummaries(sum);
      setLoading(false);
    });
  }, [filters]);

  const setPreset = (preset: "month" | "quarter" | "year") => {
    const n = new Date();
    if (preset === "month") setFilters({ ...filters, start_date: format(startOfMonth(n), "yyyy-MM-dd"), end_date: format(endOfMonth(n), "yyyy-MM-dd") });
    if (preset === "quarter") {
      const qStart = new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1);
      const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
      setFilters({ ...filters, start_date: format(qStart, "yyyy-MM-dd"), end_date: format(qEnd, "yyyy-MM-dd") });
    }
    if (preset === "year") setFilters({ ...filters, start_date: format(startOfYear(n), "yyyy-MM-dd"), end_date: format(endOfYear(n), "yyyy-MM-dd") });
  };

  const noShowRate = meetings.length > 0 ? Math.round(meetings.filter((m) => m.status === "No Show").length / meetings.length * 100) : 0;
  const totalAttendance = events.reduce((sum, e) => sum + (e.attendance_count || 0), 0);
  const activeStudents = new Set(activities.map((a) => a.student_id)).size;
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration_minutes || 30), 0);

  const exportExcel = () => {
    setGenerating(true);
    try {
      const wb = XLSX.utils.book_new();

      // Activity Log sheet
      const actData = [
        ["TRIO Connect — Activity Report"],
        [`Period: ${filters.start_date} to ${filters.end_date}`],
        [`Generated: ${format(new Date(), "PPpp")}`],
        [],
        ["Date/Time", "Student Name", "Activity Type", "Duration (min)", "Staff", "Location", "Notes"],
        ...activities.map((a) => [
          format(new Date(a.check_in_time), "MM/dd/yyyy h:mm a"),
          a.student_name || "",
          a.activity_type,
          a.duration_minutes || "",
          a.staff_name || "",
          a.location || "",
          a.notes || "",
        ]),
      ];
      const actSheet = XLSX.utils.aoa_to_sheet(actData);
      actSheet["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, actSheet, "Activity Log");

      // Activity Breakdown
      const bkData = [
        ["Activity Type", "Count", "% of Total"],
        ...Object.entries(breakdown).map(([type, count]) => [type, count, `${Math.round(count / activities.length * 100)}%`]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bkData), "Activity Breakdown");

      // Student Summary
      const sumData = [
        ["Student Name", "Total Interactions", "Last Activity", "Activity Types"],
        ...summaries.map((s) => [s.student, s.count, format(new Date(s.last_activity), "MM/dd/yyyy"), s.types.join(", ")]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumData), "Student Summary");

      // Meetings
      const mtgData = [
        ["Date", "Time", "Student", "Advisor", "Type", "Duration", "Status", "Notes"],
        ...meetings.map((m) => [m.meeting_date, m.meeting_time, m.student_name || "", m.advisor_name || "", m.meeting_type, m.duration_minutes, m.status, m.notes || ""]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mtgData), "Meetings");

      XLSX.writeFile(wb, `TRIO-Report-${filters.start_date}-to-${filters.end_date}.xlsx`);
    } finally {
      setGenerating(false);
    }
  };

  const exportPDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const pageW = doc.internal.pageSize.getWidth();

      // Cover page
      doc.setFillColor(27, 58, 107);
      doc.rect(0, 0, pageW, 80, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("TRIO Connect", 20, 30);
      doc.setFontSize(14);
      doc.text("Student Activity & Engagement Report", 20, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`CT State Community College · TRIO Student Support Services`, 20, 56);
      doc.text(`Report Period: ${filters.start_date} – ${filters.end_date}`, 20, 64);
      doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 20, 72);

      // Executive Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Executive Summary", 20, 100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const summaryRows = [
        ["Total Interactions Logged", activities.length.toString()],
        ["Unique Students Served", activeStudents.toString()],
        ["Total Service Hours", `${Math.round(totalDuration / 60)} hours`],
        ["Total Meetings", meetings.length.toString()],
        ["Meeting No-Show Rate", `${noShowRate}%`],
        ["Events Attended", totalAttendance.toString()],
      ];
      autoTable(doc, {
        startY: 108,
        head: [["Metric", "Value"]],
        body: summaryRows,
        theme: "striped",
        headStyles: { fillColor: [27, 58, 107] },
        margin: { left: 20, right: 20 },
      });

      // Activity Breakdown
      const afterSummary = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Activity Type Breakdown", 20, afterSummary);
      const bkRows = Object.entries(breakdown).map(([type, count]) => [type, count.toString(), `${Math.round(count / activities.length * 100)}%`]);
      autoTable(doc, {
        startY: afterSummary + 8,
        head: [["Activity Type", "Count", "% of Total"]],
        body: bkRows,
        theme: "striped",
        headStyles: { fillColor: [27, 58, 107] },
        margin: { left: 20, right: 20 },
      });

      // Student Summary (new page)
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Student Engagement Summary", 20, 20);
      autoTable(doc, {
        startY: 28,
        head: [["Student", "Interactions", "Last Activity", "Activity Types"]],
        body: summaries.slice(0, 30).map((s) => [s.student, s.count.toString(), format(new Date(s.last_activity), "MM/dd/yyyy"), s.types.slice(0, 3).join(", ")]),
        theme: "striped",
        headStyles: { fillColor: [27, 58, 107] },
        margin: { left: 20, right: 20 },
        columnStyles: { 3: { cellWidth: 60 } },
      });

      // Footer
      const totalPages = doc.internal.pages.length;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`TRIO Connect · CT State · Page ${i} of ${totalPages} · CONFIDENTIAL — FERPA Protected`, 20, doc.internal.pageSize.getHeight() - 10);
      }

      doc.save(`TRIO-Report-${filters.start_date}-to-${filters.end_date}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  const maxCount = Math.max(...Object.values(breakdown), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>Reports</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Generate attendance, engagement, and grant reports</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportExcel} disabled={generating || loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", fontSize: 12, fontWeight: 700, color: "#16A34A", cursor: "pointer", opacity: generating ? 0.5 : 1 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Excel
          </button>
          <button onClick={exportPDF} disabled={generating || loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", opacity: generating ? 0.5 : 1 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            {generating ? "Generating…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {(["month", "quarter", "year"] as const).map((p) => (
              <button key={p} onClick={() => setPreset(p)}
                style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#475569", cursor: "pointer", textTransform: "capitalize" }}>
                This {p}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>From</label>
            <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none" }} />
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>To</label>
            <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none" }} />
          </div>
          <select value={filters.activity_type || ""} onChange={(e) => setFilters({ ...filters, activity_type: e.target.value as ActivityType || undefined })}
            style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none" }}>
            <option value="">All Activity Types</option>
            {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Total Interactions" value={activities.length} sub="In selected period" color={NAVY} />
        <StatCard label="Students Served" value={activeStudents} sub="Unique students" />
        <StatCard label="Service Hours" value={`${Math.round(totalDuration / 60)}h`} sub={`${totalDuration} minutes`} />
        <StatCard label="Meetings" value={meetings.length} sub={`${noShowRate}% no-show rate`} color={noShowRate > 20 ? "#7F1D1D" : CARD_DARK} />
      </div>

      {/* Report type tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {([
          ["attendance", "Activity Log"],
          ["meetings", "Meetings"],
          ["engagement", "Student Engagement"],
          ["grant", "Grant Summary"],
        ] as [ReportType, string][]).map(([type, label]) => (
          <button key={type} onClick={() => setReportType(type)}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: reportType === type ? NAVY : "#F1F5F9", color: reportType === type ? "#fff" : "#64748B" }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8" }}>Loading report data…</div>
      ) : (
        <>
          {/* Activity Log */}
          {reportType === "attendance" && (
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
              {/* Breakdown chart */}
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>By Activity Type</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{type}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "#F1F5F9" }}>
                        <div style={{ width: `${Math.round(count / maxCount * 100)}%`, height: "100%", borderRadius: 3, background: TYPE_COLORS[type] || "#CBD5E1" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity table */}
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ maxHeight: 480, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead style={{ position: "sticky", top: 0, background: "#FAFAFA" }}>
                      <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        {["Date/Time", "Student", "Activity Type", "Duration", "Staff"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((a) => (
                        <tr key={a.id} style={{ borderBottom: "1px solid #F8FAFC" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "9px 14px", color: "#475569" }}>{format(new Date(a.check_in_time), "MM/dd h:mm a")}</td>
                          <td style={{ padding: "9px 14px", fontWeight: 600, color: "#0F172A" }}>{a.student_name}</td>
                          <td style={{ padding: "9px 14px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLORS[a.activity_type] || "#CBD5E1", flexShrink: 0 }} />
                              {a.activity_type}
                            </span>
                          </td>
                          <td style={{ padding: "9px 14px", color: "#64748B" }}>{a.duration_minutes ? `${a.duration_minutes}m` : "—"}</td>
                          <td style={{ padding: "9px 14px", color: "#64748B" }}>{a.staff_name || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Meetings Report */}
          {reportType === "meetings" && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
                    {["Date", "Student", "Advisor", "Type", "Duration", "Status", "Notes"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #F8FAFC" }}>
                      <td style={{ padding: "9px 14px", color: "#475569" }}>{m.meeting_date} {m.meeting_time}</td>
                      <td style={{ padding: "9px 14px", fontWeight: 600, color: "#0F172A" }}>{m.student_name}</td>
                      <td style={{ padding: "9px 14px", color: "#64748B" }}>{m.advisor_name}</td>
                      <td style={{ padding: "9px 14px", color: "#64748B" }}>{m.meeting_type}</td>
                      <td style={{ padding: "9px 14px", color: "#64748B" }}>{m.duration_minutes}m</td>
                      <td style={{ padding: "9px 14px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: m.status === "No Show" ? "#FEF2F2" : m.status === "Completed" ? "#ECFDF5" : "#F0F9FF", color: m.status === "No Show" ? "#DC2626" : m.status === "Completed" ? "#059669" : "#2563EB" }}>{m.status}</span>
                      </td>
                      <td style={{ padding: "9px 14px", color: "#64748B", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Student Engagement */}
          {reportType === "engagement" && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
                    {["Student", "Total Interactions", "Last Activity", "Activity Types", "Engagement"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s, i) => {
                    const maxActs = summaries[0]?.count || 1;
                    const pct = Math.round(s.count / maxActs * 100);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #F8FAFC" }}>
                        <td style={{ padding: "9px 14px", fontWeight: 600, color: "#0F172A" }}>{s.student}</td>
                        <td style={{ padding: "9px 14px", color: "#0F172A", fontWeight: 700 }}>{s.count}</td>
                        <td style={{ padding: "9px 14px", color: "#64748B" }}>{format(new Date(s.last_activity), "MMM d, yyyy")}</td>
                        <td style={{ padding: "9px 14px", color: "#64748B", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.types.slice(0, 3).join(", ")}</td>
                        <td style={{ padding: "9px 14px", width: 120 }}>
                          <div style={{ height: 6, borderRadius: 3, background: "#F1F5F9" }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pct > 66 ? "#10B981" : pct > 33 ? "#F59E0B" : "#EF4444" }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Grant Summary */}
          {reportType === "grant" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: NAVY, borderRadius: 12, padding: "28px 32px", color: "#fff" }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>TRIO Student Support Services · Grant Performance Summary</p>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>CT State Community College</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Report Period: {filters.start_date} through {filters.end_date}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Total Participants Served", value: activeStudents, sub: "Unique unduplicated students", target: students.filter((s) => s.enrollment_status === "active").length },
                  { label: "Total Service Interactions", value: activities.length, sub: "All activity types combined" },
                  { label: "Academic Advising Sessions", value: activities.filter((a) => a.activity_type === "Scheduled Meeting" || a.activity_type === "Walk-In Advising").length, sub: "Advising contacts" },
                  { label: "Workshop Attendance", value: activities.filter((a) => a.activity_type === "Workshop" || a.activity_type === "Event").length, sub: "Workshop & event participation" },
                  { label: "Scholarship Assistance", value: activities.filter((a) => a.activity_type === "Scholarship Assistance").length, sub: "Scholarship support contacts" },
                  { label: "Transfer Assistance", value: activities.filter((a) => a.activity_type === "Transfer Assistance").length, sub: "Transfer support contacts" },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "18px 20px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", marginBottom: 8 }}>{item.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 900, color: "#0F172A", marginBottom: 4 }}>{item.value}</p>
                    <p style={{ fontSize: 11, color: "#64748B" }}>{item.sub}</p>
                    {"target" in item && item.target !== undefined && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 4, borderRadius: 2, background: "#F1F5F9" }}>
                          <div style={{ width: `${Math.min(Math.round((item.value as number) / item.target * 100), 100)}%`, height: "100%", borderRadius: 2, background: "#10B981" }} />
                        </div>
                        <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>{Math.round((item.value as number) / item.target * 100)}% of enrolled</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 18px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>FERPA Notice</p>
                <p style={{ fontSize: 12, color: "#B45309" }}>This report contains personally identifiable information protected under the Family Educational Rights and Privacy Act (FERPA). Distribution is limited to authorized program staff and grant oversight personnel. Do not distribute externally without redacting student-identifiable information.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
