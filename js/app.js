// ============================================
// app.js — Main controller (login, menus, navigation)
// ============================================
import { loadAll } from "./data.js";
import { login, logout, getCurrentUser, isLoggedIn, hasPermission } from "./auth.js";
import { showDashboard } from "./dashboard.js";
import { showStudents } from "./students.js";
import { showTeachers } from "./teachers.js";
import { showCourses, showSchedule } from "./courses.js";
import { showAttendance } from "./attendance.js";
import { showPendingFees, showPayments } from "./fees.js";
import { showSalaries } from "./salaries.js";
import { showReports } from "./reports.js";
import { showSettings } from "./settings.js";
import { showToast, closeModal, toggleSidebar, closeSidebar, toggleDarkMode, applyStoredTheme, esc } from "./ui.js";

// perm = permission needed to open the page (checked again inside each page function)
const MENUS = {
  admin: [
    { key: "dashboard", label: "Dashboard", icon: "fa-chart-pie", action: showDashboard },
    { key: "students", label: "Students", icon: "fa-user-graduate", action: showStudents, perm: "view_students" },
    { key: "teachers", label: "Teachers", icon: "fa-chalkboard-teacher", action: showTeachers, perm: "manage_teachers" },
    { key: "courses", label: "Subjects", icon: "fa-book", action: showCourses, perm: "view_courses" },
    { key: "attendance", label: "Attendance", icon: "fa-calendar-check", action: showAttendance, perm: "mark_attendance" },
    { key: "pending-fees", label: "Pending Fees", icon: "fa-money-bill-wave", action: showPendingFees, perm: "receive_fee" },
    { key: "payments", label: "Payments", icon: "fa-receipt", action: showPayments, perm: "view_payments" },
    { key: "salaries", label: "Salaries", icon: "fa-wallet", action: showSalaries, perm: "manage_salaries" },
    { key: "reports", label: "Reports", icon: "fa-chart-bar", action: showReports, perm: "view_reports" },
    { key: "settings", label: "Settings", icon: "fa-cog", action: showSettings, perm: "manage_settings" }
  ],
  teacher: [
    { key: "dashboard", label: "Dashboard", icon: "fa-chart-pie", action: showDashboard },
    { key: "courses", label: "My Subjects", icon: "fa-book", action: showCourses, perm: "view_courses" },
    { key: "students", label: "My Students", icon: "fa-user-graduate", action: showStudents, perm: "view_students" },
    { key: "attendance", label: "Attendance", icon: "fa-calendar-check", action: showAttendance, perm: "mark_attendance" },
    { key: "salaries", label: "My Salary", icon: "fa-wallet", action: showSalaries, perm: "view_own_salary" },
    { key: "schedule", label: "Schedule", icon: "fa-clock", action: showSchedule, perm: "view_schedule" }
  ],
  receptionist: [
    { key: "dashboard", label: "Dashboard", icon: "fa-chart-pie", action: showDashboard },
    { key: "students", label: "Students", icon: "fa-user-graduate", action: showStudents, perm: "view_students" },
    { key: "pending-fees", label: "Pending Fees", icon: "fa-money-bill-wave", action: showPendingFees, perm: "receive_fee" },
    { key: "payments", label: "Payments & Receipts", icon: "fa-receipt", action: showPayments, perm: "view_payments" }
  ]
};

function renderSidebar(role) {
  const nav = document.getElementById("sidebarNav");
  const items = (MENUS[role] || []).filter(i => !i.perm || hasPermission(i.perm));
  nav.innerHTML = items.map((item, i) => `<button data-index="${i}" data-nav="${item.key}" class="navItem w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
      <i class="fas ${item.icon} w-5 text-center text-blue-600 dark:text-blue-400"></i><span>${esc(item.label)}</span></button>`).join("");
  nav.querySelectorAll(".navItem").forEach(btn => btn.addEventListener("click", () => {
    nav.querySelectorAll(".navItem").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    closeModal(); closeSidebar();
    items[btn.dataset.index].action();
  }));
  nav.querySelector(".navItem")?.click(); // open the first page
}

function enterApp(user) {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("userBadge").textContent = `${user.name} (${user.role})`;
  renderSidebar(user.role);
}
function showLogin() {
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
  document.getElementById("content").innerHTML = "";
  closeModal(); closeSidebar();
}

async function init() {
  applyStoredTheme();
  try {
    await loadAll();
  } catch (error) {
    console.error("Unable to load saved demo data:", error);
    showToast("Unable to load saved demo data from this browser.", "error");
  }

  document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const user = login(document.getElementById("username").value, document.getElementById("password").value);
    if (user) { showToast(`Welcome, ${user.name}`); enterApp(user); } else showToast("Invalid credentials", "error");
  });
  document.getElementById("logoutBtn").addEventListener("click", () => { logout(); showLogin(); showToast("Logged out", "info"); });
  document.getElementById("menuToggle").addEventListener("click", toggleSidebar);
  document.getElementById("sidebarOverlay").addEventListener("click", closeSidebar);
  document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode);

  if (isLoggedIn()) enterApp(getCurrentUser()); else showLogin();
}
init();
