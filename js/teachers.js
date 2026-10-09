// ============================================
// teachers.js — Teacher management (admin only)
// ============================================
import { teachers, courses, salaries, teacherSubjectAssignments, assignedTeacherSubjects, teacherExpectedSalary, setTeacherSubjectAssignments, nextId, commit } from "./data.js";
import { esc, money, today, emptyRow, tableCard, field, formButtons, showModal, closeModal, showToast, showConfirm, setPageTitle, BTN, TD } from "./ui.js";
import { requirePermission } from "./auth.js";

const subjectsFor = id => assignedTeacherSubjects(id);
const subjectLabel = course => `${course.subjectName || course.name} · ${course.programName || course.className || "Unassigned"}`;
const missingSalaryCount = id => subjectsFor(id).filter(course => course.monthlySalary == null).length;

export function showTeachers() {
  if (!requirePermission("manage_teachers")) return;
  setPageTitle("Teachers");
  const rows = teachers.map(t => `<tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"><td class="${TD} whitespace-nowrap">${esc(t.id)}</td><td class="${TD} font-medium">${esc(t.name)}</td><td class="${TD} whitespace-nowrap">${esc(t.phone || "—")}</td>
    <td class="${TD}">${subjectsFor(t.id).map(course => `${esc(course.subjectName || course.name)} (${course.monthlySalary == null ? "salary not set" : money(course.monthlySalary)})`).join(", ") || "—"}</td>
    <td class="${TD} font-semibold">${money(teacherExpectedSalary(t.id))}${missingSalaryCount(t.id) ? `<div class="text-xs font-normal text-amber-600">${missingSalaryCount(t.id)} subject salary amount(s) not set</div>` : ""}</td>
    <td class="${TD} text-right space-x-2 whitespace-nowrap"><button onclick="viewTeacher('${esc(t.id)}')" class="text-blue-600"><i class="fas fa-eye"></i></button><button onclick="editTeacher('${esc(t.id)}')" class="text-amber-600"><i class="fas fa-edit"></i></button><button onclick="deleteTeacher('${esc(t.id)}')" class="text-red-600"><i class="fas fa-trash"></i></button></td></tr>`).join("");
  document.getElementById("content").innerHTML = tableCard({ title: "All Teachers", tools: `<button onclick="addTeacher()" class="${BTN}"><i class="fas fa-plus mr-1"></i>Add Teacher</button>`,
    headers: ["ID", "Name", "Phone", "Assigned subjects · monthly salary", "Expected monthly total", "Actions"], rows: rows || emptyRow(6, "No teachers yet.") });
}

function teacherForm(t = {}) {
  const selected = new Map(t.id ? subjectsFor(t.id).map(course => [course.id, course.monthlySalary]) : []);
  const subjectOptions = courses.filter(course => course.type === "Subject-Based");
  return `<form id="teacherForm" class="space-y-3"><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    ${field("Full name *", "name", t.name, "required")}${field("Email", "email", t.email, 'type="email"')}${field("Phone *", "phone", t.phone, "required")}
    ${field("Join date", "joinDate", t.joinDate || today(), 'type="date"')}</div>
    <fieldset><legend class="text-sm font-medium mb-2">Assigned subjects</legend><p class="text-xs text-gray-500 mb-2">Choose offerings from Subject Management. A subject can be assigned to multiple teachers.</p>
      <div class="max-h-64 overflow-y-auto">${subjectOptions.map(course => {
        const isSelected = selected.has(course.id);
        return `<div class="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_12rem] gap-2 items-center p-2 border-b dark:border-gray-700 text-sm">
          <label class="flex items-center gap-2"><input type="checkbox" name="subjectIds" value="${esc(course.id)}" ${isSelected ? "checked" : ""}>
            <span>${esc(subjectLabel(course))}${course.status === "Inactive" ? " (Inactive)" : ""}</span></label>
          <label class="salary-input-label ${isSelected ? "" : "hidden"}">Salary for This Subject (Rs)
            <input class="input subject-salary mt-1" data-subject="${esc(course.id)}" type="number" min="0" step="0.01" value="${isSelected ? esc(selected.get(course.id)) : ""}" ${isSelected ? "required" : "disabled"}></label>
        </div>`;
      }).join("") || `<p class="text-sm text-gray-500">Add subjects in Subject Management first.</p>`}</div></fieldset>
      <p id="teacherSalaryWarning" class="text-xs text-amber-600 ${[...selected.values()].some(amount => amount == null) ? "" : "hidden"}">Total excludes assigned subjects that still need a salary amount.</p>
      <div class="flex justify-end text-sm font-semibold">Total monthly salary: <span id="teacherSalaryTotal" class="ml-2">${money([...selected.values()].reduce((sum, amount) => sum + Number(amount || 0), 0))}</span></div>
    <p id="formError" class="text-sm text-red-600 hidden"></p>${formButtons(t.id ? "Update" : "Save")}</form>`;
}
function wire(existing, onValid) {
  const f = document.getElementById("teacherForm");
  const updateTotal = () => {
    const total = [...f.querySelectorAll(".subject-salary:not(:disabled)")]
      .reduce((sum, input) => sum + (input.value.trim() && Number.isFinite(Number(input.value)) ? Number(input.value) : 0), 0);
    document.getElementById("teacherSalaryTotal").textContent = money(total);
    const missing = [...f.querySelectorAll(".subject-salary:not(:disabled)")].some(input => input.value.trim() === "");
    document.getElementById("teacherSalaryWarning").classList.toggle("hidden", !missing);
  };
  updateTotal();
  f.querySelectorAll('[name="subjectIds"]').forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const input = f.querySelector(`.subject-salary[data-subject="${CSS.escape(checkbox.value)}"]`);
      const label = input.closest(".salary-input-label");
      label.classList.toggle("hidden", !checkbox.checked);
      input.disabled = !checkbox.checked;
      input.required = checkbox.checked;
      if (!checkbox.checked) input.value = "";
      updateTotal();
    });
  });
  f.querySelectorAll(".subject-salary").forEach(input => input.addEventListener("input", updateTotal));
  f.onsubmit = async e => {
    e.preventDefault();
    if (!requirePermission("manage_teachers")) return;
    const d = Object.fromEntries(new FormData(f)), box = document.getElementById("formError");
    const err = d.name.trim().length < 2 ? "Name is required." : !/^[0-9+\-\s]{7,15}$/.test(d.phone.trim()) ? "Enter a valid phone number."
      : teachers.some(t => t !== existing && t.name.toLowerCase() === d.name.trim().toLowerCase()) ? "A teacher with this name already exists." : "";
    if (err) { box.textContent = err; box.classList.remove("hidden"); return; }
    const selected = [...f.querySelectorAll('[name="subjectIds"]:checked')].map(input => ({
      subjectId: input.value,
      monthlySalary: Number(f.querySelector(`.subject-salary[data-subject="${CSS.escape(input.value)}"]`).value)
    }));
    const names = selected.map(item => (courses.find(course => course.id === item.subjectId)?.subjectName || "").trim().toLocaleLowerCase());
    const invalidSalary = selected.some(item => {
      const input = f.querySelector(`.subject-salary[data-subject="${CSS.escape(item.subjectId)}"]`);
      return !input.value.trim() || !Number.isFinite(item.monthlySalary) || item.monthlySalary < 0;
    });
    if (invalidSalary) { box.textContent = "Enter a valid salary amount of 0 or more for every assigned subject."; box.classList.remove("hidden"); return; }
    if (new Set(names).size !== names.length) { box.textContent = "The same subject cannot be assigned twice to one teacher."; box.classList.remove("hidden"); return; }
    f.querySelector('[type="submit"]').disabled = true;
    try {
      await onValid({ name: d.name.trim(), email: d.email.trim(), phone: d.phone.trim(), joinDate: d.joinDate }, selected);
    } catch (error) {
      box.textContent = error.message || "Unable to save teacher details.";
      box.classList.remove("hidden");
      f.querySelector('[type="submit"]').disabled = false;
    }
  };
}
export function addTeacher() {
  if (!requirePermission("manage_teachers")) return;
  showModal("Add Teacher", teacherForm(), { width: "max-w-2xl" });
  wire(null, (d, assignments) => {
    const teacher = { id: nextId("TCH", teachers), ...d, courses: [] };
    teachers.push(teacher);
    try { setTeacherSubjectAssignments(teacher.id, assignments); }
    catch (error) { teachers.splice(teachers.indexOf(teacher), 1); throw error; }
    commit(); closeModal(); showTeachers(); showToast("Teacher added");
  });
}
export function editTeacher(id) {
  if (!requirePermission("manage_teachers")) return;
  const t = teachers.find(x => x.id === id);
  if (!t) return;
  showModal("Edit Teacher", teacherForm(t), { width: "max-w-2xl" });
  wire(t, (d, assignments) => {
    const previous = { name: t.name, email: t.email, phone: t.phone, joinDate: t.joinDate };
    Object.assign(t, d);
    try { setTeacherSubjectAssignments(t.id, assignments); }
    catch (error) { Object.assign(t, previous); throw error; }
    commit(); closeModal(); showTeachers(); showToast("Teacher updated");
  });
}
export function deleteTeacher(id) {
  if (!requirePermission("manage_teachers")) return;
  const t = teachers.find(x => x.id === id);
  if (!t) return;
  showConfirm(`Delete ${t.name}?`, () => {
    if (!requirePermission("manage_teachers")) return;
    teacherSubjectAssignments.splice(
      0, teacherSubjectAssignments.length,
      ...teacherSubjectAssignments.filter(assignment => assignment.teacherId !== id)
    );
    courses.forEach(course => {
      course.teacherIds = (course.teacherIds || []).filter(teacherId => teacherId !== id);
      course.teacherId = course.teacherIds[0] || "";
    });
    teachers.splice(teachers.findIndex(x => x.id === id), 1);
    commit(); showTeachers(); showToast("Teacher deleted; finalized salary history was preserved.", "warning");
  });
}
export function viewTeacher(id) {
  if (!requirePermission("manage_teachers")) return;
  const t = teachers.find(x => x.id === id);
  if (!t) return;
  const subjects = subjectsFor(id);
  const subjectRows = subjects.map(course => `<tr class="border-b dark:border-gray-700"><td class="py-2">${esc(subjectLabel(course))}</td><td class="py-2 text-right">${course.monthlySalary == null ? "Not set" : money(course.monthlySalary)}</td></tr>`).join("");
  showModal("Teacher Details", `<div class="space-y-1 text-sm"><p><strong>ID:</strong> ${esc(t.id)}</p><p><strong>Name:</strong> ${esc(t.name)}</p><p><strong>Email:</strong> ${esc(t.email || "-")}</p>
    <p><strong>Phone:</strong> ${esc(t.phone)}</p><p><strong>Joined:</strong> ${esc(t.joinDate || "—")}</p></div>
    <h4 class="font-semibold mt-4 mb-2">Assigned subjects and monthly salaries</h4>
    ${subjects.length ? `<table class="w-full text-sm"><tbody>${subjectRows}</tbody><tfoot><tr><td class="py-2 font-semibold">Total monthly salary</td><td class="py-2 text-right font-semibold">${money(teacherExpectedSalary(id))}</td></tr></tfoot></table>${missingSalaryCount(id) ? `<p class="text-xs text-amber-600 mt-2">Set the missing amounts in Edit Teacher; this total is incomplete.</p>` : ""}` : `<p class="text-sm text-gray-500">No subjects assigned.</p>`}
    <div class="flex justify-end mt-4"><button onclick="closeModal()" class="${BTN}">Close</button></div>`);
}
Object.assign(window, { addTeacher, editTeacher, deleteTeacher, viewTeacher });
