// ============================================
// settings.js — Admin: JSON backup / restore / demo-data reset
// ============================================
import { exportBackup, importBackup, resetDemoData } from "./data.js";
import { CARD, BTN, BTN2, setPageTitle, showToast, showConfirm, today } from "./ui.js";
import { requirePermission } from "./auth.js";

export function showSettings() {
  if (!requirePermission("manage_settings")) return;
  setPageTitle("Settings");
  document.getElementById("content").innerHTML = `<div class="grid gap-4 max-w-2xl">
    <div class="${CARD} p-5"><h3 class="font-semibold mb-1">Backup</h3><p class="text-sm text-gray-500 mb-3">Download all academy data as a JSON file.</p><button id="setBackup" class="${BTN}"><i class="fas fa-download mr-1"></i>Download backup</button></div>
    <div class="${CARD} p-5"><h3 class="font-semibold mb-1">Restore</h3><p class="text-sm text-gray-500 mb-3">Replace current data with a backup file. This overwrites everything.</p><input id="setFile" type="file" accept=".json,application/json" class="text-sm"></div>
    <div class="${CARD} p-5 border-red-200"><h3 class="font-semibold mb-1 text-red-600">Reset demo data</h3><p class="text-sm text-gray-500 mb-3">Erases all changes and restores the original demo records.</p><button id="setReset" class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Reset to demo data</button></div>
    <p class="text-xs text-gray-400">Demo app: data and permissions live in your browser's localStorage and are not secure.</p></div>`;
  document.getElementById("setBackup").onclick = () => {
    if (!requirePermission("manage_settings")) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" })); a.download = `academiahub-backup-${today()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); showToast("Backup downloaded");
  };
  document.getElementById("setFile").onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    showConfirm("Restore this backup and overwrite all current data?", async () => {
      if (!requirePermission("manage_settings")) return;
      try { importBackup(await file.text()); showToast("Backup restored"); showSettings(); }
      catch (err) { showToast("Restore failed: " + err.message, "error"); }
    });
  };
  document.getElementById("setReset").onclick = () => showConfirm("Reset ALL data to the original demo records? This cannot be undone.", async () => {
    if (!requirePermission("manage_settings")) return;
    resetDemoData();
    showToast("Demo data restored", "info");
    showSettings();
  });
}
