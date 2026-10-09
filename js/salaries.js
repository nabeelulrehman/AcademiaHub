// ============================================
// salaries.js — Monthly subject-based salaries and payment history
// ============================================
import {
  salaries, teachers, nextId,
  assignedTeacherSubjects, teacherExpectedSalary,
  salaryPaid, salaryBalance, salaryStatus, commit
} from "./data.js";
import {
  esc, money, today, badge, emptyRow, tableCard, field, selectField, formButtons, showModal,
  closeModal, showToast, setPageTitle, BTN, BTN2, CARD, TD
} from "./ui.js";
import { getCurrentUser, requirePermission } from "./auth.js";

const currentMonth = today().slice(0, 7);
const filters = { month: currentMonth.slice(5, 7), year: currentMonth.slice(0, 4), teacherId: "", subject: "", status: "", search: "" };
const tname = id => teachers.find(t => t.id === id)?.name
  || salaries.find(salary => salary.teacherId === id && salary.teacherName)?.teacherName
  || "Removed teacher";
const draftStatus = salary => !salary.subjects.length
  ? "No subjects assigned"
  : salary.subjects.some(subject => subject.rate == null) ? "Salary missing" : "Not generated";
const sel = "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700";

export function showSalaries() {
  const user = getCurrentUser(), admin = user.role === "admin";
  if (!requirePermission(admin ? "manage_salaries" : "view_own_salary")) return;
  setPageTitle(admin ? "Salaries" : "My Salary");
  const available = (admin ? salaries : salaries.filter(s => s.teacherId === user.teacherId));
  const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
  const yearOptions = [...new Set([today().slice(0, 4), ...available.map(s => s.month?.slice(0, 4)).filter(Boolean)])].sort().reverse();
  const list = available.filter(s => (!filters.month || s.month?.slice(5, 7) === filters.month)
    && (!filters.year || s.month?.slice(0, 4) === filters.year)
    && (!filters.teacherId || s.teacherId === filters.teacherId)
    && (!filters.subject || (s.subjects || []).some(subject => subject.subjectName === filters.subject))
    && (!filters.status || salaryStatus(s) === filters.status)
    && (!filters.search || `${tname(s.teacherId)} ${s.teacherId}`.toLowerCase().includes(filters.search.toLowerCase())))
    .slice().sort((a, b) => b.month.localeCompare(a.month) || tname(a.teacherId).localeCompare(tname(b.teacherId)));
  const currentPeriodMatchesFilters = (!filters.month || filters.month === currentMonth.slice(5, 7))
    && (!filters.year || filters.year === currentMonth.slice(0, 4));
  if (admin && currentPeriodMatchesFilters) {
    teachers.forEach(teacher => {
      if (list.some(salary => salary.teacherId === teacher.id && salary.month === currentMonth)) return;
      if (filters.teacherId && filters.teacherId !== teacher.id) return;
      if (filters.search && !`${teacher.name} ${teacher.id}`.toLowerCase().includes(filters.search.toLowerCase())) return;
      const assigned = assignedTeacherSubjects(teacher.id);
      if (filters.subject && !assigned.some(subject => (subject.subjectName || subject.name) === filters.subject)) return;
      const draft = {
        subjects: assigned.map(subject => ({
          courseId: subject.id,
          subjectName: subject.subjectName || subject.name,
          context: subject.programName || subject.className || "Unassigned",
          rate: subject.monthlySalary
        }))
      };
      if (filters.status && filters.status !== draftStatus(draft)) return;
      list.push({
        id: "",
        teacherId: teacher.id,
        teacherName: teacher.name,
        month: currentMonth,
        basic: teacherExpectedSalary(teacher.id),
        bonus: 0,
        deduction: 0,
        net: teacherExpectedSalary(teacher.id),
        subjects: draft.subjects,
        payments: [],
        isDraft: true
      });
    });
  }
  list.sort((a, b) => b.month.localeCompare(a.month) || tname(a.teacherId).localeCompare(tname(b.teacherId)));
  const totalPayable = list.reduce((sum, s) => sum + Number(s.net || 0), 0);
  const totalPaid = list.reduce((sum, s) => sum + salaryPaid(s), 0);
  const totalBalance = list.reduce((sum, s) => sum + salaryBalance(s), 0);
  const rows = list.map(s => {
    const assigned = s.subjects || [];
    const rates = assigned.map(item => `${esc(item.subjectName)}: ${item.rate == null ? "salary not set" : money(item.rate)}`).join("<br>") || "—";
    const paid = salaryPaid(s), balance = salaryBalance(s), status = salaryStatus(s);
    const actionContent = admin && !s.isDraft
      ? balance > 0
        ? `<button onclick="recordSalaryPayment('${esc(s.id)}')" class="${BTN} salary-pay-button"><i class="fas fa-money-bill-wave mr-1"></i>Pay</button>`
        : `<span class="text-green-600 text-xs font-medium">Paid</span>`
      : s.isDraft
        ? draftStatus(s) === "Not generated" ? "Generate to enable payments" : draftStatus(s) === "Salary missing" ? "Set amounts in Edit Teacher" : "Assign subjects first"
        : "";
    return `<tr class="border-b dark:border-gray-700"><td class="${TD}" data-label="Month">${esc(s.month)}</td>
      ${admin ? `<td class="${TD}" data-label="Teacher / ID">${esc(tname(s.teacherId))}<div class="text-xs text-gray-500">${esc(s.teacherId)}</div></td>` : ""}
      <td class="${TD}" data-label="Subjects">${assigned.length}</td><td class="${TD}" data-label="Per subject">${rates}</td>
      <td class="${TD}" data-label="Base salary">${money(s.basic)}</td><td class="${TD}" data-label="Bonus">${money(s.bonus)}</td><td class="${TD}" data-label="Deduction">${money(s.deduction)}</td>
      <td class="${TD} font-semibold" data-label="Net payable">${money(s.net)}</td><td class="${TD}" data-label="Paid">${money(paid)}</td><td class="${TD}" data-label="Balance">${money(balance)}</td>
      <td class="${TD}" data-label="Status">${s.isDraft ? badge(draftStatus(s)) : badge(status)}</td>
      ${admin ? `<td class="${TD} text-center whitespace-nowrap no-print" data-label="Actions">${actionContent}</td>` : ""}</tr>`;
  }).join("");
  const subjectOptions = [...new Set([
    ...available.flatMap(s => (s.subjects || []).map(item => item.subjectName)),
    ...(admin ? teachers.flatMap(teacher => assignedTeacherSubjects(teacher.id).map(subject => subject.subjectName || subject.name)) : [])
  ])].sort();
  const headers = ["Month", ...(admin ? ["Teacher / ID"] : []), "Subjects", "Per subject", "Base salary", "Bonus", "Deduction", "Net payable", "Paid", "Balance", "Status", ...(admin ? ["Actions"] : [])];
  const card = (label, value, color) => `<div class="${CARD} p-4"><p class="text-xs uppercase text-gray-500">${label}</p><p class="text-xl font-bold ${color}">${money(value)}</p></div>`;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const tools = admin ? `<select id="salaryYearFilter" class="${sel}"><option value="">All years</option>${yearOptions.map(year => `<option value="${esc(year)}" ${filters.year === year ? "selected" : ""}>${esc(year)}</option>`).join("")}</select>
    <select id="salaryMonthFilter" class="${sel}"><option value="">All months</option>${monthOptions.map(month => `<option value="${month}" ${filters.month === month ? "selected" : ""}>${monthNames[Number(month) - 1]}</option>`).join("")}</select>
    <select id="salaryTeacherFilter" class="${sel}"><option value="">All teachers</option>${teachers.map(t => `<option value="${esc(t.id)}" ${filters.teacherId === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>
    <select id="salarySubjectFilter" class="${sel}"><option value="">All subjects</option>${subjectOptions.map(subject => `<option value="${esc(subject)}" ${filters.subject === subject ? "selected" : ""}>${esc(subject)}</option>`).join("")}</select>
    <select id="salaryStatusFilter" class="${sel}"><option value="">All statuses</option>${["Pending", "Partially Paid", "Paid", "Not generated", "Salary missing", "No subjects assigned"].map(status => `<option value="${esc(status)}" ${filters.status === status ? "selected" : ""}>${esc(status)}</option>`).join("")}</select>
    <input id="salarySearch" class="${sel}" placeholder="Search teacher or ID" value="${esc(filters.search)}">
    <button onclick="generateMonthlySalaries()" class="${BTN}"><i class="fas fa-calendar-plus mr-1"></i>Generate month</button>` : "";
  document.getElementById("content").innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">${card("Net payable", totalPayable, "text-gray-800")}${card("Paid", totalPaid, "text-green-600")}${card("Remaining balance", totalBalance, "text-yellow-600")}</div>
    ${tableCard({ id: "reportContent", title: admin ? "Monthly teacher salary ledger" : `Salary statement — ${esc(user.name)}`,
      tools: `${tools}<button onclick="window.print()" class="${BTN2}"><i class="fas fa-print mr-1"></i>Print statement</button>`,
      headers, rows: rows || emptyRow(headers.length, "No salary records.") })}`;
  if (admin) {
    document.getElementById("salaryYearFilter").onchange = event => { filters.year = event.target.value; showSalaries(); };
    document.getElementById("salaryMonthFilter").onchange = event => { filters.month = event.target.value; showSalaries(); };
    document.getElementById("salaryTeacherFilter").onchange = event => { filters.teacherId = event.target.value; showSalaries(); };
    document.getElementById("salarySubjectFilter").onchange = event => { filters.subject = event.target.value; showSalaries(); };
    document.getElementById("salaryStatusFilter").onchange = event => { filters.status = event.target.value; showSalaries(); };
    document.getElementById("salarySearch").oninput = event => { filters.search = event.target.value; showSalaries(); const input = document.getElementById("salarySearch"); input.focus(); input.setSelectionRange(input.value.length, input.value.length); };
  }
}

export function generateMonthlySalaries() {
  if (!requirePermission("manage_salaries")) return;
  const content = [
    '<form id="generateSalaryForm" class="space-y-3">',
    field("Salary month", "month", today().slice(0, 7), 'type="month" required'),
    '<p class="text-sm text-gray-500">Creates a finalized salary snapshot for each teacher using their current subject assignments. Records are saved in this browser\'s localStorage. Teachers with no assigned subjects or missing salary amounts are skipped.</p>',
    '<p id="generateSalaryError" class="text-sm text-red-600 hidden"></p>',
    formButtons("Generate salaries"),
    "</form>"
  ].join("");
  showModal("Generate monthly salaries", content);
  const form = document.getElementById("generateSalaryForm");
  form.onsubmit = event => {
    event.preventDefault();
    if (!requirePermission("manage_salaries")) return;
    const month = form.elements.month.value;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      const error = document.getElementById("generateSalaryError");
      error.textContent = "Choose a valid salary month.";
      error.classList.remove("hidden");
      return;
    }
    const skipped = [];
    let created = 0;
    for (const teacher of teachers) {
      const duplicate = salaries.some(salary => salary.teacherId === teacher.id && salary.month === month);
      if (duplicate) {
        skipped.push(`${teacher.name}: already generated`);
        continue;
      }
      const assigned = assignedTeacherSubjects(teacher.id);
      if (!assigned.length) {
        skipped.push(`${teacher.name}: no assigned subjects`);
        continue;
      }
      if (assigned.some(subject => subject.monthlySalary == null)) {
        skipped.push(`${teacher.name}: salary amount missing for an assigned subject`);
        continue;
      }
      const subjects = [];
      for (const subject of assigned) {
        subjects.push({
          courseId: subject.id,
          subjectName: subject.subjectName || subject.name,
          context: subject.programName || subject.className || "Unassigned",
          rate: subject.monthlySalary
        });
      }
      const basic = subjects.reduce((sum, subject) => sum + subject.rate, 0);
      const salary = {
        id: nextId("SAL", salaries),
        teacherId: teacher.id,
        teacherName: teacher.name,
        month,
        basic,
        bonus: 0,
        deduction: 0,
        net: basic,
        subjects,
        notes: "",
        finalized: true,
        paymentDate: "",
        payments: []
      };
      salaries.push(salary);
      created++;
    }
    commit();
    closeModal();
    showSalaries();
    if (skipped.length) {
      showToast(`Generated ${created}; not generated: ${skipped.join("; ")}.`, "warning");
    }
    else if (created) showToast(`${created} monthly salary record(s) generated.`);
    else showToast("No salary records generated; records for this month already exist.", "info");
  };
}

function salaryForm(s) {
  return `<form id="salaryForm" class="space-y-3"><p class="text-sm"><strong>${esc(tname(s.teacherId))}</strong> · ${esc(s.month)}</p>
    <p class="text-sm">Base salary (finalized from assigned subjects): <strong>${money(s.basic)}</strong></p>
    <div class="grid grid-cols-2 gap-3">${field("Bonus", "bonus", s.bonus ?? 0, 'type="number" min="0" step="0.01" required')}
    ${field("Deduction", "deduction", s.deduction ?? 0, 'type="number" min="0" step="0.01" required')}</div>
    ${field("Notes", "notes", s.notes || "")}<p id="formError" class="text-sm text-red-600 hidden"></p>${formButtons("Update")}</form>`;
}
const fail = message => { const box = document.getElementById("formError"); box.textContent = message; box.classList.remove("hidden"); };
export function editSalary(id) {
  if (!requirePermission("manage_salaries")) return;
  const salary = salaries.find(item => item.id === id);
  if (!salary || salaryPaid(salary) > 0) return;
  showModal("Edit salary adjustments", salaryForm(salary));
  const form = document.getElementById("salaryForm");
  form.onsubmit = event => {
    event.preventDefault();
    if (!requirePermission("manage_salaries")) return;
    const bonus = Number(form.elements.bonus.value), deduction = Number(form.elements.deduction.value);
    if (![bonus, deduction].every(amount => Number.isFinite(amount) && amount >= 0)) return fail("Bonus and deduction must be valid amounts of 0 or more.");
    if (deduction > Number(salary.basic) + bonus) return fail("Deduction cannot exceed base salary + bonus.");
    salary.bonus = bonus;
    salary.deduction = deduction;
    salary.net = salary.basic + bonus - deduction;
    salary.notes = form.elements.notes.value.trim();
    commit(); closeModal(); showSalaries(); showToast("Salary adjustments updated");
  };
}

export function recordSalaryPayment(id) {
  if (!requirePermission("manage_salaries")) return;
  const salary = salaries.find(item => item.id === id);
  if (!salary || salaryBalance(salary) <= 0) return;
  const remaining = salaryBalance(salary);
  showModal("Record salary payment", `<form id="salaryPaymentForm" class="space-y-3">
    <p class="text-sm">${esc(tname(salary.teacherId))} · ${esc(salary.month)} · Remaining ${money(remaining)}</p>
    ${field("Payment amount (Rs)", "amount", remaining, 'type="number" min="0.01" step="0.01" required')}
    ${selectField("Payment method", "method", ["Cash", "Bank", "Mobile Wallet", "Other"], "Cash")}
    ${field("Payment date", "date", today(), 'type="date" required')}${field("Notes", "notes", "")}
    <p id="formError" class="text-sm text-red-600 hidden"></p>${formButtons("Save payment")}</form>`);
  const form = document.getElementById("salaryPaymentForm");
  form.onsubmit = event => {
    event.preventDefault();
    if (!requirePermission("manage_salaries")) return;
    const amount = Number(form.elements.amount.value);
    if (!Number.isFinite(amount) || amount <= 0) return fail("Payment must be greater than 0.");
    if (amount > salaryBalance(salary)) return fail(`Payment cannot exceed the remaining balance of ${money(salaryBalance(salary))}.`);
    const payment = {
      id: nextId("SPY", salaries.flatMap(item => item.payments || [])),
      amount,
      date: form.elements.date.value, method: form.elements.method.value, notes: form.elements.notes.value.trim()
    };
    const date = new Date(`${payment.date}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== payment.date) return fail("Enter a valid payment date.");
    salary.payments ||= [];
    salary.payments.push(payment);
    salary.paymentDate = payment.date;
    commit(); closeModal(); showSalaries(); showToast("Salary payment recorded");
  };
}

export function showSalaryPayments(id) {
  if (!requirePermission("manage_salaries")) return;
  const salary = salaries.find(item => item.id === id);
  if (!salary) return;
  const payments = salary.payments || [];
  const rows = payments.map(payment => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(payment.date)}</td><td class="${TD}">${money(payment.amount)}</td>
    <td class="${TD}">${esc(payment.method || "—")}</td><td class="${TD}">${esc(payment.notes || "")}</td></tr>`).join("");
  showModal("Salary payment history", `<p class="text-sm mb-3">${esc(tname(salary.teacherId))} · ${esc(salary.month)} · Paid ${money(salaryPaid(salary))} / ${money(salary.net)}</p>
    ${tableCard({ headers: ["Date", "Amount", "Method", "Notes"], rows: rows || emptyRow(4, "No payments recorded.") })}`);
}

Object.assign(window, { generateMonthlySalaries, editSalary, recordSalaryPayment, showSalaryPayments });
