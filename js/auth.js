// ============================================
// auth.js — Login / Logout / Roles & Permissions
// NOTE: demo only. Credentials live in this file and the session in
// localStorage, so anyone can bypass this from the browser console.
// Real security needs a backend that checks every request.
// ============================================
import { saveData, getData, removeData } from "./storage.js";
import { showToast } from "./ui.js";

const USERS = {
  admin:     { username: "admin",     password: "admin123",     role: "admin",        name: "Admin User" },
  teacher:   { username: "teacher",   password: "teacher123",   role: "teacher",      name: "Dr. Sohail Ahmad", teacherId: "TCH-001" },
  reception: { username: "reception", password: "reception123", role: "receptionist", name: "Reception Desk" }
};

const PERMISSIONS = {
  admin: ["all"],
  teacher: ["view_courses", "view_students", "mark_attendance", "view_own_salary", "view_schedule"],
  receptionist: ["add_student", "view_students", "receive_fee", "view_payments", "print_receipt"]
};

const publicUser = u => { const { password, ...rest } = u; return rest; };

export function login(username, password) {
  const user = USERS[String(username).trim().toLowerCase()];
  if (!user || user.password !== password) return null;
  saveData("session", { username: user.username }); // never store the password
  return publicUser(user);
}
export function logout() { removeData("session"); removeData("currentUser"); }

// Re-derived from USERS each time, so editing the role in localStorage has no effect
export function getCurrentUser() {
  const s = getData("session", null);
  const u = s && USERS[s.username];
  return u ? publicUser(u) : null;
}
export const isLoggedIn = () => !!getCurrentUser();

export function hasPermission(permission) {
  const user = getCurrentUser();
  if (!user) return false;
  const perms = PERMISSIONS[user.role] || [];
  return perms.includes("all") || perms.includes(permission);
}

// Call at the top of every restricted action. Shows an error toast when denied.
export function requirePermission(permission, notify = true) {
  if (hasPermission(permission)) return true;
  if (notify) showToast("You don't have permission to do that.", "error");
  return false;
}
export const getRolePermissions = role => PERMISSIONS[role] || [];
