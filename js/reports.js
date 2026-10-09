// ============================================
// reports.js — Enrollment, billing-period, salary and attendance reports
// ============================================
import { students, payments, salaries, salaryPaid, attendance, courses, teachers, academicLevels, classRecords, classRecord, studentEnrollments, enrollmentLabel, feeRowsForMonth, currentBillingMonth } from "./data.js";
import { esc, money, CARD, BTN, BTN2, setPageTitle, downloadCSV, emptyRow, TD, tableCard, today } from "./ui.js";
import { requirePermission } from "./auth.js";

const state = { month: currentBillingMonth(), academicLevel: "", className: "", subjectName: "", teacherId: "", status: "", search: "" };
const sel = "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700";
const baseClassOf = e => e.programName || e.className || "—";
const classOf = e => e.academicLevel === "BS" && e.semester
  ? `${baseClassOf(e)} · BS ${["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"][Number(e.semester) - 1] || e.semester} Semester`
  : baseClassOf(e);
const levelOf = e => e.academicLevel || classRecord(baseClassOf(e))?.academicLevel || "";
const paymentSum = rows => rows.reduce((sum, row) => sum + row.paid, 0);
const pendingSum = rows => rows.reduce((sum, row) => sum + row.pending, 0);
const dueSum = rows => rows.reduce((sum, row) => sum + row.due, 0);
const group = (rows, label) => {
  const groups = new Map();
  rows.forEach(row => {
    const key = label(row);
    const totals = groups.get(key) || { due: 0, paid: 0, pending: 0, students: new Set() };
    totals.due += row.due; totals.paid += row.paid; totals.pending += row.pending; totals.students.add(row.student.id);
    groups.set(key, totals);
  });
  return [...groups].sort(([a], [b]) => a.localeCompare(b));
};
const groupRows = groups => groups.map(([label, v]) => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(label)}</td><td class="${TD}">${v.students.size}</td>
  <td class="${TD}">${money(v.due)}</td><td class="${TD}">${money(v.paid)}</td><td class="${TD}">${money(v.pending)}</td></tr>`).join("");

export function showReports() {
  if (!requirePermission("view_reports")) return;
  setPageTitle("Reports");
  const allRows = feeRowsForMonth(state.month);
  const filtered = allRows.filter(row => (!state.academicLevel || levelOf(row.enrollment) === state.academicLevel)
    && (!state.className || classOf(row.enrollment) === state.className)
    && (!state.subjectName || row.enrollment.subjectName === state.subjectName)
    && (!state.teacherId || (row.enrollment.teacherIds || [row.enrollment.teacherId]).includes(state.teacherId))
    && (!state.status || row.status === state.status)
    && (!state.search || row.student.name.toLowerCase().includes(state.search.toLowerCase()) || row.student.id.toLowerCase().includes(state.search.toLowerCase())));
  const collected = paymentSum(filtered), pending = pendingSum(filtered), totalDue = dueSum(filtered);
  const totalConcession = filtered.reduce((sum, row) => sum + row.concession, 0);
  const totalGross = filtered.reduce((sum, row) => sum + row.grossFee, 0);
  const unpaid = filtered.filter(row => row.status === "Pending"), partial = filtered.filter(row => row.status === "Partial");
  const attendanceRows = attendance.filter(row => row.status !== "Leave");
  const attendanceRate = attendanceRows.length ? Math.round(attendanceRows.filter(row => row.status !== "Absent").length / attendanceRows.length * 100) : 0;
  const classGroups = group(filtered, row => classOf(row.enrollment));
  const subjectGroups = group(filtered.filter(row => row.enrollment.subjectName), row => `${classOf(row.enrollment)} · ${row.enrollment.subjectName}`);
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(`${currentBillingMonth()}-01T00:00:00`);
    date.setMonth(date.getMonth() - (11 - i));
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const rows = feeRowsForMonth(month);
    return [month, dueSum(rows), paymentSum(rows), pendingSum(rows)];
  });
  const monthlyRows = monthly.map(([month, due, paid, balance]) => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${month}</td><td class="${TD}">${money(due)}</td><td class="${TD}">${money(paid)}</td><td class="${TD}">${money(balance)}</td></tr>`).join("");
  const rowHtml = filtered.map(row => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(row.student.id)}</td><td class="${TD}">${esc(row.student.name)}</td><td class="${TD}">${esc(classOf(row.enrollment))}</td>
    <td class="${TD}">${esc(row.enrollment.subjectName || "Complete class")}</td><td class="${TD}">${esc(teachers.find(t => t.id === row.enrollment.teacherId)?.name || "Unassigned")}</td>
    <td class="${TD}">${money(row.grossFee)}</td><td class="${TD}">${money(row.concession)}</td><td class="${TD}">${money(row.due)}</td><td class="${TD}">${money(row.paid)}</td><td class="${TD}">${money(row.pending)}</td><td class="${TD}">${esc(row.status)}</td></tr>`).join("");
  const classOptions = [...new Set([...classRecords().map(record => record.name), ...courses.map(c => classOf(c)).filter(x => x !== "—")])];
  const subjectOptions = [...new Set(courses.map(c => c.subjectName).filter(Boolean))];
  const statusOptions = ["Pending", "Partial", "Paid"];
  const reportTable = (title, headers, rows) => tableCard({ title, headers, rows: rows || emptyRow(headers.length) });
  document.getElementById("content").innerHTML = `<div class="flex flex-wrap items-end gap-2 mb-4 no-print">
      <label class="text-xs">Billing month<input id="reportMonth" type="month" max="${currentBillingMonth()}" value="${esc(state.month)}" class="${sel} block"></label>
      <label class="text-xs">Search student<input id="reportSearch" placeholder="Name or ID" value="${esc(state.search)}" class="${sel} block"></label>
      <label class="text-xs">Academic level<select id="reportLevel" class="${sel} block"><option value="">All levels</option>${academicLevels.map(x => `<option ${state.academicLevel === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
      <label class="text-xs">Class / course<select id="reportClass" class="${sel} block"><option value="">All classes / courses</option>${classOptions.filter(name => {
        const course = courses.find(item => classOf(item) === name);
        return !state.academicLevel || (course ? levelOf(course) : classRecord(name)?.academicLevel) === state.academicLevel;
      }).map(x => `<option ${state.className === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
      <label class="text-xs">Subject<select id="reportSubject" class="${sel} block"><option value="">All subjects</option>${subjectOptions.map(x => `<option ${state.subjectName === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
      <label class="text-xs">Teacher<select id="reportTeacher" class="${sel} block"><option value="">All teachers</option>${teachers.map(t => `<option value="${esc(t.id)}" ${state.teacherId === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label>
      <label class="text-xs">Payment status<select id="reportStatus" class="${sel} block"><option value="">All</option>${statusOptions.map(x => `<option ${state.status === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <button onclick="window.print()" class="${BTN}"><i class="fas fa-print mr-1"></i>Print</button>
      <button id="reportCsv" class="${BTN2}"><i class="fas fa-file-csv mr-1"></i>Export CSV</button>
    </div>
    <div id="reportContent" class="space-y-4 text-sm">
      <div class="${CARD} p-5"><h3 class="font-semibold mb-3">Fee summary · ${esc(state.month)}</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <p>Original Subject Fees <strong class="block">${money(totalGross)}</strong></p><p>Fee Concessions <strong class="block">${money(totalConcession)}</strong></p>
          <p>Net Fees Due <strong class="block">${money(totalDue)}</strong></p><p>Collected Fees <strong class="block">${money(collected)}</strong></p>
          <p>Pending Fees <strong class="block">${money(pending)}</strong></p><p>Students with pending fees <strong class="block">${new Set(filtered.filter(r => r.pending > 0).map(r => r.student.id)).size}</strong></p>
          <p>Fully unpaid enrollments <strong class="block">${unpaid.length}</strong></p><p>Partially paid enrollments <strong class="block">${partial.length}</strong></p>
          <p>Attendance <strong class="block">${attendanceRate}%</strong></p>
          <p>Salaries paid <strong class="block">${money(salaries.reduce((sum, salary) => sum + salaryPaid(salary), 0))}</strong></p>
        </div></div>
      ${reportTable("Class-wise fee collection", ["Class / program", "Students", "Total due", "Collected", "Pending"], groupRows(classGroups))}
      ${reportTable("Subject-wise fee collection", ["Class · subject", "Students", "Total due", "Collected", "Pending"], groupRows(subjectGroups))}
      ${reportTable("Student-wise pending and partial fees", ["Student ID", "Student", "Class", "Subject", "Teacher", "Subject fee", "Concession", "Net due", "Paid", "Pending", "Status"], rowHtml)}
      ${reportTable("Monthly collection summary", ["Billing month", "Total due", "Collected", "Pending"], monthlyRows)}
    </div>`;
  const bind = (id, key, event = "change") => document.getElementById(id).addEventListener(event, e => {
    state[key] = e.target.value;
    if (key === "academicLevel") state.className = "";
    showReports();
    if (event === "input") { const el = document.getElementById(id); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  });
  bind("reportMonth", "month"); bind("reportSearch", "search", "input"); bind("reportLevel", "academicLevel"); bind("reportClass", "className");
  bind("reportSubject", "subjectName"); bind("reportTeacher", "teacherId"); bind("reportStatus", "status");
  document.getElementById("reportCsv").onclick = () => downloadCSV(`fees-${state.month}.csv`, [
    ["Billing month", "Student ID", "Student", "Guardian", "Phone", "Class", "Subject", "Teacher", "Subject fee", "Concession", "Net due", "Collected", "Pending", "Status"],
    ...filtered.map(row => [state.month, row.student.id, row.student.name, row.student.father, row.student.phone, classOf(row.enrollment), row.enrollment.subjectName || "",
      teachers.find(t => t.id === row.enrollment.teacherId)?.name || "", row.grossFee, row.concession, row.due, row.paid, row.pending, row.status])
  ]);
}
