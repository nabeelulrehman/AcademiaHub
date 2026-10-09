// ============================================
// students.js — Student records, class admission and subject enrollments
// ============================================
import { students, teachers, courses, courseOptions, academicLevels, schoolClasses, bsSemesters, classRecords, classRecord, attendance, payments, nextId, balanceOf, paidBy, teacherCourses, teacherStudents, studentEnrollments, enrollmentLabel, enrollmentBalance, enrollmentDue, enrollmentPaid, currentBillingMonth, calculateConcession, commit, todayISO } from "./data.js";
import { esc, money, today, badge, emptyRow, tableCard, field, selectField, formButtons, showModal, closeModal, showToast, showConfirm, setPageTitle, BTN, BTN2, TD } from "./ui.js";
import { getCurrentUser, requirePermission } from "./auth.js";

const filters = { search: "", className: "", subjectName: "", status: "" };
const roundFee = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const levelOptions = [["", "Choose academic level"], ...academicLevels];
const classNames = () => [...new Set([...Object.values(schoolClasses).flat(), ...classRecords().map(record => record.name)])];
const assignmentsForAdmission = () => courses.filter(course => course.type === "Subject-Based"
  && course.status !== "Inactive" && academicLevels.includes(course.academicLevel));
const subjectsForSelection = selection => courses.filter(course => {
  if (course.type !== "Subject-Based" || course.status === "Inactive" || course.academicLevel !== selection.academicLevel) return false;
  if (selection.academicLevel === "BS") return (course.programName || course.className) === selection.programName
    && String(course.semester || "") === String(selection.semester || "");
  return course.className === selection.className;
});
const semesterLabel = value => bsSemesters.find(semester => semester.value === String(value))?.label || "";
const activeEnrollments = student => studentEnrollments(student).filter(e => e.status === "Active");
const currentEnrollments = student => visibleEnrollments(student).filter(e => e.status === "Active");
const enrollmentSubjects = student => activeEnrollments(student).filter(e => e.courseType !== "Class-Based");
const subjectNames = student => enrollmentSubjects(student).map(e => e.subjectName || e.courseName).filter(Boolean);
const selection = student => subjectNames(student).join(", ") || "No subjects";

function visibleEnrollments(student) {
  const enrollments = studentEnrollments(student);
  const user = getCurrentUser();
  if (user?.role !== "teacher") return enrollments;
  const assigned = new Set(teacherCourses(user.teacherId).map(c => c.id));
  return enrollments.filter(e => assigned.has(e.courseId) && e.status === "Active");
}
function visibleStudents() {
  const user = getCurrentUser();
  return user?.role === "teacher" ? teacherStudents(user.teacherId) : students;
}
const pct = value => (value == null ? "—" : value + "%");
function visibleAttendance(student) {
  const ownSubjects = new Set(visibleEnrollments(student).map(e => e.courseId));
  return attendance.filter(a => a.studentId === student.id && (getCurrentUser()?.role !== "teacher" || ownSubjects.has(a.courseId)));
}
function visibleAttendancePct(student) {
  const records = visibleAttendance(student).filter(a => a.status !== "Leave");
  return records.length ? Math.round(records.filter(a => a.status !== "Absent").length / records.length * 100) : null;
}
const classOf = enrollment => enrollment?.programName || enrollment?.className || "";
const studentClass = student => student.className || classOf(activeEnrollments(student)[0]) || "—";
const hasEnrollmentMatch = (student, predicate) => visibleEnrollments(student).some(predicate);
const studentSelection = student => {
  const active = activeEnrollments(student).find(enrollment => enrollment.status === "Active");
  const academicLevel = student.academicLevel || classRecord(student.programName || student.className)?.academicLevel || "";
  return {
    academicLevel,
    className: student.className || "",
    programName: student.programName || (academicLevel === "BS" ? student.className : ""),
    semester: student.semester || active?.semester || ""
  };
};

function renderPage() {
  const role = getCurrentUser()?.role;
  const visible = visibleStudents();
  const list = visible.filter(student => {
    const query = filters.search.toLowerCase();
    const subjects = currentEnrollments(student).filter(e => e.courseType !== "Class-Based").map(e => e.subjectName || e.courseName).join(", ");
    return (!query || [student.name, student.id, subjects, studentClass(student)].some(value => value.toLowerCase().includes(query)))
      && (!filters.className || studentClass(student) === filters.className)
      && (!filters.subjectName || currentEnrollments(student).some(e => e.courseType !== "Class-Based" && e.subjectName === filters.subjectName))
      && (!filters.status || student.feeStatus === filters.status);
  });
  const showFees = role !== "teacher";
  const rows = list.map(student => `<tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
    <td class="${TD}">${esc(student.id)}</td><td class="${TD} font-medium">${esc(student.name)}</td><td class="${TD}">${esc(studentClass(student))}</td>
    <td class="${TD}">${esc(currentEnrollments(student).filter(e => e.courseType !== "Class-Based").map(e => e.subjectName || e.courseName).filter(Boolean).join(", ") || "—")}</td>
    ${showFees ? `<td class="${TD}">${esc(student.phone)}</td><td class="${TD}">${badge(student.feeStatus)}</td><td class="${TD}">${money(balanceOf(student))}</td>` : ""}
    <td class="${TD}">${pct(visibleAttendancePct(student))}</td><td class="${TD} text-right space-x-2 whitespace-nowrap">
      <button onclick="viewStudent('${esc(student.id)}')" title="View" class="text-blue-600"><i class="fas fa-eye"></i></button>
      ${role === "admin" ? `<button onclick="editStudent('${esc(student.id)}')" title="Edit" class="text-amber-600"><i class="fas fa-edit"></i></button><button onclick="deleteStudent('${esc(student.id)}')" title="Delete" class="text-red-600"><i class="fas fa-trash"></i></button>` : ""}
    </td></tr>`).join("");
  const sel = "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700";
  const allowedIds = role === "teacher" ? new Set(teacherCourses(getCurrentUser().teacherId).map(c => c.id)) : null;
  const subjectOptions = courses.filter(c => c.type === "Subject-Based" && c.status !== "Inactive" && (!allowedIds || allowedIds.has(c.id)));
  const tools = `<input id="studentSearch" placeholder="Search name, ID, class or subject..." value="${esc(filters.search)}" class="${sel} w-full sm:w-52">
    <select id="studentClass" class="${sel}"><option value="">All classes</option>${classNames().map(name => `<option ${name === filters.className ? "selected" : ""}>${esc(name)}</option>`).join("")}</select>
    <select id="studentSubject" class="${sel}"><option value="">All subjects</option>${[...new Set(subjectOptions.map(c => c.subjectName).filter(Boolean))].map(name => `<option ${name === filters.subjectName ? "selected" : ""}>${esc(name)}</option>`).join("")}</select>
    ${showFees ? `<select id="studentStatus" class="${sel}"><option value="">All fee status</option>${["Paid", "Partial", "Pending"].map(value => `<option ${value === filters.status ? "selected" : ""}>${value}</option>`).join("")}</select>` : ""}
    ${requirePermission("add_student", false) ? `<button onclick="addStudent()" class="${BTN}"><i class="fas fa-plus mr-1"></i>Add Student</button>` : ""}`;
  const headers = ["ID", "Name", "Class", "Subjects", ...(showFees ? ["Phone", "Fee status", "Pending"] : []), "Att%", "Actions"];
  return tableCard({ title: `${role === "teacher" ? "My Students" : "Students"} (${list.length})`, tools, headers, rows: rows || emptyRow(headers.length, "No students match.") });
}

export function showStudents() {
  if (!requirePermission("view_students")) return;
  setPageTitle(getCurrentUser().role === "teacher" ? "My Students" : "Students");
  const draw = refocus => {
    document.getElementById("content").innerHTML = renderPage();
    for (const [id, key] of [["studentSearch", "search"], ["studentClass", "className"], ["studentSubject", "subjectName"], ["studentStatus", "status"]]) {
      document.getElementById(id)?.addEventListener(id === "studentSearch" ? "input" : "change", event => { filters[key] = event.target.value; draw(id); });
    }
    if (refocus === "studentSearch") {
      const input = document.getElementById(refocus); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    }
  };
  draw();
}

function feeSummaryHtml() {
  return `<div id="feeSummary" class="sm:col-span-2 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-900/10 p-3 text-sm"></div>`;
}
function selectedIds(form) {
  return [...form.querySelectorAll('[name="subjectIds"]:checked')].map(input => input.value);
}
function currentClassValue(student) {
  return studentClass(student) !== "—" ? studentClass(student) : "";
}
function selectionFromForm(form) {
  const academicLevel = form.elements.academicLevel.value;
  const programName = academicLevel === "BS" ? form.elements.programName?.value || "" : "";
  return {
    academicLevel,
    className: academicLevel === "BS" ? programName : form.elements.className?.value || "",
    programName,
    semester: academicLevel === "BS" ? form.elements.semester?.value || "" : ""
  };
}
function subjectsMarkup(selection, selected = []) {
  const matching = subjectsForSelection(selection);
  if (!matching.length) return '<p class="text-sm text-gray-500">No active subjects are assigned to this selection. Configure them in Subjects.</p>';
  return matching.map(subject => `<label class="flex items-start gap-2 rounded-lg border dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30">
    <input type="checkbox" name="subjectIds" value="${esc(subject.id)}" ${selected.includes(subject.id) ? "checked" : ""} class="mt-1">
    <span class="flex-1 text-sm"><span class="font-medium">${esc(subject.subjectName || subject.name)}</span><span class="float-right font-semibold">${money(subject.fee)}/month</span>
    <span class="block text-xs text-gray-500">${esc(subject.schedule || "Schedule not set")}</span></span></label>`).join("");
}
function studentForm(student = {}) {
  const editing = Boolean(student.id);
  const className = currentClassValue(student);
  const academicLevel = student.academicLevel || classRecord(className)?.academicLevel || "";
  const programName = student.programName || (academicLevel === "BS" ? className : "");
  const selected = enrollmentSubjects(student).map(e => e.courseId);
  return `<form id="studentForm" class="space-y-4"><section><h4 class="font-semibold mb-2">Student details</h4>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${field("Student name *", "name", student.name, "required")}${field("Father / guardian *", "father", student.father, "required")}
      ${field("Phone *", "phone", student.phone, "required")}${field("Email", "email", student.email, 'type="email"')}
      ${field("Address", "address", student.address)}${field("Admission date *", "admissionDate", student.admissionDate || today(), `type="date" max="${today()}" required`)}
    </div></section>
    <section><h4 class="font-semibold mb-2">Academic selection</h4>
      ${selectField("Academic level *", "academicLevel", levelOptions, academicLevel)}
      <div id="studentAcademicFields" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">${studentSelectionFields(academicLevel, className, programName, student.semester || "")}</div>
    </section>
    <section><h4 class="font-semibold mb-2">Subject selection</h4><fieldset><legend class="text-xs text-gray-500 mb-2">Choose one or more subjects available in the selected class, course, and semester.</legend>
      <div id="subjectChoices" class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto">${subjectsMarkup({ academicLevel, className, programName, semester: student.semester || "" }, selected)}</div></fieldset></section>
    <section><h4 class="font-semibold mb-2">Fee concession</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${selectField("Concession type", "concessionType", [["Fixed", "Fixed amount (Rs)"], ["Percentage", "Percentage (%)"]], student.concessionType || "Fixed")}
        ${field("Concession value", "concessionValue", student.concessionValue ?? 0, 'type="number" min="0" step="0.01"')}</div>${feeSummaryHtml()}
    </section>
    <p id="formError" class="text-sm text-red-600 hidden"></p>${formButtons(editing ? "Update student" : "Admit student")}</form>`;
}
function studentSelectionFields(level, className = "", programName = "", semester = "") {
  if (level === "BS") return `<label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Course / program *
    <select name="programName" class="input mt-1" required><option value="">Choose a course</option>${(courseOptions.programs || []).map(program => `<option value="${esc(program)}" ${program === programName ? "selected" : ""}>${esc(program)}</option>`).join("")}</select></label>
    <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Semester *
    <select name="semester" class="input mt-1" required><option value="">Choose semester</option>${bsSemesters.map(item => `<option value="${item.value}" ${item.value === String(semester) ? "selected" : ""}>${esc(item.label)}</option>`).join("")}</select></label>`;
  if (schoolClasses[level]) return `<label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Class *
    <select name="className" class="input mt-1" required><option value="">Choose a class</option>${schoolClasses[level].map(name => `<option value="${esc(name)}" ${name === className ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label>`;
  return '<p class="text-sm text-gray-500">Choose an academic level to continue.</p>';
}

function updateFeeSummary(form) {
  const chosen = selectedIds(form).map(id => courses.find(course => course.id === id)).filter(Boolean);
  const total = roundFee(chosen.reduce((sum, course) => sum + Number(course.fee || 0), 0));
  const type = form.elements.concessionType.value;
  const value = Number(form.elements.concessionValue.value);
  const concession = Number.isFinite(value) && value >= 0 ? Math.min(total, calculateConcession(total, type, value)) : 0;
  const net = roundFee(total - concession);
  const rows = chosen.map(course => `<div class="flex justify-between gap-3 py-1"><span>${esc(course.subjectName || course.name)}</span><span>${money(course.fee)}</span></div>`).join("");
  document.getElementById("feeSummary").innerHTML = `<div class="font-semibold mb-1">Subject-wise monthly fee</div>
    ${rows || '<p class="text-xs text-gray-500">Select subjects to see the fee breakdown.</p>'}
    <div class="border-t dark:border-gray-700 mt-2 pt-2 space-y-1"><div class="flex justify-between"><span>Total fee</span><strong>${money(total)}</strong></div>
    <div class="flex justify-between"><span>Concession${type === "Percentage" ? ` (${Number.isFinite(value) ? value : 0}%)` : ""}</span><span>${money(concession)}</span></div>
    <div class="flex justify-between text-base"><strong>Net monthly fee</strong><strong>${money(net)}</strong></div></div>`;
}
function validate(form, ignoreId) {
  const values = Object.fromEntries(new FormData(form));
  const chosenIds = selectedIds(form);
  const selection = {
    academicLevel: values.academicLevel,
    className: values.academicLevel === "BS" ? values.programName : values.className,
    programName: values.academicLevel === "BS" ? values.programName : "",
    semester: values.academicLevel === "BS" ? values.semester : ""
  };
  const selectedCourses = chosenIds.map(id => courses.find(course => course.id === id));
  const total = roundFee(selectedCourses.reduce((sum, course) => sum + Number(course?.fee || 0), 0));
  const value = Number(values.concessionValue);
  const concession = Number.isFinite(value) && value >= 0 ? calculateConcession(total, values.concessionType, value) : NaN;
  if (String(values.name || "").trim().length < 2) return "Student name is required.";
  if (!String(values.father || "").trim()) return "Father/guardian name is required.";
  if (!/^[0-9+\-\s]{7,15}$/.test(String(values.phone || "").trim())) return "Enter a valid phone number (digits, + or -).";
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) return "Enter a valid email address.";
  if (!values.admissionDate || values.admissionDate > today()) return "Admission date cannot be in the future.";
  if (!academicLevels.includes(values.academicLevel)) return "Choose Matric, Inter, or BS.";
  if (values.academicLevel === "BS") {
    if (!courseOptions.programs.includes(selection.programName)) return "Choose a valid BS course or program.";
    if (!bsSemesters.some(semester => semester.value === selection.semester)) return "Choose a valid BS semester.";
  } else if (!schoolClasses[values.academicLevel]?.includes(selection.className)) return "Choose a class assigned to the selected academic level.";
  if (!chosenIds.length) return "Select at least one subject.";
  if (new Set(chosenIds).size !== chosenIds.length) return "A subject can only be selected once.";
  if (selectedCourses.some(course => !course || course.status === "Inactive"
    || !subjectsForSelection(selection).some(subject => subject.id === course.id))) return "Choose active subjects assigned to the selected class, course, and semester.";
  if (new Set(selectedCourses.map(course => (course.subjectName || course.name).toLowerCase())).size !== selectedCourses.length) return "A subject cannot be selected more than once for the same class.";
  if (total < 0 || selectedCourses.some(course => !(Number(course.fee) >= 0))) return "Subject fees must be zero or more.";
  if (!Number.isFinite(value) || value < 0 || (values.concessionType === "Percentage" && value > 100)) return "Enter a valid concession value (percentage must be between 0 and 100).";
  if (concession > total) return "Concession cannot exceed the total fee.";
  if (students.some(student => student.id !== ignoreId && student.name.toLowerCase() === values.name.trim().toLowerCase() && student.phone === values.phone.trim())) return "A student with this name and phone already exists.";
  return "";
}
function wireStudentForm(onValid, ignoreId = "") {
  const form = document.getElementById("studentForm");
  const renderAcademicFields = (level, className = "", programName = "", semester = "") => {
    form.querySelector("#studentAcademicFields").innerHTML = studentSelectionFields(level, className, programName, semester);
    form.querySelectorAll("#studentAcademicFields select").forEach(select => select.addEventListener("change", () => renderSubjects(false)));
  };
  const renderSubjects = preserve => {
    const selected = preserve ? selectedIds(form) : [];
    document.getElementById("subjectChoices").innerHTML = subjectsMarkup(selectionFromForm(form), selected);
    document.getElementById("subjectChoices").querySelectorAll('[name="subjectIds"]').forEach(input => input.addEventListener("change", () => updateFeeSummary(form)));
    updateFeeSummary(form);
  };
  form.elements.academicLevel.addEventListener("change", () => {
    renderAcademicFields(form.elements.academicLevel.value);
    renderSubjects(false);
  });
  renderAcademicFields(form.elements.academicLevel.value,
    form.elements.academicLevel.value === "BS" ? "" : form.elements.className?.value || "",
    form.elements.programName?.value || "",
    form.elements.semester?.value || "");
  form.elements.concessionType.addEventListener("change", () => updateFeeSummary(form));
  form.elements.concessionValue.addEventListener("input", () => updateFeeSummary(form));
  form.querySelectorAll('[name="subjectIds"]').forEach(input => input.addEventListener("change", () => updateFeeSummary(form)));
  updateFeeSummary(form);
  form.onsubmit = event => {
    event.preventDefault();
    const error = validate(form, ignoreId);
    const box = document.getElementById("formError");
    if (error) { box.textContent = error; box.classList.remove("hidden"); return; }
    const values = Object.fromEntries(new FormData(form));
    const chosen = selectedIds(form).map(id => courses.find(course => course.id === id));
    const oldIds = new Set(activeEnrollments(students.find(student => student.id === ignoreId)).map(enrollment => enrollment.courseId));
    const full = chosen.find(course => course.students - (oldIds.has(course.id) ? 1 : 0) >= course.capacity);
    if (full) { box.textContent = `${full.subjectName || full.name} has reached capacity.`; box.classList.remove("hidden"); return; }
    form.querySelector('[type="submit"]').disabled = true;
    onValid(values, chosen);
  };
}
function feeBreakdown(chosen, type, value) {
  const gross = roundFee(chosen.reduce((sum, course) => sum + Number(course.fee), 0));
  const concession = calculateConcession(gross, type, Number(value));
  let remainingNet = roundFee(gross - concession);
  return chosen.map((course, index) => {
    const original = roundFee(Number(course.fee));
    const payable = index === chosen.length - 1
      ? remainingNet
      : roundFee(original - (gross ? concession * original / gross : 0));
    remainingNet = roundFee(remainingNet - payable);
    return { course, original, payable, concession: roundFee(original - payable) };
  });
}
function newEnrollment(course, date, id, subjectFee = Number(course.fee), payableFee = subjectFee, concessionShare = 0) {
  const month = date.slice(0, 7);
  return {
    id, courseId: course.id, courseName: course.name, courseType: course.type || "Subject-Based", academicLevel: course.academicLevel || "",
    className: course.className || "", programName: course.programName || "", subjectName: course.subjectName || "",
    semester: course.semester || "", fee: payableFee, subjectFee, concessionShare, feeHistory: [{ effectiveMonth: month, fee: payableFee, subjectFee, concessionShare }],
    totalFee: payableFee * (parseInt(course.duration, 10) || 1), duration: course.duration, teacherId: course.teacherId,
    teacherIds: course.teacherIds || [course.teacherId], enrollmentDate: date, billingStartMonth: month, discounts: {}, status: "Active"
  };
}
function saveRate(enrollment, course, rate) {
  const month = currentBillingMonth();
  const previousFee = Number(enrollment.fee || 0), previousSubjectFee = Number(enrollment.subjectFee ?? enrollment.fee ?? 0);
  const previousConcession = Number(enrollment.concessionShare || 0);
  enrollment.feeHistory ||= [{ effectiveMonth: enrollment.billingStartMonth || month, fee: previousFee, subjectFee: previousSubjectFee, concessionShare: previousConcession }];
  enrollment.courseId = course.id; enrollment.courseName = course.name; enrollment.courseType = course.type;
  enrollment.academicLevel = course.academicLevel || "";
  enrollment.className = course.className || ""; enrollment.programName = course.programName || "";
  enrollment.subjectName = course.subjectName || ""; enrollment.teacherId = course.teacherId || "";
  enrollment.teacherIds = course.teacherIds || (course.teacherId ? [course.teacherId] : []);
  enrollment.subjectFee = rate.original; enrollment.concessionShare = rate.concession;
  enrollment.fee = rate.payable;
  enrollment.totalFee = rate.payable * (parseInt(course.duration, 10) || 1);
  const currentRate = { effectiveMonth: month, fee: rate.payable, subjectFee: rate.original, concessionShare: rate.concession };
  const existing = enrollment.feeHistory.findIndex(item => item.effectiveMonth === month);
  if (existing >= 0) enrollment.feeHistory[existing] = currentRate;
  else enrollment.feeHistory.push(currentRate);
  enrollment.feeHistory.sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth));
}
function applyStudentEnrollment(student, chosen, rates, enrollmentDate = student.admissionDate || todayISO()) {
  const chosenIds = new Set(chosen.map(course => course.id));
  student.enrollments ||= [];
  student.enrollments.forEach(enrollment => {
    if (enrollment.status === "Active" && !chosenIds.has(enrollment.courseId)) enrollment.status = "Inactive";
  });
  let sequence = Math.max(0, ...students.flatMap(item => studentEnrollments(item))
    .map(enrollment => Number(/^ENR-(\d+)$/.exec(enrollment.id || "")?.[1]) || 0)) + 1;
  rates.forEach(rate => {
    let enrollment = student.enrollments.find(item => item.status === "Active" && item.courseId === rate.course.id);
    if (!enrollment) {
      enrollment = newEnrollment(rate.course, enrollmentDate, `ENR-${String(sequence++).padStart(3, "0")}`, rate.original, rate.payable, rate.concession);
      student.enrollments.push(enrollment);
    } else saveRate(enrollment, rate.course, rate);
  });
  student.academicLevel = chosen[0]?.academicLevel || "";
  student.className = student.academicLevel === "BS" ? chosen[0]?.programName || chosen[0]?.className || "" : chosen[0]?.className || "";
  student.programName = student.academicLevel === "BS" ? chosen[0]?.programName || chosen[0]?.className || "" : "";
  student.semester = student.academicLevel === "BS" ? chosen[0]?.semester || "" : "";
  student.selectedSubjectIds = chosen.map(course => course.id);
}
function setConcession(student, values, rates) {
  student.concessionType = values.concessionType;
  student.concessionValue = Number(values.concessionValue);
  student.grossMonthlyFee = roundFee(rates.reduce((sum, rate) => sum + rate.original, 0));
  student.concessionAmount = roundFee(rates.reduce((sum, rate) => sum + rate.concession, 0));
  student.netMonthlyFee = roundFee(rates.reduce((sum, rate) => sum + rate.payable, 0));
  student.monthlyFee = student.netMonthlyFee;
}
function recalculateActiveSubjects(student) {
  const chosen = activeEnrollments(student).filter(enrollment => enrollment.courseType !== "Class-Based")
    .map(enrollment => courses.find(course => course.id === enrollment.courseId)).filter(Boolean);
  if (!chosen.length) return;
  const type = student.concessionType || "Fixed";
  let value = Number(student.concessionValue || 0);
  if (type === "Fixed") value = Math.min(value, chosen.reduce((sum, course) => sum + Number(course.fee || 0), 0));
  const rates = feeBreakdown(chosen, type, value);
  rates.forEach(rate => {
    const enrollment = student.enrollments.find(item => item.status === "Active" && item.courseId === rate.course.id);
    if (enrollment) saveRate(enrollment, rate.course, rate);
  });
  setConcession(student, { concessionType: type, concessionValue: value }, rates);
}

export function addStudent() {
  if (!requirePermission("add_student")) return;
  if (!assignmentsForAdmission().length) return showToast("Configure subjects under Matric, Inter, or BS before admitting students.", "warning");
  showModal("Add Student", studentForm(), { width: "max-w-3xl" });
  wireStudentForm((values, chosen) => {
    if (!requirePermission("add_student")) return;
    const rates = feeBreakdown(chosen, values.concessionType, values.concessionValue);
    const student = {
      id: nextId("STU", students), name: values.name.trim(), father: values.father.trim(), phone: values.phone.trim(),
      email: values.email.trim(), address: values.address.trim(), academicLevel: values.academicLevel,
      className: values.academicLevel === "BS" ? values.programName : values.className,
      programName: values.academicLevel === "BS" ? values.programName : "", semester: values.academicLevel === "BS" ? values.semester : "",
      course: "", admissionDate: values.admissionDate,
      monthlyFee: 0, totalFee: 0, enrollments: [], feeStatus: "Pending", attendance: null
    };
    if (students.some(item => item.id === student.id)) return showToast("Duplicate student ID — try again.", "error");
    setConcession(student, values, rates);
    applyStudentEnrollment(student, chosen, rates, values.admissionDate);
    students.push(student); commit();
    showModal("Admission Confirmed", `<div class="space-y-2 text-sm"><p class="text-green-600 font-semibold"><i class="fas fa-check-circle mr-1"></i>Student admitted successfully.</p>
      <p><strong>Student ID:</strong> ${esc(student.id)}</p><p><strong>Name:</strong> ${esc(student.name)}</p>
      <p><strong>Academic level:</strong> ${esc(student.academicLevel)}</p><p><strong>Class / course:</strong> ${esc(student.className)}${student.academicLevel === "BS" ? ` · ${esc(semesterLabel(student.semester))}` : ""}</p>
      <p><strong>Subjects:</strong> ${esc(selection(student))}</p><p><strong>Total fee:</strong> ${money(student.grossMonthlyFee)}</p>
      <p><strong>Concession (${esc(student.concessionType)}):</strong> ${esc(student.concessionValue)}${student.concessionType === "Percentage" ? "%" : " Rs"} · ${money(student.concessionAmount)}</p>
      <p><strong>Net monthly fee:</strong> ${money(student.netMonthlyFee)}</p></div>
      <div class="flex justify-end gap-2 mt-4"><button onclick="closeModal()" class="${BTN2}">Close</button>
      ${requirePermission("receive_fee", false) ? `<button onclick="receiveFee('${esc(student.id)}','${esc(student.enrollments[0]?.id || "")}')" class="${BTN}">Collect fee</button>` : ""}</div>`);
    if (document.getElementById("pageTitle").textContent === "Students") showStudents();
  });
}

export function enrollStudent(id) {
  if (!requirePermission("add_student")) return;
  const student = students.find(item => item.id === id);
  if (!student) return showToast("Student not found.", "error");
  const alreadySelected = new Set(enrollmentSubjects(student).map(enrollment => enrollment.courseId));
  const available = subjectsForSelection(studentSelection(student)).filter(course => !alreadySelected.has(course.id));
  if (!available.length) return showToast("No additional subjects are available for this student's class.", "warning");
  showModal(`Add subjects · ${student.name}`, `<form id="addSubjectsForm" class="space-y-3">
    <p class="text-sm text-gray-500">Class: ${esc(studentClass(student))}. Selected subjects cannot be added again.</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${available.map(course => `<label class="flex items-center justify-between gap-3 rounded border dark:border-gray-700 p-3">
      <span><input type="checkbox" name="subjectIds" value="${esc(course.id)}" class="mr-2">${esc(course.subjectName || course.name)}</span><strong class="text-sm">${money(course.fee)}/month</strong></label>`).join("")}</div>
    <p id="addSubjectsError" class="text-sm text-red-600 hidden"></p>${formButtons("Add selected subjects")}</form>`, { width: "max-w-2xl" });
  document.getElementById("addSubjectsForm").onsubmit = event => {
    event.preventDefault();
    if (!requirePermission("add_student")) return;
    const ids = [...event.currentTarget.querySelectorAll('[name="subjectIds"]:checked')].map(input => input.value);
    const chosenIds = [...alreadySelected, ...ids];
    const chosen = chosenIds.map(subjectId => courses.find(course => course.id === subjectId)).filter(Boolean);
    const full = chosen.find(course => !alreadySelected.has(course.id) && course.students >= course.capacity);
    const error = !ids.length ? "Select at least one subject."
      : new Set(ids).size !== ids.length || ids.some(subjectId => alreadySelected.has(subjectId)) ? "A subject cannot be selected more than once."
      : full ? `${full.subjectName || full.name} has reached capacity.` : "";
    if (error) {
      const box = document.getElementById("addSubjectsError"); box.textContent = error; box.classList.remove("hidden"); return;
    }
    const values = { concessionType: student.concessionType || "Fixed", concessionValue: Number(student.concessionValue || 0) };
    const gross = chosen.reduce((sum, course) => sum + Number(course.fee || 0), 0);
    if (new Set(chosen.map(course => (course.subjectName || course.name).toLowerCase())).size !== chosen.length) {
      return showToast("A subject cannot be selected more than once for the same class.", "error");
    }
    if (values.concessionType === "Fixed" && values.concessionValue > gross) {
      return showToast("The saved fixed concession is greater than the updated subject total. Edit the student and adjust the concession first.", "error");
    }
    const rates = feeBreakdown(chosen, values.concessionType, values.concessionValue);
    setConcession(student, values, rates); applyStudentEnrollment(student, chosen, rates, today()); commit();
    closeModal(); showStudents(); showToast("Subjects added and fees recalculated");
  };
}

const tnameFor = id => teachers.find(teacher => teacher.id === id)?.name || "Unassigned";
const teachersLookup = tnameFor;

export function editStudent(id) {
  if (!requirePermission("manage_students")) return;
  const student = students.find(item => item.id === id);
  if (!student) return showToast("Student not found.", "error");
  showModal("Edit Student", studentForm(student), { width: "max-w-3xl" });
  wireStudentForm((values, chosen) => {
    if (!requirePermission("manage_students")) return;
    const rates = feeBreakdown(chosen, values.concessionType, values.concessionValue);
    Object.assign(student, {
      name: values.name.trim(), father: values.father.trim(), phone: values.phone.trim(), email: values.email.trim(),
      address: values.address.trim(), academicLevel: values.academicLevel, className: values.className, admissionDate: values.admissionDate
    });
    setConcession(student, values, rates);
    applyStudentEnrollment(student, chosen, rates, today());
    commit(); closeModal(); showStudents(); showToast("Student and subject fees updated");
  }, id);
}

export function toggleEnrollment(studentId, enrollmentId) {
  if (!requirePermission("add_student")) return;
  const student = students.find(item => item.id === studentId), enrollment = studentEnrollments(student).find(item => item.id === enrollmentId);
  if (!student || !enrollment) return showToast("Enrollment not found.", "error");
  if (enrollment.status !== "Active") {
    const course = courses.find(item => item.id === enrollment.courseId);
    if (!course || course.status === "Inactive") return showToast("Activate the subject before reactivating this enrollment.", "error");
    if (course.students >= course.capacity) return showToast("Subject capacity is full.", "error");
  }
  enrollment.status = enrollment.status === "Active" ? "Inactive" : "Active";
  recalculateActiveSubjects(student);
  commit(); viewStudent(studentId); showToast(`Subject enrollment ${enrollment.status.toLowerCase()}`);
}

export function deleteStudent(id) {
  if (!requirePermission("manage_students")) return;
  const student = students.find(item => item.id === id);
  if (!student) return;
  showConfirm(`Delete ${student.name}? Their attendance records are removed; payment records are kept for the accounts.`, () => {
    if (!requirePermission("manage_students")) return;
    students.splice(students.findIndex(item => item.id === id), 1);
    for (let i = attendance.length - 1; i >= 0; i--) if (attendance[i].studentId === id) attendance.splice(i, 1);
    commit(); showStudents(); showToast("Student deleted", "warning");
  });
}

export function viewStudent(id) {
  const role = getCurrentUser()?.role, student = visibleStudents().find(item => item.id === id);
  if (!student) return showToast("Student not found or not permitted.", "error");
  const records = visibleAttendance(student), count = status => records.filter(item => item.status === status).length;
  const attendanceHtml = `<h4 class="font-semibold mt-4 mb-1">Attendance</h4><p class="text-sm">${pct(visibleAttendancePct(student))} — Present ${count("Present")}, Late ${count("Late")}, Absent ${count("Absent")}, Leave ${count("Leave")}</p>`;
  const enrollments = visibleEnrollments(student);
  const enrollmentRows = enrollments.map(enrollment => `<li class="py-2 border-b dark:border-gray-700"><div class="flex justify-between gap-3"><strong>${esc(enrollment.courseType === "Class-Based" ? "Class fee (legacy record)" : enrollment.subjectName || enrollmentLabel(enrollment))}</strong>${badge(enrollment.status)}</div>
    <p class="text-xs text-gray-500">${esc(enrollment.className || studentClass(student))} · ${esc(enrollment.enrollmentDate)} · ${esc(teachersLookup(enrollment.teacherId))}
      · Subject fee ${money(enrollment.subjectFee ?? enrollment.fee)}/month · Payable ${money(enrollment.fee)}/month · ${enrollment.status === "Active" ? `Balance ${money(enrollmentBalance(enrollment))}` : "Historical balance retained with payment records"}</p>
    ${role !== "teacher" && requirePermission("add_student", false) ? `<button class="text-xs text-blue-600 mt-1" onclick="toggleEnrollment('${esc(student.id)}','${esc(enrollment.id)}')">${enrollment.status === "Active" ? "Deactivate enrollment" : "Reactivate enrollment"}</button>` : ""}</li>`).join("");
  let body = `<p><strong>ID:</strong> ${esc(student.id)}</p><p><strong>Name:</strong> ${esc(student.name)}</p>
    <p><strong>Academic level:</strong> ${esc(student.academicLevel || "—")}</p>
    <p><strong>Class / course:</strong> ${esc(studentClass(student))}${student.academicLevel === "BS" ? ` · ${esc(semesterLabel(student.semester))}` : ""}</p><h4 class="font-semibold mt-3 mb-1">Enrolled subjects</h4>
    <ul class="text-sm divide-y dark:divide-gray-700">${enrollmentRows || '<li class="text-gray-400">No subject enrollments.</li>'}</ul>`;
  if (role !== "teacher") {
    const studentPayments = payments.filter(payment => payment.studentId === id).sort((a, b) => b.date.localeCompare(a.date));
    body += `<p class="mt-3"><strong>Father/guardian:</strong> ${esc(student.father)}</p><p><strong>Phone:</strong> ${esc(student.phone)}</p><p><strong>Email:</strong> ${esc(student.email || "-")}</p>
      <p><strong>Address:</strong> ${esc(student.address || "-")}</p><p><strong>Admission:</strong> ${esc(student.admissionDate)}</p>
      <div class="mt-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3 space-y-1"><p><strong>Total monthly fee:</strong> ${money(student.grossMonthlyFee ?? student.monthlyFee)}</p>
      <p><strong>Concession (${esc(student.concessionType || "Fixed")}):</strong> ${money(student.concessionAmount || 0)}${student.concessionType === "Percentage" ? ` (${esc(student.concessionValue)}%)` : ""}</p>
      <p><strong>Net monthly fee:</strong> ${money(student.netMonthlyFee ?? student.monthlyFee)}</p>
      <p><strong>This month due / paid / pending (${esc(currentBillingMonth())}):</strong> ${money(enrollments.filter(enrollment => enrollment.status === "Active").reduce((sum, enrollment) => sum + enrollmentDue(enrollment), 0))} / ${money(enrollments.filter(enrollment => enrollment.status === "Active").reduce((sum, enrollment) => sum + enrollmentPaid(enrollment.id), 0))} / ${money(balanceOf(student))} ${badge(student.feeStatus)}</p></div>
      <p class="mt-2"><strong>Total historical payments:</strong> ${money(paidBy(id))}</p>${attendanceHtml}
      <div class="flex items-center justify-between gap-2 mt-4 mb-1"><h4 class="font-semibold">Payment history</h4>${requirePermission("print_receipt", false) ? `<button onclick="generateDemoReceipt('${esc(id)}')" class="${BTN2} text-xs">Generate Demo Receipt</button>` : ""}</div>
      ${studentPayments.length ? `<ul class="text-sm divide-y dark:divide-gray-700">${studentPayments.map(payment => `<li class="py-2 flex justify-between items-center gap-2"><span>${esc(payment.date)} · ${esc(payment.receiptNumber || payment.id)} · ${esc(payment.method)}</span><span class="flex items-center gap-2"><strong>${money(payment.amount)}</strong>${requirePermission("print_receipt", false) ? `<button onclick="printReceipt('${esc(payment.id)}')" class="text-blue-600 text-xs">Reprint original</button>` : ""}</span></li>`).join("")}</ul>` : '<p class="text-sm text-gray-400">No payments yet.</p>'}`;
  } else body += attendanceHtml;
  showModal("Student Details", `<div class="space-y-1 text-sm">${body}</div><div class="flex justify-end mt-4"><button onclick="closeModal()" class="${BTN}">Close</button></div>`, { width: "max-w-2xl" });
}

Object.assign(window, { addStudent, enrollStudent, editStudent, deleteStudent, viewStudent, toggleEnrollment });
