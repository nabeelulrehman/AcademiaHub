// ============================================
// fees.js — Billing periods, pending fees, payment history and receipts
// ============================================
import { students, teachers, courses, payments, nextId, studentEnrollments, enrollmentLabel, enrollmentPaymentsForMonth, billingPeriodsForEnrollment, enrollmentDue, enrollmentFeeBreakdown, enrollmentPaid, enrollmentBalance, balanceOf, feeRowsForMonth, currentBillingMonth, commit } from "./data.js";
import { esc, money, today, badge, emptyRow, tableCard, field, selectField, formButtons, showModal, closeModal, showToast, setPageTitle, downloadCSV, BTN, BTN2, TD } from "./ui.js";
import { getCurrentUser, requirePermission } from "./auth.js";

const state = { search: "", className: "", subjectName: "", month: currentBillingMonth(), status: "" };
const payState = { search: "", from: "", to: "" };
const sel = "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700";
const classOf = enrollment => enrollment.programName || enrollment.className || "—";
const teacherNames = course => (course?.teacherIds || [course?.teacherId]).map(id => teachers.find(t => t.id === id)?.name).filter(Boolean).join(", ");
const roundFee = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const studentAcademicContext = student => {
  const level = student?.academicLevel || "—";
  const context = student?.academicLevel === "BS"
    ? `${student.programName || student.className || "—"}${student.semester ? ` · BS ${["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"][Number(student.semester) - 1] || student.semester} Semester` : ""}`
    : student?.className || "—";
  return { level, context };
};
function feeSnapshot(student, month) {
  return studentEnrollments(student).filter(enrollment => enrollment.status === "Active")
    .map(enrollment => {
      const fee = enrollmentFeeBreakdown(enrollment, month);
      return {
        courseId: enrollment.courseId,
        label: enrollment.courseType === "Class-Based" ? `Class fee · ${classOf(enrollment)}` : enrollment.subjectName || enrollment.courseName,
        className: classOf(enrollment),
        semester: enrollment.semester || "",
        gross: roundFee(fee.gross),
        concession: roundFee(fee.concession),
        net: roundFee(fee.net)
      };
    });
}
function nextReceiptNumber() {
  const highest = payments.reduce((current, payment) => {
    const match = /^RCP-(\d+)$/.exec(payment.receiptNumber || "");
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  let sequence = highest + 1;
  let candidate = `RCP-${String(sequence).padStart(6, "0")}`;
  while (payments.some(payment => payment.receiptNumber === candidate || payment.id === candidate)) {
    sequence++;
    candidate = `RCP-${String(sequence).padStart(6, "0")}`;
  }
  return candidate;
}
function receiptLines(snapshot, demo) {
  return snapshot.map(line => `<tr><td>${esc(line.label)}</td><td>${esc(line.className || "—")}${line.semester ? ` · BS ${esc(["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"][Number(line.semester) - 1] || line.semester)} Semester` : ""}</td>
    <td class="text-right">${money(line.gross)}</td>${demo ? "" : `<td class="text-right">${money(line.concession)}</td><td class="text-right">${money(line.net)}</td>`}</tr>`).join("")
    || `<tr><td colspan="${demo ? 3 : 5}" class="text-center text-gray-500">No active fee enrollments.</td></tr>`;
}
function receiptContent({ type, student, payment, snapshot, balance, enrollmentBalanceAfter }) {
  const demo = type === "Demo";
  const context = studentAcademicContext(student);
  const totals = snapshot.reduce((sum, line) => ({
    gross: roundFee(sum.gross + Number(line.gross || 0)),
    concession: roundFee(sum.concession + Number(line.concession || 0)),
    net: roundFee(sum.net + Number(line.net || 0))
  }), { gross: 0, concession: 0, net: 0 });
  const row = (label, value, strong = false) => `<div class="receipt-total-row"><span>${label}</span><strong${strong ? ' class="text-lg"' : ""}>${value}</strong></div>`;
  return `<article id="receiptContent" class="receipt-sheet ${demo ? "receipt-demo" : "receipt-original"}">
    <header class="receipt-header"><h2>AcademiaHub</h2><p>Student Fee Receipt</p><span class="receipt-type">${demo ? "DEMO RECEIPT" : "ORIGINAL RECEIPT"}</span></header>
    <div class="receipt-meta">
      ${payment ? `<div><span>Receipt number</span><strong>${esc(payment.receiptNumber || payment.id)}</strong></div>
        <div><span>Payment date</span><strong>${esc(payment.date)}</strong></div><div><span>Billing period</span><strong>${esc(payment.billingMonth)}</strong></div>
        <div><span>Payment method</span><strong>${esc(payment.method)}</strong></div>` : `<div><span>Receipt purpose</span><strong>Fee preview only</strong></div><div><span>Prepared on</span><strong>${esc(today())}</strong></div>`}
    </div>
    <section class="receipt-student"><h3>Student details</h3>
      <div><span>Student</span><strong>${esc(student.name)}</strong></div><div><span>Father / guardian</span><strong>${esc(student.father || "—")}</strong></div>
      <div><span>Student ID</span><strong>${esc(student.id)}</strong></div><div><span>Academic level</span><strong>${esc(context.level)}</strong></div>
      <div><span>Class / course and semester</span><strong>${esc(context.context)}</strong></div>
    </section>
    <section class="receipt-fees"><h3>Fee breakdown</h3><div class="overflow-x-auto"><table><thead><tr><th>Subject</th><th>Class / semester</th><th class="text-right">Full fee</th>${demo ? "" : '<th class="text-right">Concession</th><th class="text-right">Net fee</th>'}</tr></thead>
      <tbody>${receiptLines(snapshot, demo)}</tbody></table></div></section>
    <section class="receipt-totals">
      ${row("Original total fee", money(totals.gross))}
      ${demo
        ? `${row("Concession", "Not deducted on this receipt")}${row("Amount displayed", money(totals.gross), true)}`
        : `${row("Applicable concession", money(totals.concession))}${row("Net payable fee", money(totals.net), true)}
          ${row("Actual payment received", money(payment.amount), true)}
          ${row("Remaining pending balance · all student enrollments", money(balance), true)}
          ${row("Remaining balance · paid enrollment", money(enrollmentBalanceAfter))}`}
    </section>
    <footer class="receipt-footer">${demo ? "Demo only — this preview is not a payment receipt and does not record a transaction." : `Received by ${esc(payment.receivedBy || "—")} · Reference ${esc(payment.reference || "—")}`}</footer>
  </article>`;
}

export function printThermalReceipt() {
  if (!requirePermission("print_receipt")) return;
  const receipt = document.getElementById("receiptContent");
  if (!receipt) return showToast("Receipt is not available to print.", "error");
  const printWindow = window.open("", "_blank", "width=460,height=800");
  if (!printWindow) return showToast("Allow pop-ups to open the thermal receipt preview.", "error");
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Thermal fee receipt</title><style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; margin: 0; color: #000; font: 10px/1.35 Arial, sans-serif; }
    body { padding: 24px 12px; background: #e5e7eb; }
    .thermal-paper { width: 80mm; margin: 0 auto; padding: 3mm; background: #fff; box-shadow: 0 3px 16px #0003; }
    .receipt-sheet { width: 100%; margin: 0; padding: 0; }
    .receipt-header { padding-bottom: 6px; border-bottom: 1px dashed #000; text-align: center; }
    .receipt-header h2 { margin: 0; font-size: 17px; }
    .receipt-header p { margin: 2px 0; }
    .receipt-type { display: inline-block; margin-top: 4px; font-weight: 700; }
    .receipt-meta, .receipt-student { display: block; padding: 6px 0; border-bottom: 1px dashed #000; }
    .receipt-meta div, .receipt-student div { display: flex; justify-content: space-between; gap: 6px; padding: 1px 0; }
    .receipt-meta span, .receipt-student span { color: #222; }
    .receipt-student h3, .receipt-fees h3 { margin: 0 0 4px; font-size: 11px; }
    .receipt-fees { padding: 7px 0; }
    .receipt-sheet .overflow-x-auto { overflow: visible; }
    .receipt-sheet table { display: block; width: 100%; border-collapse: collapse; font-size: 10px; }
    .receipt-sheet thead { display: none; }
    .receipt-sheet tbody, .receipt-sheet tr { display: block; }
    .receipt-sheet tr { padding: 4px 0; border-bottom: 1px dashed #777; }
    .receipt-sheet td { display: flex; justify-content: space-between; gap: 6px; padding: 1px 0; border: 0; text-align: left; }
    .receipt-sheet td:first-child { display: block; font-weight: 700; }
    .receipt-sheet td:nth-child(2) { display: none; }
    .receipt-demo td:nth-child(3)::before { content: "Full fee"; }
    .receipt-original td:nth-child(3)::before { content: "Full fee"; }
    .receipt-original td:nth-child(4)::before { content: "Concession"; }
    .receipt-original td:nth-child(5)::before { content: "Net fee"; }
    .receipt-sheet td.text-right { text-align: right; }
    .receipt-totals { width: 100%; margin: 0; padding-top: 5px; border-top: 1px dashed #000; }
    .receipt-total-row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
    .receipt-footer { margin-top: 8px; padding-top: 5px; border-top: 1px dashed #000; text-align: center; font-size: 9px; }
    .print-toolbar { position: sticky; top: 8px; width: fit-content; margin: 0 auto 12px; }
    .print-toolbar button { padding: 8px 16px; border: 0; border-radius: 6px; color: #fff; background: #2563eb; font-weight: 700; cursor: pointer; }
    @media print {
      html, body { width: 80mm; background: #fff; }
      body { padding: 0; }
      .thermal-paper { width: 80mm; min-height: 0; margin: 0; padding: 3mm; box-shadow: none; }
      .print-toolbar { display: none; }
    }
  </style></head><body><div class="print-toolbar"><button onclick="window.print()">Print receipt</button></div><main class="thermal-paper">${receipt.outerHTML}</main></body></html>`);
  printWindow.addEventListener("load", () => printWindow.print(), { once: true });
  printWindow.document.close();
  printWindow.focus();
}

function bindFilter(id, key, redraw, event = "change") {
  document.getElementById(id)?.addEventListener(event, e => {
    state[key] = e.target.value; redraw();
    if (event === "input") {
      const input = document.getElementById(id); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    }
  });
}

export function showFees(options = {}) {
  if (!requirePermission("receive_fee")) return;
  if (options.pendingOnly) state.status = "Pending";
  setPageTitle("Pending Fees");
  const draw = () => {
    const q = state.search.trim().toLowerCase();
    const rowsData = feeRowsForMonth(state.month).filter(row =>
      (!q || row.student.name.toLowerCase().includes(q) || row.student.id.toLowerCase().includes(q))
      && (!state.className || classOf(row.enrollment) === state.className)
      && (!state.subjectName || row.enrollment.subjectName === state.subjectName)
      && (!state.status || row.status === state.status));
    const rows = rowsData.map(row => `<tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
      <td class="${TD}" data-label="Student ID">${esc(row.student.id)}</td><td class="${TD} font-medium" data-label="Student / guardian contact">${esc(row.student.name)}<div class="text-xs text-gray-500">${esc(row.student.father || "—")} · ${esc(row.student.phone || "—")}</div></td>
      <td class="${TD}" data-label="Billing month">${esc(row.month)}</td><td class="${TD}" data-label="Subject fee">${money(row.grossFee)}</td><td class="${TD}" data-label="Concession">${money(row.concession)}</td><td class="${TD}" data-label="Net fee due">${money(row.due)}</td><td class="${TD}" data-label="Amount paid">${money(row.paid)}</td><td class="${TD} font-semibold" data-label="Pending amount">${money(row.pending)}</td>
      <td class="${TD}" data-label="Last payment">${esc(row.lastPaymentDate || "—")}</td>
      <td class="${TD} whitespace-nowrap" data-label="Actions">
      <button onclick="receiveFee('${esc(row.student.id)}','${esc(row.enrollment.id)}','${esc(row.month)}')" ${row.pending <= 0 ? "disabled" : ""} class="text-green-600">Receive</button></td></tr>`).join("");
    const allRows = feeRowsForMonth(state.month);
    const totalDue = allRows.reduce((sum, row) => sum + row.due, 0);
    const totalPaid = allRows.reduce((sum, row) => sum + row.paid, 0);
    const totalPending = Math.max(0, totalDue - totalPaid);
    const studentsWithPending = new Set(allRows.filter(row => row.pending > 0).map(row => row.student.id)).size;
    const classOptions = [...new Set(courses.map(c => c.programName || c.className).filter(Boolean))].map(v => `<option ${state.className === v ? "selected" : ""}>${esc(v)}</option>`).join("");
    const subjectOptions = [...new Set(courses.map(c => c.subjectName).filter(Boolean))].map(v => `<option ${state.subjectName === v ? "selected" : ""}>${esc(v)}</option>`).join("");
    document.getElementById("content").innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"><div class="text-xs uppercase text-gray-500">Total Fees Due · ${esc(state.month)}</div><strong class="text-xl">${money(totalDue)}</strong></div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"><div class="text-xs uppercase text-gray-500">Collected Fees</div><strong class="text-xl">${money(totalPaid)}</strong></div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"><div class="text-xs uppercase text-gray-500">Pending Fees</div><strong class="text-xl">${money(totalPending)}</strong></div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"><div class="text-xs uppercase text-gray-500">Students with Pending Fees</div><strong class="text-xl">${studentsWithPending}</strong></div></div>` +
      tableCard({ id: "pendingFeeTable", title: `Pending Fees · ${esc(state.month)} · Due ${money(totalDue)} · Collected ${money(totalPaid)} · Pending ${money(totalPending)}`,
        tools: `<input id="feeSearch" placeholder="Search student or ID" value="${esc(state.search)}" class="${sel} w-full sm:w-48">
          <select id="feeClass" class="${sel}"><option value="">All classes</option>${classOptions}</select>
          <select id="feeSubject" class="${sel}"><option value="">All subjects</option>${subjectOptions}</select>
          <input id="feeMonth" type="month" max="${currentBillingMonth()}" value="${esc(state.month)}" class="${sel}">
          <select id="feeStatus" class="${sel}"><option value="">All statuses</option>${["Pending", "Partial", "Paid"].map(v => `<option ${state.status === v ? "selected" : ""}>${v}</option>`).join("")}</select>
          <button id="feeCsv" class="${BTN2}"><i class="fas fa-file-csv mr-1"></i>Export CSV</button>`,
        headers: ["Student ID", "Student / guardian contact", "Billing month", "Subject fee", "Concession", "Net fee due", "Amount paid", "Pending amount", "Last payment", "Actions"],
        rows: rows || emptyRow(10, "No fee records match these filters.") });
    bindFilter("feeSearch", "search", draw, "input");
    bindFilter("feeClass", "className", draw);
    bindFilter("feeSubject", "subjectName", draw);
    bindFilter("feeMonth", "month", draw);
    bindFilter("feeStatus", "status", draw);
    document.getElementById("feeCsv").onclick = () => downloadCSV("pending-fees.csv", [["Student ID", "Student", "Guardian", "Phone", "Class", "Subject", "Billing month", "Subject fee", "Concession", "Net fee due", "Amount paid", "Pending", "Status", "Last payment"],
      ...rowsData.map(r => [r.student.id, r.student.name, r.student.father, r.student.phone, classOf(r.enrollment), r.enrollment.subjectName || "", r.month, r.grossFee, r.concession, r.due, r.paid, r.pending, r.status, r.lastPaymentDate])]);
  };
  draw();
}
export const showPendingFees = options => showFees(options);

export function viewFeeDetails(studentId, enrollmentId) {
  if (!requirePermission("view_payments")) return;
  const student = students.find(s => s.id === studentId), enrollment = studentEnrollments(student).find(e => e.id === enrollmentId);
  if (!student || !enrollment) return showToast("Fee enrollment not found.", "error");
  const periods = billingPeriodsForEnrollment(enrollment);
  const periodRows = periods.map(period => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(period.month)}</td><td class="${TD}">${money(period.due)}</td><td class="${TD}">${money(period.paid)}</td><td class="${TD}">${money(period.balance)}</td><td class="${TD}">${badge(period.status)}</td></tr>`).join("");
  const history = payments.filter(p => p.enrollmentId === enrollment.id).slice().sort((a, b) => b.date.localeCompare(a.date));
  const fee = enrollmentFeeBreakdown(enrollment);
  showModal("Student fee details", `<div class="space-y-3 text-sm">
    <div><strong>${esc(student.name)}</strong> (${esc(student.id)}) · ${esc(classOf(enrollment))} · ${esc(enrollment.subjectName || "Complete class")}<br>
      Guardian ${esc(student.father || "—")} · ${esc(student.phone || "—")}<br>Teacher ${esc(teacherNames(courses.find(c => c.id === enrollment.courseId)) || "Unassigned")}</div>
    <div class="grid grid-cols-2 gap-2"><p>Student total monthly fee: <strong>${money(student.grossMonthlyFee ?? student.monthlyFee)}</strong></p>
      <p>Student concession (${esc(student.concessionType || "Fixed")}): <strong>${money(student.concessionAmount || 0)}</strong></p>
      <p>Student net monthly fee: <strong>${money(student.netMonthlyFee ?? student.monthlyFee)}</strong></p>
      <p>This subject fee / concession: <strong>${money(fee.gross)} / ${money(fee.concession)}</strong></p>
      <p>Subject net monthly fee: <strong>${money(fee.net)}</strong></p><p>Total paid (all periods): <strong>${money(history.reduce((sum, p) => sum + Number(p.amount || 0), 0))}</strong></p>
      <p>Current period pending: <strong>${money(enrollmentBalance(enrollment))}</strong></p></div>
    ${tableCard({ title: "Billing periods", headers: ["Month", "Due", "Paid", "Pending", "Status"], rows: periodRows || emptyRow(5) })}
    ${tableCard({ title: "Payment history", headers: ["Receipt", "Billing month", "Paid on", "Amount", "Method", "Reference", "Action"], rows: history.map(p => `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(p.receiptNumber || p.id)}</td><td class="${TD}">${esc(p.billingMonth || "")}</td><td class="${TD}">${esc(p.date)}</td><td class="${TD}">${money(p.amount)}</td><td class="${TD}">${esc(p.method)}</td><td class="${TD}">${esc(p.reference || "")}</td><td class="${TD} whitespace-nowrap"><button onclick="printReceipt('${esc(p.id)}')" class="text-blue-600 text-xs mr-2">Reprint original</button><button onclick="generateDemoReceipt('${esc(p.studentId)}')" class="text-amber-600 text-xs">Demo receipt</button></td></tr>`).join("") || emptyRow(7) })}
  </div><div class="flex justify-end gap-2 mt-4"><button onclick="generateDemoReceipt('${esc(studentId)}')" class="${BTN2}">Generate Demo Receipt</button><button onclick="receiveFee('${esc(studentId)}','${esc(enrollmentId)}','${currentBillingMonth()}')" class="${BTN}">Receive payment</button><button onclick="closeModal()" class="${BTN2}">Close</button></div>`, { width: "max-w-4xl" });
}

export function receiveFee(studentId, enrollmentId, billingMonth = currentBillingMonth()) {
  if (!requirePermission("receive_fee")) return;
  const student = students.find(s => s.id === studentId), enrollment = studentEnrollments(student).find(e => e.id === enrollmentId);
  if (!student || !enrollment) return showToast("Student enrollment not found.", "error");
  const due = enrollmentDue(enrollment, billingMonth), balance = enrollmentBalance(enrollment, billingMonth);
  if (balance <= 0) return showToast("No pending fee remains for this billing period.", "info");
  const suggestedReference = nextId("PAY", payments);
  showModal("Receive payment", `<form id="periodFeeForm" class="space-y-3">
    <div class="text-sm"><strong>${esc(student.name)}</strong> · ${esc(enrollmentLabel(enrollment))} · ${esc(billingMonth)}
      <p>Fee ${money(due)} · Paid ${money(enrollmentPaid(enrollment.id, billingMonth))} · Pending ${money(balance)}</p></div>
    ${field("Amount received *", "amount", balance, `type="number" min="0.01" max="${balance}" step="0.01" required`)}
    ${field("Payment date *", "date", today(), `type="date" max="${today()}" required`)}
    ${selectField("Payment method *", "method", ["Cash", "Bank", "JazzCash", "Easypaisa"])}
    ${field("Receipt / reference number *", "reference", suggestedReference, "required")}
    <p id="periodFeeError" class="text-sm text-red-600 hidden"></p>${formButtons("Save Payment & Generate Original Receipt")}</form>
    <div class="flex justify-start mt-2 no-print"><button type="button" onclick="generateDemoReceipt('${esc(studentId)}')" class="${BTN2}">Generate Demo Receipt</button></div>`, { width: "max-w-xl" });
  const form = document.getElementById("periodFeeForm");
  form.onsubmit = e => {
    e.preventDefault();
    if (!requirePermission("receive_fee")) return;
    const amount = Number(form.elements.amount.value), date = form.elements.date.value;
    const reference = form.elements.reference.value.trim(), errBox = document.getElementById("periodFeeError");
    const currentBalance = enrollmentBalance(enrollment, billingMonth);
    const error = !Number.isFinite(amount) || amount <= 0 || amount !== roundFee(amount) ? "Enter an amount greater than zero with no more than two decimal places."
      : amount > currentBalance ? `Payment cannot exceed the pending amount (${money(currentBalance)}).`
      : !date || date > today() ? "Enter a valid payment date."
      : !reference ? "Enter a receipt/reference number."
      : !["Cash", "Bank", "JazzCash", "Easypaisa"].includes(form.elements.method.value) ? "Select a valid payment method."
      : payments.some(p => p.reference?.toLowerCase() === reference.toLowerCase()) ? "That receipt/reference number is already in use." : "";
    if (error) { errBox.textContent = error; errBox.classList.remove("hidden"); return; }
    form.querySelector('[type="submit"]').disabled = true;
    const id = nextId("PAY", payments);
    const payment = { id, receiptNumber: nextReceiptNumber(), receiptType: "Original", studentId, enrollmentId, courseId: enrollment.courseId, courseName: enrollment.courseName,
      billingMonth, amount: roundFee(amount), method: form.elements.method.value, date, reference, receivedBy: getCurrentUser().name,
      feeSnapshot: feeSnapshot(student, billingMonth),
      studentSnapshot: {
        name: student.name, father: student.father, academicLevel: student.academicLevel,
        className: student.className, programName: student.programName, semester: student.semester
      },
      enrollmentBalanceAfter: roundFee(currentBalance - amount) };
    payments.push(payment);
    payment.balanceAfter = roundFee(balanceOf(student, billingMonth));
    commit(); closeModal(); showFees(); showToast(`Payment saved. Pending ${money(payment.enrollmentBalanceAfter)}.`); printReceipt(payment.id);
  };
}

export function showPayments() {
  if (!requirePermission("view_payments")) return;
  setPageTitle("Payment History");
  const filteredPayments = () => {
    const q = payState.search.toLowerCase();
    return payments.filter(p => {
      const student = students.find(s => s.id === p.studentId);
      return (!q || p.id.toLowerCase().includes(q) || (p.receiptNumber || "").toLowerCase().includes(q) || p.studentId.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q) || (student?.name || "").toLowerCase().includes(q))
        && (!payState.from || p.date >= payState.from) && (!payState.to || p.date <= payState.to);
    }).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  };
  const rowsFor = list => list.map(p => {
    const enrollment = studentEnrollments(students.find(s => s.id === p.studentId)).find(e => e.id === p.enrollmentId);
    return `<tr class="border-b dark:border-gray-700"><td class="${TD}">${esc(p.receiptNumber || p.id)}</td><td class="${TD}">${esc(p.billingMonth || "")}</td><td class="${TD}">${esc(p.date)}</td>
      <td class="${TD}">${esc(students.find(s => s.id === p.studentId)?.name || `Removed student (${p.studentId})`)}</td><td class="${TD}">${esc(enrollment ? enrollmentLabel(enrollment) : p.courseName || "—")}</td>
      <td class="${TD} font-semibold">${money(p.amount)}</td><td class="${TD}">${esc(p.method)}</td><td class="${TD}">${esc(p.reference || "")}</td>
      <td class="${TD} text-right whitespace-nowrap"><button onclick="printReceipt('${esc(p.id)}')" class="text-blue-600 text-xs mr-2"><i class="fas fa-print"></i> Reprint original</button>
      <button onclick="generateDemoReceipt('${esc(p.studentId)}')" class="text-amber-600 text-xs"><i class="fas fa-file-alt"></i> Demo receipt</button></td></tr>`;
  }).join("");
  const renderFiltered = () => {
    const list = filteredPayments();
    document.querySelector("#content tbody").innerHTML = rowsFor(list) || emptyRow(9, "No payments found.");
    document.getElementById("paymentHistoryCount").textContent = `${list.length} payments · ${money(list.reduce((sum, p) => sum + Number(p.amount), 0))}`;
  };
  const list = filteredPayments();
  document.getElementById("content").innerHTML = tableCard({ title: `<span id="paymentHistoryCount">${list.length} payments · ${money(list.reduce((sum, p) => sum + Number(p.amount), 0))}</span>`,
    tools: `<input id="payList_Search" placeholder="Search student, receipt #, or reference" value="${esc(payState.search)}" class="${sel} w-full sm:w-56"><input id="payFrom" type="date" value="${payState.from}" title="From" class="${sel}"><input id="payTo" type="date" value="${payState.to}" title="To" class="${sel}">
      <button id="payCsv" class="${BTN2}">CSV</button>`,
    headers: ["Receipt #", "Billing month", "Date", "Student", "Enrollment", "Amount", "Method", "Reference", ""],
    rows: rowsFor(list) || emptyRow(9, "No payments found.") });
  document.getElementById("payList_Search").oninput = e => { payState.search = e.target.value; renderFiltered(); };
  for (const [id, key] of [["payFrom", "from"], ["payTo", "to"]]) {
    document.getElementById(id).onchange = e => { payState[key] = e.target.value; renderFiltered(); };
  }
  document.getElementById("payCsv").onclick = () => downloadCSV("payments.csv", [["Receipt", "Billing month", "Date", "Student ID", "Student", "Enrollment", "Amount", "Method", "Reference", "Received by"],
    ...filteredPayments().map(p => [p.receiptNumber || p.id, p.billingMonth, p.date, p.studentId, students.find(s => s.id === p.studentId)?.name || "", p.courseName, p.amount, p.method, p.reference, p.receivedBy])]);
}

export function printReceipt(paymentId) {
  if (!requirePermission("print_receipt")) return;
  const payment = payments.find(p => p.id === paymentId);
  if (!payment) return showToast("Payment not found.", "error");
  const storedStudent = students.find(s => s.id === payment.studentId);
  if (!storedStudent) return showToast("Student record for this payment was not found.", "error");
  const student = { ...storedStudent, ...(payment.studentSnapshot || {}) };
  const enrollment = studentEnrollments(storedStudent).find(e => e.id === payment.enrollmentId);
  const snapshot = payment.feeSnapshot || feeSnapshot(storedStudent, payment.billingMonth);
  const balance = payment.balanceAfter ?? balanceOf(storedStudent, payment.billingMonth);
  const enrollmentBalanceAfter = payment.enrollmentBalanceAfter ?? (enrollment ? enrollmentBalance(enrollment, payment.billingMonth) : balance);
  showModal("Original fee receipt", `${receiptContent({ type: "Original", student, payment, snapshot, balance, enrollmentBalanceAfter })}
    <div class="flex justify-end gap-2 mt-4 no-print"><button onclick="printThermalReceipt()" class="${BTN}"><i class="fas fa-print mr-1"></i>Print thermal receipt (80mm)</button><button onclick="closeModal()" class="${BTN2}">Close</button></div>`, { width: "max-w-3xl" });
}

export function generateDemoReceipt(studentId) {
  if (!requirePermission("print_receipt")) return;
  const student = students.find(item => item.id === studentId);
  if (!student) return showToast("Student not found.", "error");
  const snapshot = feeSnapshot(student, currentBillingMonth());
  showModal("Demo fee receipt", `${receiptContent({ type: "Demo", student, snapshot })}
    <div class="flex justify-end gap-2 mt-4 no-print"><button onclick="printThermalReceipt()" class="${BTN}"><i class="fas fa-print mr-1"></i>Print thermal receipt (80mm)</button><button onclick="closeModal()" class="${BTN2}">Close</button></div>`, { width: "max-w-3xl" });
}

Object.assign(window, { showFees, showPendingFees, viewFeeDetails, receiveFee, printReceipt, generateDemoReceipt, printThermalReceipt });
