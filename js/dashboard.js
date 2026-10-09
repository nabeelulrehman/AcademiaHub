// ============================================
// dashboard.js — Role-based dashboards (every number is calculated from stored data)
// ============================================
import { students, teachers, courses, attendance, payments, salaries, balanceOf, teacherCourses, teacherStudents, studentEnrollments, enrollmentLabel, feeRowsForMonth, feesDueForMonth, feesCollectedForMonth, pendingFeesForMonth, currentBillingMonth, attendancePct } from "./data.js";
import { getCurrentUser } from "./auth.js";
import { esc, money, today, emptyRow, tableCard, setPageTitle, CARD, BTN, TD } from "./ui.js";

const stat = (label, value, icon, color) => `<div class="${CARD} p-4 card-hover"><div class="flex items-center justify-between gap-2">
  <div class="min-w-0"><p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">${label}</p><p class="text-xl sm:text-2xl font-bold mt-1 text-gray-800 dark:text-white truncate">${value}</p></div>
  <div class="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${color}"><i class="fas ${icon} text-white"></i></div></div></div>`;
const grid = cards => `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${cards.join("")}</div>`;
const head = (t, sub) => `<div class="mb-6"><h1 class="text-2xl font-bold text-gray-800 dark:text-white">${t}</h1><p class="text-gray-500 dark:text-gray-400 text-sm">${sub}</p></div>`;
const overall = recs => { const r = recs.filter(a => a.status !== "Leave"); return r.length ? Math.round(r.filter(a => a.status !== "Absent").length / r.length * 100) + "%" : "—"; };
const activeEnrollments = () => students.flatMap(s => studentEnrollments(s).filter(e => e.status === "Active").map(e => ({ student: s, enrollment: e })));
const sumBy = (items, key, value) => [...items.reduce((map, item) => {
  const k = key(item) || "Unspecified";
  map.set(k, (map.get(k) || 0) + value(item));
  return map;
}, new Map())].sort((a, b) => a[0].localeCompare(b[0]));
const uniqueStudentCounts = items => {
  const groups = new Map();
  items.forEach(item => {
    const label = item.enrollment.programName || item.enrollment.className || enrollmentLabel(item.enrollment);
    if (!groups.has(label)) groups.set(label, new Set());
    groups.get(label).add(item.student.id);
  });
  return [...groups].map(([label, ids]) => [label, ids.size]).sort((a, b) => a[0].localeCompare(b[0]));
};
const groupRows = entries => entries.map(([label, count]) => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(label)}</td><td class="${TD} text-right">${count}</td></tr>`).join("");
const pendingCard = value => `<button onclick="document.querySelector('[data-nav=pending-fees]')?.click(); window.showFees({pendingOnly:true})" class="text-left w-full">${stat("Pending Fees", money(value), "fa-exclamation-circle", "bg-red-500")}</button>`;
const pendingTableRows = rows => rows.slice(0, 8).map(row => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(row.student.name)}<div class="text-xs text-gray-500">${esc(row.student.id)}</div></td>
  <td class="${TD}">${esc(row.enrollment.programName || row.enrollment.className || "—")}</td><td class="${TD}">${esc(row.enrollment.subjectName || "Complete class")}</td>
  <td class="${TD}">${esc(row.month)}</td><td class="${TD} font-semibold">${money(row.pending)}</td>
  <td class="${TD}"><button onclick="viewFeeDetails('${esc(row.student.id)}','${esc(row.enrollment.id)}')" class="text-blue-600">View details</button></td></tr>`).join("");

export function showDashboard() {
  setPageTitle("Dashboard");
  const user = getCurrentUser(), t = today(), month = currentBillingMonth(), periodRows = feeRowsForMonth(month);
  const currentPendingRows = periodRows.filter(row => row.pending > 0);
  const studentsPending = new Set(currentPendingRows.map(row => row.student.id)).size;
  const currentDue = feesDueForMonth(month), currentCollected = feesCollectedForMonth(month), currentPending = pendingFeesForMonth(month);
  let html = "";
  if (user.role === "admin") {
    const todayAtt = attendance.filter(a => a.date === t);
    const enrollments = activeEnrollments(), activeCourses = courses.filter(c => c.status !== "Inactive");
    const classes = uniqueStudentCounts(enrollments);
    const subjects = sumBy(enrollments.filter(({ enrollment: e }) => e.subjectName),
      ({ enrollment: e }) => e.subjectName, () => 1);
    const courseRows = activeCourses.map(c => {
      const assignedFees = periodRows.filter(row => row.enrollment.courseId === c.id);
      const collected = assignedFees.reduce((sum, row) => sum + row.paid, 0);
      const pending = assignedFees.reduce((sum, row) => sum + row.pending, 0);
      const names = (c.teacherIds || [c.teacherId]).map(id => teachers.find(x => x.id === id)?.name).filter(Boolean).join(", ");
      return `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(c.name)}</td><td class="${TD}">${esc(names || "Unassigned")}</td>
        <td class="${TD}">${c.students}/${c.capacity} (${Math.max(0, c.capacity - c.students)} available)</td><td class="${TD}">${money(collected)}</td><td class="${TD}">${money(pending)}</td></tr>`;
    }).join("");
    const activeClassCount = activeCourses.filter(c => c.type === "Class-Based").length;
    const activeSubjectCount = activeCourses.filter(c => c.type === "Subject-Based").length;
    html = head(`Welcome back, ${esc(user.name)}`, "Here's what's happening at your academy.") + grid([
      stat("Total Students", students.length, "fa-user-graduate", "bg-blue-600"), stat("Total Classes", activeClassCount, "fa-school", "bg-cyan-600"),
      stat("Total Subjects", activeSubjectCount, "fa-book-open", "bg-indigo-600"), stat("Total Fees Due", money(currentDue), "fa-file-invoice-dollar", "bg-purple-600"),
      stat("Collected Fees", money(currentCollected), "fa-money-bill-wave", "bg-emerald-600"), pendingCard(currentPending),
      stat("Students with Pending Fees", studentsPending, "fa-user-clock", "bg-orange-500")]) +
      tableCard({ title: `Students with pending fees · ${month}`, headers: ["Student", "Class", "Subject", "Billing month", "Pending", ""], rows: pendingTableRows(currentPendingRows) || emptyRow(6, "No students have pending fees this month.") }) +
      `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">${tableCard({ title: "Class-wise student enrollment", headers: ["Class / program", "Students"], rows: groupRows(classes) || emptyRow(2) })}
      ${tableCard({ title: "Subject-wise student enrollment", headers: ["Subject", "Students"], rows: groupRows(subjects) || emptyRow(2) })}</div>` +
      tableCard({ title: "Class and subject fees, teachers & available seats", headers: ["Class / subject", "Teacher(s)", "Seats", "Collected", "Pending"], rows: courseRows || emptyRow(5) });
  } else if (user.role === "teacher") {
    const mine = teacherCourses(user.teacherId).filter(course => course.type === "Subject-Based"), mineS = teacherStudents(user.teacherId), ids = new Set(mineS.map(s => s.id));
    const todayRecs = attendance.filter(a => a.date === t && ids.has(a.studentId));
    const sal = salaries.filter(s => s.teacherId === user.teacherId).sort((a, b) => b.month.localeCompare(a.month))[0];
    const rows = mine.map(c => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(c.name)}</td><td class="${TD}">${esc(c.schedule)}</td><td class="${TD}">${c.students}/${c.capacity}</td></tr>`).join("");
    html = head(`Welcome, ${esc(user.name)}`, "Your teaching overview.") + grid([
      stat("My Subjects", mine.length, "fa-book", "bg-indigo-600"), stat("My Students", mineS.length, "fa-user-graduate", "bg-blue-600"),
      stat("Marked Today", `${todayRecs.length}/${mineS.length}`, "fa-calendar-check", "bg-green-600"),
      stat(sal ? `Salary (${esc(sal.month)})` : "My Salary", sal ? money(sal.net) + " · " + sal.status : "—", "fa-wallet", "bg-purple-600")]) +
      tableCard({ title: "My timetable", headers: ["Subject", "Schedule", "Students / capacity"], rows: rows || emptyRow(3, "No subjects assigned.") });
  } else {
    const recent = students.slice().sort((a, b) => b.admissionDate.localeCompare(a.admissionDate) || b.id.localeCompare(a.id)).slice(0, 5);
    const rows = recent.map(s => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(s.id)}</td><td class="${TD}">${esc(s.name)}</td><td class="${TD}">${esc(s.className || "—")}</td><td class="${TD}">${esc((s.enrollments || []).filter(e => e.status === "Active" && e.courseType !== "Class-Based").map(e => e.subjectName).filter(Boolean).join(", ") || "—")}</td><td class="${TD}">${esc(s.admissionDate)}</td><td class="${TD}">${money(balanceOf(s))}</td></tr>`).join("");
    html = head(`Welcome, ${esc(user.name)}`, "Front desk overview.") + grid([
      stat("Total Students", students.length, "fa-user-graduate", "bg-blue-600"), stat("Admissions Today", students.filter(s => s.admissionDate === t).length, "fa-user-plus", "bg-green-600"),
      stat("Collected Fees", money(currentCollected), "fa-money-bill-wave", "bg-emerald-600"), pendingCard(currentPending)]) +
      `<div class="flex flex-wrap gap-2 mb-4"><button onclick="addStudent()" class="${BTN}"><i class="fas fa-user-plus mr-1"></i>New admission</button><button onclick="document.querySelector('[data-nav=pending-fees]').click()" class="${BTN}"><i class="fas fa-money-bill-wave mr-1"></i>Collect fee</button></div>` +
      tableCard({ title: "Recent admissions", headers: ["ID", "Name", "Class", "Subjects", "Admitted", "Balance"], rows: rows || emptyRow(6) });
  }
  document.getElementById("content").innerHTML = html;
}
