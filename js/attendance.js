// ============================================
// attendance.js — Mark / correct attendance (admin + the course's own teacher)
// ============================================
import { students, courses, attendance, nextId, teacherCourses, teacherStudents, courseByName, studentEnrollments, enrollmentLabel, commit } from "./data.js";
import { esc, today, emptyRow, tableCard, showToast, setPageTitle, BTN, TD } from "./ui.js";
import { getCurrentUser, requirePermission } from "./auth.js";

const state = { date: "", course: "" };
const OPTIONS = ["Present", "Absent", "Late", "Leave"];

const scope = () => { const u = getCurrentUser(); return u.role === "teacher" ? teacherStudents(u.teacherId) : students; };
const scopeCourses = () => {
  const u = getCurrentUser();
  const assigned = u.role === "teacher" ? teacherCourses(u.teacherId) : courses;
  return assigned.filter(course => course.type === "Subject-Based");
};
const recordFor = (sid, date) => attendance.find(a => a.studentId === sid && a.date === date);

export function showAttendance() {
  if (!requirePermission("mark_attendance")) return;
  setPageTitle("Attendance");
  state.date ||= today();
  const list = scope().filter(s => !state.course || studentEnrollments(s).some(e => e.courseId === state.course && e.status === "Active"));
  const sel = "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700";
  const rows = list.map(s => {
    const cur = recordFor(s.id, state.date)?.status || "Present";
    const enrollment = studentEnrollments(s).find(e => !state.course || e.courseId === state.course);
    return `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(s.id)}</td><td class="${TD} font-medium">${esc(s.name)}</td><td class="${TD}">${esc(enrollment ? enrollmentLabel(enrollment) : s.course)}</td>
      <td class="${TD}"><select data-sid="${esc(s.id)}" class="attSelect input">${OPTIONS.map(o => `<option ${o === cur ? "selected" : ""}>${o}</option>`).join("")}</select></td></tr>`;
  }).join("");
  const day = attendance.filter(a => a.date === state.date && list.some(s => s.id === a.studentId));
  const n = st => day.filter(a => a.status === st).length;
  document.getElementById("content").innerHTML = `
    <p class="text-sm mb-3 text-gray-600 dark:text-gray-300">${state.date}: ${day.length ? `recorded ${day.length} — Present ${n("Present")}, Late ${n("Late")}, Absent ${n("Absent")}, Leave ${n("Leave")}` : "not marked yet (defaults shown as Present until you save)"}</p>
    ${tableCard({
      title: "Mark attendance",
      tools: `<input id="attDate" type="date" max="${today()}" value="${state.date}" class="${sel}">
        <select id="attCourse" class="${sel}"><option value="">All subjects</option>${scopeCourses().map(c => `<option value="${esc(c.id)}" ${c.id === state.course ? "selected" : ""}>${esc(c.className)} · ${esc(c.subjectName)}</option>`).join("")}</select>
        <button id="attAll" class="${sel}">All Present</button><button id="attSave" class="${BTN}">Save</button>`,
      headers: ["ID", "Student", "Class · subject", "Status"], rows: rows || emptyRow(4, "No students to mark.")
    })}`;
  document.getElementById("attDate").onchange = e => { state.date = e.target.value && e.target.value <= today() ? e.target.value : today(); showAttendance(); };
  document.getElementById("attCourse").onchange = e => { state.course = e.target.value; showAttendance(); };
  document.getElementById("attAll").onclick = () => document.querySelectorAll(".attSelect").forEach(s => (s.value = "Present"));
  document.getElementById("attSave").onclick = saveAttendance;
}

export function saveAttendance() {
  if (!requirePermission("mark_attendance")) return;
  const user = getCurrentUser(), allowed = new Set(scope().map(s => s.id));
  if (!state.date || state.date > today()) return showToast("Choose a valid date (not in the future).", "error");
  let added = 0, changed = 0;
  document.querySelectorAll(".attSelect").forEach(sel => {
    const sid = sel.dataset.sid, status = sel.value;
    if (!allowed.has(sid) || !OPTIONS.includes(status)) return; // teachers can only mark their own students
    const existing = recordFor(sid, state.date); // one record per student per date: correct it, never duplicate it
    if (existing) { if (existing.status !== status) { existing.status = status; existing.markedBy = user.name; changed++; } }
    else {
      const student = students.find(s => s.id === sid), enrollment = studentEnrollments(student).find(e => e.courseId === state.course) || studentEnrollments(student)[0];
      attendance.push({ id: nextId("ATT", attendance), studentId: sid, courseId: enrollment?.courseId || courseByName(student?.course)?.id || "", date: state.date, status, markedBy: user.name }); added++;
    }
  });
  commit(); showAttendance();
  showToast(`Attendance saved (${added} new, ${changed} corrected)`);
}
Object.assign(window, { saveAttendance });
