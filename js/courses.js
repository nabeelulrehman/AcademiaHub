// ============================================
// courses.js — Central subject catalog management
// ============================================
import { courses, students, payments, teacherSubjectAssignments, courseOptions, academicLevels, schoolClasses, bsSemesters, classRecord, nextId, teacherCourses, studentEnrollments, commit } from "./data.js";
import { esc, money, today, emptyRow, tableCard, field, selectField, formButtons, showModal, closeModal, showToast, showConfirm, setPageTitle, BTN, BTN2, TD } from "./ui.js";
import { getCurrentUser, requirePermission } from "./auth.js";

const filters = { search: "", level: "", assignment: "" };
const sel = "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700";
const levelOptions = [["", "Choose academic level"], ...academicLevels];
const assignments = () => courses.filter(course => course.type === "Subject-Based");
const subjectUsed = id => students.some(student => studentEnrollments(student).some(enrollment => enrollment.courseId === id))
  || payments.some(payment => payment.courseId === id)
  || teacherSubjectAssignments.some(assignment => assignment.subjectId === id);
const contextOf = course => course.academicLevel === "BS"
  ? `${course.programName || course.className || "Unassigned"} · ${semesterLabel(course.semester)}`
  : course.className || "Unassigned";
function semesterLabel(value) {
  return bsSemesters.find(semester => semester.value === String(value))?.label || String(value || "Unassigned");
}
function labelOf(course) {
  return `${course.subjectName || course.name} ${contextOf(course)}`;
}
function subjectOrder(course) {
  const levelOrder = { Matric: 0, Inter: 1, BS: 2 };
  const level = course.academicLevel || classRecord(course.programName || course.className)?.academicLevel || "";
  let className = course.className || "";
  if (level === "Inter") {
    className = className.replace(/^11th\s+Class$/i, "1st Year").replace(/^12th\s+Class$/i, "2nd Year");
  }
  const classIndex = (schoolClasses[level] || []).indexOf(className);
  return {
    level: levelOrder[level] ?? 3,
    assignment: classIndex >= 0 ? classIndex : level === "BS" ? Number(course.semester) || 0 : Number.MAX_SAFE_INTEGER,
    program: level === "BS" ? (course.programName || course.className || "") : "",
    subject: course.subjectName || course.name || ""
  };
}
function compareSubjects(a, b) {
  const first = subjectOrder(a), second = subjectOrder(b);
  return first.level - second.level
    || first.program.localeCompare(second.program)
    || first.assignment - second.assignment
    || first.subject.localeCompare(second.subject);
}

function subjectRows(list) {
  return list.map(course => `<tr class="border-b dark:border-gray-700">
    <td class="${TD} font-medium">${esc(course.subjectName || course.name)}</td>
    <td class="${TD}">${esc(course.academicLevel || classRecord(course.programName || course.className)?.academicLevel || "Unassigned")}</td>
    <td class="${TD}">${esc(contextOf(course))}</td><td class="${TD}">${money(course.fee)}</td>
    <td class="${TD} text-center whitespace-nowrap"><div class="flex items-center justify-center gap-4">
      <button onclick="editCourse('${esc(course.id)}')" title="Edit subject" class="text-amber-600"><i class="fas fa-edit"></i></button>
      <button onclick="toggleCourseStatus('${esc(course.id)}')" title="${course.status === "Active" ? "Deactivate" : "Activate"}" class="text-blue-600"><i class="fas ${course.status === "Active" ? "fa-toggle-on" : "fa-toggle-off"}"></i></button>
      <button onclick="deleteCourse('${esc(course.id)}')" title="Delete subject" class="text-red-600"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join("");
}
function assignmentOptions() {
  return [...new Set(assignments().slice().sort(compareSubjects).map(contextOf).filter(value => value !== "Unassigned"))];
}
function filteredSubjects() {
  return assignments().filter(course => (!filters.search || labelOf(course).toLowerCase().includes(filters.search.toLowerCase()))
    && (!filters.level || course.academicLevel === filters.level)
    && (!filters.assignment || contextOf(course) === filters.assignment))
    .sort(compareSubjects);
}

export function showCourses() {
  if (!requirePermission("view_courses")) return;
  const admin = getCurrentUser().role === "admin";
  setPageTitle(admin ? "Subjects" : "My Subjects");
  if (!admin) {
    const rows = teacherCourses(getCurrentUser().teacherId).filter(course => course.type === "Subject-Based").map(course => `<tr class="border-b dark:border-gray-700">
      <td class="${TD} font-medium">${esc(course.subjectName || course.name)}</td><td class="${TD}">${esc(course.academicLevel || "")}</td>
      <td class="${TD}">${esc(contextOf(course))}</td><td class="${TD}">${esc(course.schedule || "—")}</td><td class="${TD}">${money(course.fee)}</td></tr>`).join("");
    document.getElementById("content").innerHTML = tableCard({ title: "My assigned subjects", headers: ["Subject", "Academic level", "Class / semester · course", "Timing", "Monthly fee"], rows: rows || emptyRow(5, "No subjects assigned.") });
    return;
  }
  const tools = `<input id="subjectSearch" class="${sel}" placeholder="Search subjects" value="${esc(filters.search)}">
    <select id="subjectLevelFilter" class="${sel}"><option value="">All academic levels</option>${academicLevels.map(level => `<option ${filters.level === level ? "selected" : ""}>${esc(level)}</option>`).join("")}</select>
    <select id="subjectAssignmentFilter" class="${sel}"><option value="">All classes / courses</option>${assignmentOptions().map(option => `<option value="${esc(option)}" ${filters.assignment === option ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>
    <button onclick="addCourse()" class="${BTN}"><i class="fas fa-plus mr-1"></i>Add Subject</button>`;
  document.getElementById("content").innerHTML = tableCard({
    id: "subjectManagementTable",
    title: `Subject Management (${filteredSubjects().length})`, tools,
    headers: ["Subject Name", "Academic Level", "Class / Semester · Course", "Monthly Fee", "Actions"],
    rows: subjectRows(filteredSubjects()) || emptyRow(5, "No subjects match.")
  });
  document.getElementById("subjectLevelFilter").addEventListener("change", event => {
    filters.level = event.target.value; filters.assignment = ""; showCourses();
  });
  document.getElementById("subjectAssignmentFilter").addEventListener("change", event => {
    filters.assignment = event.target.value; showCourses();
  });
  document.getElementById("subjectSearch").addEventListener("input", event => {
    filters.search = event.target.value;
    const position = event.target.selectionStart;
    showCourses();
    const input = document.getElementById("subjectSearch"); input.focus(); input.setSelectionRange(position, position);
  });
}

function teacherFields(course) {
  return `<details class="sm:col-span-2"><summary class="cursor-pointer text-sm font-medium">Teaching details (optional)</summary><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
    <p class="sm:col-span-2 text-xs text-gray-500">Assign teachers and enter their individual subject salaries from Teacher Management.</p>
    ${field("Duration", "duration", course.duration || "1 month")}
    ${field("Class timing", "schedule", course.schedule || "", 'placeholder="Mon, Wed 09:00-11:00"')}
    ${field("Start date", "startDate", course.startDate || today(), 'type="date"')}
    ${field("Capacity", "capacity", course.capacity ?? 30, 'type="number" min="1" step="1"')}
    ${course.id ? selectField("Status", "status", ["Active", "Inactive"], course.status || "Active") : ""}</div></details>`;
}

function assignmentFieldsHtml(level, course) {
  if (!level) return "";
  return `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    ${field("Subject name *", "subjectName", course.subjectName || "", "required")}
    ${level === "BS"
      ? `${selectField("Semester *", "semester", [["", "Choose semester"], ...bsSemesters.map(item => [item.value, item.label])], course.semester || "")}
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Course / program *<select name="programName" class="input mt-1" required><option value="">Choose a course</option>${(courseOptions.programs || []).map(program => `<option value="${esc(program)}" ${program === (course.programName || course.className) ? "selected" : ""}>${esc(program)}</option>`).join("")}</select></label>
        <div class="sm:col-span-2"><button type="button" id="toggleAddProgram" class="${BTN2}">Add BS course / program</button><div id="addProgramFields" class="hidden mt-2 flex gap-2"><input name="newProgram" class="input flex-1" placeholder="BS course or program"><button type="button" id="saveProgram" class="${BTN2}">Add course</button></div></div>`
      : `<label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Class *<select name="className" class="input mt-1" required><option value="">Choose a class</option>${(schoolClasses[level] || []).map(name => `<option value="${esc(name)}" ${name === course.className ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label>`}
    ${field("Monthly subject fee (Rs) *", "fee", course.fee ?? "", 'type="number" min="0" step="0.01" required')}
    ${teacherFields(course)}
    <p id="subjectFormError" class="text-sm text-red-600 hidden sm:col-span-2"></p></div>`;
}

function subjectForm(course = {}) {
  const level = course.academicLevel === "Intermediate (Inter)" ? "Inter" : course.academicLevel || classRecord(course.programName || course.className)?.academicLevel || "";
  return `<form id="subjectForm" class="space-y-3">
    ${selectField("Academic level *", "academicLevel", [["", "Choose academic level"], ...academicLevels], level)}
    <div id="subjectAssignmentFields">${assignmentFieldsHtml(level, course)}</div>
    <div id="subjectFormButtons" class="${level ? "" : "hidden"}">${formButtons(course.id ? "Save subject" : "Add subject")}</div></form>`;
}

function wireSubjectForm(existing, onSave) {
  const form = document.getElementById("subjectForm");
  const levelSelect = form.elements.academicLevel;
  const initialLevel = levelSelect.value;
  const readDraft = () => ({
    subjectName: form.elements.subjectName?.value || "",
    className: form.elements.className?.value || "",
    semester: form.elements.semester?.value || "",
    programName: form.elements.programName?.value || "",
    fee: form.elements.fee?.value || "",
    duration: form.elements.duration?.value || existing?.duration || "1 month",
    schedule: form.elements.schedule?.value || existing?.schedule || "",
    startDate: form.elements.startDate?.value || existing?.startDate || today(),
    capacity: form.elements.capacity?.value || existing?.capacity || 30
  });
  const renderFields = (level, draft = {}) => {
    form.querySelector("#subjectAssignmentFields").innerHTML = assignmentFieldsHtml(level, { ...existing, ...draft });
    form.querySelector("#subjectFormButtons").classList.toggle("hidden", !level);
    if (level === "BS") {
      form.querySelector("#toggleAddProgram").onclick = () => form.querySelector("#addProgramFields").classList.toggle("hidden");
      form.querySelector("#saveProgram").onclick = () => {
        if (!requirePermission("manage_courses")) return;
        const program = form.elements.newProgram.value.trim();
        if (!/^BS\b/i.test(program)) return showToast("BS course names must start with BS.", "error");
        if (courseOptions.programs.some(item => item.toLowerCase() === program.toLowerCase())) return showToast("That BS course already exists.", "error");
        courseOptions.programs.push(program);
        commit();
        renderFields("BS", { ...readDraft(), programName: program });
        showToast("BS course added");
      };
    }
  };
  levelSelect.addEventListener("change", () => renderFields(levelSelect.value, {}));
  if (!initialLevel && existing?.academicLevel) levelSelect.value = existing.academicLevel;
  renderFields(levelSelect.value);
  form.onsubmit = event => {
    event.preventDefault();
    if (!requirePermission("manage_courses")) return;
    const data = readDraft();
    const level = levelSelect.value, name = data.subjectName.trim(), fee = Number(data.fee);
    const className = level === "BS" ? "" : data.className;
    const programName = level === "BS" ? data.programName : "";
    const semester = level === "BS" ? data.semester : "";
    const validAssignment = level === "BS"
      ? Boolean(courseOptions.programs.includes(programName) && bsSemesters.some(item => item.value === semester))
      : Boolean(schoolClasses[level]?.includes(className));
    const duplicate = assignments().some(course => course !== existing
      && course.academicLevel === level && course.className === className && course.programName === programName
      && String(course.semester || "") === semester
      && (course.subjectName || course.name).toLowerCase() === name.toLowerCase());
    const error = !academicLevels.includes(level) ? "Choose Matric, Inter, or BS."
      : !name ? "Enter a subject name."
      : !validAssignment ? level === "BS" ? "Choose a valid BS course and semester." : "Choose a class for the selected academic level."
      : !Number.isFinite(fee) || fee < 0 ? "Monthly subject fee must be zero or more."
      : duplicate ? "This subject is already assigned to that class, course, and semester."
      : "";
    if (error) {
      const box = form.querySelector("#subjectFormError");
      if (box) { box.textContent = error; box.classList.remove("hidden"); }
      else showToast(error, "error");
      return;
    }
    const teacherIds = existing ? [...new Set(existing.teacherIds || (existing.teacherId ? [existing.teacherId] : []))] : [];
    const duration = data.duration.trim() || "1 month", capacity = Number(data.capacity);
    if (!(parseInt(duration, 10) > 0) || !(Number.isInteger(capacity) && capacity > 0)) {
      const box = form.querySelector("#subjectFormError"); box.textContent = "Duration and capacity must be positive."; box.classList.remove("hidden"); return;
    }
    const label = level === "BS" ? `${programName} · ${semesterLabel(semester)}` : className;
    const subject = {
      name: `${label} · ${name}`, type: "Subject-Based", className: level === "BS" ? programName : className,
      programName, semester, academicLevel: level, subjectName: name, fee,
      teacherIds, teacherId: teacherIds[0] || "", duration, schedule: data.schedule.trim(),
      startDate: data.startDate, capacity, status: form.elements.status?.value || "Active"
    };
    form.querySelector('[type="submit"]').disabled = true;
    onSave(subject);
  };
}

export function addCourse() {
  if (!requirePermission("manage_courses")) return;
  showModal("Add Subject", subjectForm(), { width: "max-w-3xl" });
  wireSubjectForm(null, subject => {
    courses.push({ id: nextId("CRS", courses), ...subject, students: 0 });
    commit(); closeModal(); showCourses(); showToast("Subject added");
  });
}

export function editCourse(id) {
  if (!requirePermission("manage_courses")) return;
  const course = assignments().find(item => item.id === id);
  if (!course) return showToast("Subject not found.", "error");
  showModal("Edit Subject", subjectForm(course), { width: "max-w-3xl" });
  wireSubjectForm(course, subject => {
    Object.assign(course, subject);
    students.forEach(student => studentEnrollments(student).forEach(enrollment => {
      if (enrollment.courseId === id) {
        enrollment.courseName = course.name;
        enrollment.className = course.className;
        enrollment.programName = course.programName;
        enrollment.semester = course.semester;
        enrollment.subjectName = course.subjectName;
      }
    }));
    commit(); closeModal(); showCourses(); showToast("Subject updated");
  });
}

export function toggleCourseStatus(id) {
  if (!requirePermission("manage_courses")) return;
  const course = assignments().find(item => item.id === id);
  if (!course) return showToast("Subject not found.", "error");
  course.status = course.status === "Active" ? "Inactive" : "Active";
  commit(); showCourses(); showToast(`Subject ${course.status.toLowerCase()}`);
}

export function deleteCourse(id) {
  if (!requirePermission("manage_courses")) return;
  const course = assignments().find(item => item.id === id);
  if (!course) return showToast("Subject not found.", "error");
  if (subjectUsed(id)) return showToast("This subject has enrollment or payment history. Deactivate it instead to preserve records.", "error");
  showConfirm(`Delete subject "${course.subjectName || course.name}"?`, () => {
    if (!requirePermission("manage_courses")) return;
    courses.splice(courses.findIndex(item => item.id === id), 1);
    commit(); showCourses(); showToast("Subject deleted", "warning");
  });
}

export function viewCourse(id) {
  if (!requirePermission("view_courses")) return;
  const course = assignments().find(item => item.id === id);
  if (!course) return showToast("Subject not found.", "error");
  showModal(course.subjectName || course.name, `<div class="space-y-2 text-sm">
    <p><strong>Academic level:</strong> ${esc(course.academicLevel || "")}</p>
    <p><strong>Assignment:</strong> ${esc(contextOf(course))}</p><p><strong>Monthly fee:</strong> ${money(course.fee)}</p>
    <p><strong>Timing:</strong> ${esc(course.schedule || "—")}</p><p><strong>Enrolled:</strong> ${course.students}/${course.capacity}</p></div>
    <div class="flex justify-end mt-4"><button onclick="closeModal()" class="${BTN2}">Close</button></div>`);
}

export function showSchedule() {
  if (!requirePermission("view_schedule")) return;
  setPageTitle("Schedule");
  const rows = teacherCourses(getCurrentUser().teacherId).filter(course => course.type === "Subject-Based").map(course => `<tr class="border-b dark:border-gray-700">
    <td class="${TD} font-medium">${esc(course.subjectName || course.name)}</td><td class="${TD}">${esc(contextOf(course))}</td><td class="${TD}">${esc(course.schedule || "—")}</td><td class="${TD}">${course.students} students</td></tr>`).join("");
  document.getElementById("content").innerHTML = tableCard({ title: "My timetable", headers: ["Subject", "Class / semester · course", "Schedule", "Enrolled"], rows: rows || emptyRow(4, "No subjects assigned.") });
}

Object.assign(window, { addCourse, editCourse, viewCourse, toggleCourseStatus, deleteCourse });
