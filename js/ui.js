// ============================================
// ui.js — Shared UI helpers (modal, toast, escaping, CSV, table layout)
// ============================================
import { saveData, getData } from "./storage.js";

// Escape user text before putting it in HTML (prevents HTML injection)
export const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const money = n => "Rs " + Number(n || 0).toLocaleString();
// Local date (toISOString() is UTC and can be "yesterday" in Pakistan)
export function today() { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

// Shared class strings, so every module looks the same
export const CARD = "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700";
export const BTN = "bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition";
export const BTN2 = "px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition";
export const TD = "py-2 px-3 text-sm";
const TONES = { green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" };
const STATUS_TONE = { Paid: "green", Partial: "yellow", Pending: "red", Present: "green", Absent: "red", Late: "yellow", Leave: "yellow" };
export const badge = t => `<span class="px-2 py-0.5 rounded-full text-xs ${TONES[STATUS_TONE[t] || "yellow"]}">${esc(t)}</span>`;
export const emptyRow = (cols, msg = "No records found.") => `<tr><td colspan="${cols}" class="p-6 text-center text-gray-400">${esc(msg)}</td></tr>`;

// Card with toolbar + scrollable table. headers: array of strings; rows: HTML string
export function tableCard({ title = "", tools = "", headers, rows, id = "" }) {
  return `<div ${id ? `id="${id}"` : ""} class="${CARD} overflow-hidden">
    <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700">
      <h3 class="font-semibold text-gray-800 dark:text-white">${title}</h3><div class="flex flex-wrap gap-2 no-print">${tools}</div></div>
    <div class="overflow-x-auto"><table class="min-w-full">
      <thead class="bg-gray-50 dark:bg-gray-900/50 text-left text-xs text-gray-500 uppercase"><tr>${headers.map(h => `<th class="py-3 px-3 whitespace-nowrap">${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
}

// Labelled form field
export const field = (label, name, value = "", attrs = "") => `<label class="block text-xs font-medium text-gray-600 dark:text-gray-300">${label}<input name="${name}" value="${esc(value)}" ${attrs} class="input mt-1"></label>`;
export const selectField = (label, name, options, selected = "") => `<label class="block text-xs font-medium text-gray-600 dark:text-gray-300">${label}<select name="${name}" class="input mt-1">${options.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(t)}</option>`; }).join("")}</select></label>`;
export const formButtons = label => `<div class="flex justify-end gap-2 pt-2"><button type="button" onclick="closeModal()" class="${BTN2}">Cancel</button><button type="submit" class="${BTN}">${label}</button></div>`;

// ---------- Modal ----------
export function showModal(title, htmlContent, options = {}) {
  document.getElementById("modalContainer").innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 modal-fade" id="modalOverlay">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${options.width || "max-w-lg"} max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 class="text-lg font-semibold">${esc(title)}</h3>
          <button onclick="closeModal()" aria-label="Close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">&times;</button>
        </div>
        <div class="p-5">${htmlContent}</div>
      </div>
    </div>`;
  document.body.style.overflow = "hidden";
  document.getElementById("modalOverlay").addEventListener("mousedown", e => { if (e.target.id === "modalOverlay") closeModal(); });
}
export function closeModal() {
  document.getElementById("modalContainer").innerHTML = "";
  document.body.style.overflow = "";
}
window.closeModal = closeModal;
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ---------- Toast ----------
export function showToast(message, type = "success") {
  const colors = { success: "bg-green-600", error: "bg-red-600", info: "bg-blue-600", warning: "bg-yellow-600" };
  const icons = { success: "fa-check-circle", error: "fa-times-circle", info: "fa-info-circle", warning: "fa-exclamation-triangle" };
  const el = document.createElement("div");
  el.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 toast-slide`;
  el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span class="flex-1 text-sm"></span>`;
  el.querySelector("span").textContent = message; // textContent: never parsed as HTML
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---------- Confirm ----------
export function showConfirm(message, onConfirm) {
  document.getElementById("modalContainer").innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 modal-fade">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-5">
        <p class="text-gray-800 dark:text-gray-200 mb-5">${esc(message)}</p>
        <div class="flex justify-end space-x-2">
          <button id="confirmNo" class="${BTN2}">Cancel</button>
          <button id="confirmYes" class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Confirm</button>
        </div>
      </div>
    </div>`;
  document.getElementById("confirmNo").onclick = closeModal;
  document.getElementById("confirmYes").onclick = () => { closeModal(); onConfirm && onConfirm(); };
}

// ---------- CSV (quotes/commas/newlines escaped; formula-injection guarded) ----------
export function downloadCSV(filename, rows) {
  const cell = v => {
    let t = String(v ?? "");
    if (typeof v === "string" && /^[=+\-@]/.test(t)) t = "'" + t;
    return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = "\uFEFF" + rows.map(r => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`${filename} exported`);
}

// ---------- Sidebar ----------
export function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
  document.getElementById("sidebarOverlay").classList.toggle("hidden");
}
export function closeSidebar() {
  document.getElementById("sidebar").classList.add("-translate-x-full");
  document.getElementById("sidebarOverlay").classList.add("hidden");
}

// ---------- Dark mode ----------
export function toggleDarkMode() {
  const html = document.documentElement;
  html.classList.toggle("dark");
  saveData("theme", html.classList.contains("dark") ? "dark" : "light");
}
export function applyStoredTheme() {
  if (getData("theme", "light") === "dark") document.documentElement.classList.add("dark");
}
export function setPageTitle(title) { document.getElementById("pageTitle").textContent = title; }
