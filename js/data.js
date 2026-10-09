// ============================================
// data.js — Demo data for the entire application
// ============================================

import { saveData, getData } from "./storage.js";
export const currentBillingMonth = () => todayISO().slice(0, 7);

// ---------- Students (20 records) ----------
export let students = [
  { id: "STU-001", name: "Ahmed Khan", father: "Imran Khan", phone: "0301-1234567", email: "ahmed@example.com", address: "Lahore", course: "9th Class", admissionDate: "2024-01-10", monthlyFee: 12000, feeStatus: "Paid", attendance: 92 },
  { id: "STU-002", name: "Fatima Ali", father: "Ali Raza", phone: "0302-2345678", email: "fatima@example.com", address: "Karachi", course: "9th Class Mathematics", admissionDate: "2024-01-12", monthlyFee: 3500, feeStatus: "Partial", attendance: 85 },
  { id: "STU-003", name: "Bilal Ahmed", father: "Nadeem Ahmed", phone: "0303-3456789", email: "bilal@example.com", address: "Islamabad", course: "9th Class Physics", admissionDate: "2024-01-15", monthlyFee: 3500, feeStatus: "Pending", attendance: 78 },
  { id: "STU-004", name: "Ayesha Malik", father: "Tariq Malik", phone: "0304-4567890", email: "ayesha@example.com", address: "Lahore", course: "10th Class", admissionDate: "2024-01-18", monthlyFee: 13000, feeStatus: "Pending", attendance: 95 },
  { id: "STU-005", name: "Usman Tariq", father: "Tariq Mehmood", phone: "0305-5678901", email: "usman@example.com", address: "Faisalabad", course: "10th Class Chemistry", admissionDate: "2024-01-20", monthlyFee: 3800, feeStatus: "Pending", attendance: 70 },
  { id: "STU-006", name: "Hira Shahid", father: "Shahid Hussain", phone: "0306-6789012", email: "hira@example.com", address: "Multan", course: "10th Class Biology", admissionDate: "2024-01-22", monthlyFee: 3800, feeStatus: "Pending", attendance: 88 },
  { id: "STU-007", name: "Zain Abbas", father: "Abbas Ali", phone: "0307-7890123", email: "zain@example.com", address: "Rawalpindi", course: "11th Class", admissionDate: "2024-01-25", monthlyFee: 14000, feeStatus: "Pending", attendance: 65 },
  { id: "STU-008", name: "Maryam Noor", father: "Noor Muhammad", phone: "0308-8901234", email: "maryam@example.com", address: "Peshawar", course: "11th Class English", admissionDate: "2024-01-28", monthlyFee: 3200, feeStatus: "Pending", attendance: 90 },
  { id: "STU-009", name: "Hamza Sheikh", father: "Sheikh Rashid", phone: "0309-9012345", email: "hamza@example.com", address: "Quetta", course: "BS Computer Science — Semester 3 — Database Systems", admissionDate: "2024-02-01", monthlyFee: 9000, feeStatus: "Pending", attendance: 82 },
  { id: "STU-010", name: "Sana Javed", father: "Javed Iqbal", phone: "0310-0123456", email: "sana@example.com", address: "Lahore", course: "9th Class Mathematics", admissionDate: "2024-02-03", monthlyFee: 3500, feeStatus: "Pending", attendance: 75 },
  { id: "STU-011", name: "Ali Haider", father: "Haider Ali", phone: "0311-1234567", email: "ali@example.com", address: "Karachi", course: "10th Class Biology", admissionDate: "2024-02-05", monthlyFee: 3800, feeStatus: "Pending", attendance: 89 },
  { id: "STU-012", name: "Noor Fatima", father: "Muhammad Asif", phone: "0312-2345678", email: "noor@example.com", address: "Islamabad", course: "10th Class Chemistry", admissionDate: "2024-02-08", monthlyFee: 3800, feeStatus: "Pending", attendance: 93 },
  { id: "STU-013", name: "Saad Rafiq", father: "Rafiq Ahmad", phone: "0313-3456789", email: "saad@example.com", address: "Lahore", course: "9th Class", admissionDate: "2024-02-10", monthlyFee: 12000, feeStatus: "Pending", attendance: 68 },
  { id: "STU-014", name: "Iqra Aslam", father: "Aslam Pervaiz", phone: "0314-4567890", email: "iqra@example.com", address: "Faisalabad", course: "9th Class Physics", admissionDate: "2024-02-12", monthlyFee: 3500, feeStatus: "Pending", attendance: 87 },
  { id: "STU-015", name: "Umar Farooq", father: "Farooq Ahmad", phone: "0315-5678901", email: "umar@example.com", address: "Multan", course: "BS Computer Science — Semester 3 — Database Systems", admissionDate: "2024-02-15", monthlyFee: 9000, feeStatus: "Pending", attendance: 91 },
  { id: "STU-016", name: "Amna Siddiqui", father: "Siddiq Ahmad", phone: "0316-6789012", email: "amna@example.com", address: "Rawalpindi", course: "10th Class", admissionDate: "2024-02-18", monthlyFee: 13000, feeStatus: "Pending", attendance: 72 },
  { id: "STU-017", name: "Talha Yousaf", father: "Yousaf Khan", phone: "0317-7890123", email: "talha@example.com", address: "Peshawar", course: "11th Class", admissionDate: "2024-02-20", monthlyFee: 14000, feeStatus: "Pending", attendance: 84 },
  { id: "STU-018", name: "Khadija Rizvi", father: "Rizvi Hussain", phone: "0318-8901234", email: "khadija@example.com", address: "Quetta", course: "11th Class English", admissionDate: "2024-02-22", monthlyFee: 3200, feeStatus: "Pending", attendance: 96 },
  { id: "STU-019", name: "Rehan Akhtar", father: "Akhtar Ali", phone: "0319-9012345", email: "rehan@example.com", address: "Lahore", course: "9th Class Mathematics", admissionDate: "2024-02-25", monthlyFee: 3500, feeStatus: "Pending", attendance: 63 },
  { id: "STU-020", name: "Laiba Anwar", father: "Anwar Saeed", phone: "0320-0123456", email: "laiba@example.com", address: "Karachi", course: "10th Class Chemistry", admissionDate: "2024-02-28", monthlyFee: 3800, feeStatus: "Pending", attendance: 90 }
];

// ---------- Teachers (5 records) ----------
export let teachers = [
  { id: "TCH-001", name: "Dr. Sohail Ahmad", email: "sohail@academy.com", phone: "0331-1111111", subject: "Mathematics", salary: 120000, joinDate: "2022-03-01", courses: ["9th Class"] },
  { id: "TCH-002", name: "Prof. Ayesha Khan", email: "ayesha.k@academy.com", phone: "0332-2222222", subject: "English", salary: 100000, joinDate: "2022-06-15", courses: ["9th Class Mathematics"] },
  { id: "TCH-003", name: "Mr. Bilal Hussain", email: "bilal.h@academy.com", phone: "0333-3333333", subject: "Physics", salary: 110000, joinDate: "2023-01-10", courses: ["9th Class Physics"] },
  { id: "TCH-004", name: "Ms. Sana Tariq", email: "sana.t@academy.com", phone: "0334-4444444", subject: "Chemistry", salary: 95000, joinDate: "2023-04-20", courses: ["10th Class Chemistry"] },
  { id: "TCH-005", name: "Mr. Kamran Akmal", email: "kamran@academy.com", phone: "0335-5555555", subject: "Computer Science", salary: 115000, joinDate: "2022-09-05", courses: ["11th Class"] }
];

// ---------- Class and subject offerings ----------
export let courses = [
  { id: "CRS-001", name: "9th Class", type: "Class-Based", className: "9th Class", academicLevel: "Matric", teacherId: "TCH-001", teacherIds: ["TCH-001"], duration: "10 months", fee: 12000, schedule: "Mon-Fri 08:00-12:00", startDate: todayISO(), status: "Active", capacity: 30, students: 0 },
  { id: "CRS-002", name: "9th Class Mathematics", type: "Subject-Based", className: "9th Class", subjectName: "Mathematics", academicLevel: "Matric", teacherId: "TCH-002", teacherIds: ["TCH-002"], duration: "10 months", fee: 3500, schedule: "Mon, Wed 09:00-10:00", startDate: todayISO(), status: "Active", capacity: 30, students: 0 },
  { id: "CRS-003", name: "9th Class Physics", type: "Subject-Based", className: "9th Class", subjectName: "Physics", academicLevel: "Matric", teacherId: "TCH-003", teacherIds: ["TCH-003"], duration: "10 months", fee: 3500, schedule: "Tue, Thu 09:00-10:00", startDate: todayISO(), status: "Active", capacity: 30, students: 0 },
  { id: "CRS-004", name: "10th Class", type: "Class-Based", className: "10th Class", academicLevel: "Matric", teacherId: "TCH-001", teacherIds: ["TCH-001", "TCH-004"], duration: "10 months", fee: 13000, schedule: "Mon-Fri 12:00-16:00", startDate: todayISO(), status: "Active", capacity: 30, students: 0 },
  { id: "CRS-005", name: "10th Class Chemistry", type: "Subject-Based", className: "10th Class", subjectName: "Chemistry", academicLevel: "Matric", teacherId: "TCH-004", teacherIds: ["TCH-004"], duration: "10 months", fee: 3800, schedule: "Mon, Wed 13:00-14:00", startDate: todayISO(), status: "Active", capacity: 25, students: 0 },
  { id: "CRS-006", name: "10th Class Biology", type: "Subject-Based", className: "10th Class", subjectName: "Biology", academicLevel: "Matric", teacherId: "TCH-003", teacherIds: ["TCH-003"], duration: "10 months", fee: 3800, schedule: "Tue, Thu 13:00-14:00", startDate: todayISO(), status: "Active", capacity: 25, students: 0 },
  { id: "CRS-007", name: "11th Class", type: "Class-Based", className: "11th Class", academicLevel: "Inter", teacherId: "TCH-005", teacherIds: ["TCH-005"], duration: "10 months", fee: 14000, schedule: "Mon-Fri 08:00-12:00", startDate: todayISO(), status: "Active", capacity: 30, students: 0 },
  { id: "CRS-008", name: "11th Class English", type: "Subject-Based", className: "11th Class", subjectName: "English", academicLevel: "Inter", teacherId: "TCH-002", teacherIds: ["TCH-002"], duration: "10 months", fee: 3200, schedule: "Mon, Wed 10:00-11:00", startDate: todayISO(), status: "Active", capacity: 25, students: 0 },
  { id: "CRS-009", name: "BS Computer Science — Semester 3 — Database Systems", type: "Subject-Based", className: "BS Computer Science", programName: "BS Computer Science", subjectName: "Database Systems", semester: "3", academicLevel: "BS", teacherId: "TCH-003", teacherIds: ["TCH-003"], duration: "4 months", fee: 9000, schedule: "Mon, Wed 16:00-18:00", startDate: todayISO(), status: "Active", capacity: 25, students: 0 }
];

export const courseOptions = {
  classes: [
    { id: "CLS-001", name: "9th Class", academicLevel: "Matric" },
    { id: "CLS-002", name: "10th Class", academicLevel: "Matric" },
    { id: "CLS-003", name: "1st Year", academicLevel: "Inter" },
    { id: "CLS-004", name: "2nd Year", academicLevel: "Inter" }
  ],
  programs: ["BS Computer Science", "BS Software Engineering", "BS Information Technology"]
};
export const academicLevels = ["Matric", "Inter", "BS"];
export const schoolClasses = {
  Matric: ["9th Class", "10th Class"],
  Inter: ["1st Year", "2nd Year"]
};
export const bsSemesters = Array.from({ length: 8 }, (_, index) => ({
  value: String(index + 1),
  label: `BS ${["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"][index]} Semester`
}));
export const classRecords = () => [
  ...courseOptions.classes,
  ...(courseOptions.programs || []).map((name, index) => ({ id: `PRG-${index + 1}`, name, academicLevel: "BS" }))
];
export const classesForLevel = level => (schoolClasses[level] || []).map(name => ({
  id: `CLS-${name}`, name, academicLevel: level
}));
export const classRecord = name => classRecords().find(item => item.name === name)
  || { name, academicLevel: /^(9th|10th)\b/i.test(name || "") ? "Matric" : /^(11th|12th|1st\s+year|2nd\s+year)\b/i.test(name || "") ? "Inter" : /^BS\b/i.test(name || "") ? "BS" : "" };

// ---------- Attendance Records ----------
export let attendance = [
  { id: "ATT-001", studentId: "STU-001", date: "2024-03-01", status: "Present" },
  { id: "ATT-002", studentId: "STU-002", date: "2024-03-01", status: "Absent" },
  { id: "ATT-003", studentId: "STU-003", date: "2024-03-01", status: "Present" },
  { id: "ATT-004", studentId: "STU-004", date: "2024-03-01", status: "Late" },
  { id: "ATT-005", studentId: "STU-005", date: "2024-03-01", status: "Present" },
  { id: "ATT-006", studentId: "STU-006", date: "2024-03-01", status: "Leave" },
  { id: "ATT-007", studentId: "STU-007", date: "2024-03-01", status: "Present" },
  { id: "ATT-008", studentId: "STU-008", date: "2024-03-01", status: "Present" },
  { id: "ATT-009", studentId: "STU-009", date: "2024-03-01", status: "Absent" },
  { id: "ATT-010", studentId: "STU-010", date: "2024-03-01", status: "Present" },
  { id: "ATT-011", studentId: "STU-001", date: "2024-03-02", status: "Present" },
  { id: "ATT-012", studentId: "STU-002", date: "2024-03-02", status: "Present" },
  { id: "ATT-013", studentId: "STU-003", date: "2024-03-02", status: "Absent" },
  { id: "ATT-014", studentId: "STU-004", date: "2024-03-02", status: "Present" },
  { id: "ATT-015", studentId: "STU-005", date: "2024-03-02", status: "Late" },
  { id: "ATT-016", studentId: "STU-006", date: "2024-03-02", status: "Present" },
  { id: "ATT-017", studentId: "STU-007", date: "2024-03-02", status: "Present" },
  { id: "ATT-018", studentId: "STU-008", date: "2024-03-02", status: "Present" },
  { id: "ATT-019", studentId: "STU-009", date: "2024-03-02", status: "Present" },
  { id: "ATT-020", studentId: "STU-010", date: "2024-03-02", status: "Absent" }
];

// ---------- Current-period sample payments (paid, partial and pending examples) ----------
export let payments = [
  { id: "PAY-001", studentId: "STU-001", enrollmentId: "ENR-STU-001-001", courseId: "CRS-001", billingMonth: currentBillingMonth(), amount: 12000, method: "Cash", date: todayISO(), reference: "DEMO-PAID-001", receivedBy: "Reception" },
  { id: "PAY-002", studentId: "STU-002", enrollmentId: "ENR-STU-002-001", courseId: "CRS-002", billingMonth: currentBillingMonth(), amount: 1500, method: "Bank", date: todayISO(), reference: "DEMO-PARTIAL-002", receivedBy: "Reception" }
];

// ---------- Teacher subject salaries ----------
export let teacherSubjectAssignments = [
  { teacherId: "TCH-001", subjectId: "CRS-002", monthlySalary: 5000 },
  { teacherId: "TCH-002", subjectId: "CRS-002", monthlySalary: 5000 },
  { teacherId: "TCH-002", subjectId: "CRS-008", monthlySalary: 4000 },
  { teacherId: "TCH-003", subjectId: "CRS-003", monthlySalary: 4500 },
  { teacherId: "TCH-003", subjectId: "CRS-006", monthlySalary: 4000 },
  { teacherId: "TCH-004", subjectId: "CRS-005", monthlySalary: 4500 },
  { teacherId: "TCH-005", subjectId: "CRS-009", monthlySalary: 7000 }
];

const demoSalarySnapshots = teacherId => teacherSubjectAssignments
  .filter(assignment => assignment.teacherId === teacherId)
  .map(assignment => {
    const course = courses.find(item => item.id === assignment.subjectId);
    return {
      courseId: course.id,
      subjectName: course.subjectName || course.name,
      context: course.programName || course.className || "Unassigned",
      rate: assignment.monthlySalary
    };
  });
const demoSalaryRecord = (id, teacherId, name, bonus = 0, deduction = 0, payments = []) => {
  const subjects = demoSalarySnapshots(teacherId);
  const basic = subjects.reduce((total, subject) => total + subject.rate, 0);
  return {
    id, teacherId, teacherName: name, month: currentBillingMonth(), basic, bonus, deduction,
    net: basic + bonus - deduction, subjects, finalized: true, notes: "",
    paymentDate: payments.at(-1)?.date || "", payments
  };
};

// ---------- Finalized demo payroll records and payment history ----------
export let salaries = [
  demoSalaryRecord("SAL-001", "TCH-001", "Dr. Sohail Ahmad", 500, 0, [
    { id: "SPY-001", amount: 5500, date: todayISO(), method: "Bank", notes: "Demo salary payment" }
  ]),
  demoSalaryRecord("SAL-002", "TCH-002", "Prof. Ayesha Khan", 0, 0, [
    { id: "SPY-002", amount: 3000, date: todayISO(), method: "Cash", notes: "Demo partial payment" }
  ]),
  demoSalaryRecord("SAL-003", "TCH-003", "Mr. Bilal Hussain"),
  demoSalaryRecord("SAL-004", "TCH-004", "Ms. Sana Tariq"),
  demoSalaryRecord("SAL-005", "TCH-005", "Mr. Kamran Akmal")
];

// ---------- Helper: get next ID ----------
export function nextId(prefix, arr) {
  if (!arr || arr.length === 0) return `${prefix}-001`;
  const nums = arr.map(item => parseInt(item.id.split("-")[1]) || 0);
  const max = Math.max(...nums);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

// ---------- Helper: get course students ----------
export function getStudentsByCourse(courseName) {
  const course = courses.find(c => c.id === courseName || c.name === courseName);
  return students.filter(s => (s.enrollments || []).some(e => course
    ? e.courseId === course.id
    : e.courseName === courseName || enrollmentLabel(e) === courseName));
}

// ============================================
// Single source of truth: load / save / reset / backup
// ============================================
const COLLECTIONS = { students, teachers, courses, attendance, payments, salaries, teacherSubjectAssignments, courseOptions };
const SEED = JSON.stringify(COLLECTIONS); // pristine demo data, taken before anything is loaded

function replaceAll(source) {
  for (const [key, current] of Object.entries(COLLECTIONS)) {
    if (Array.isArray(current)) current.splice(0, current.length, ...source[key]);
    else {
      Object.keys(current).forEach(item => delete current[item]);
      Object.assign(current, source[key]);
    }
  }
  migrate(); syncDerived(); saveAll();
}
export async function loadAll() {
  const seed = JSON.parse(SEED), source = {};
  for (const key of Object.keys(COLLECTIONS)) {
    const saved = getData(key);
    const valid = key === "teacherSubjectAssignments"
      ? Array.isArray(saved) && saved.every(item => item && typeof item.teacherId === "string" && typeof item.subjectId === "string")
      : key === "courseOptions"
      ? saved && typeof saved === "object" && !Array.isArray(saved)
        && Array.isArray(saved.classes)
        && (saved.programs == null || Array.isArray(saved.programs))
      : Array.isArray(saved) && saved.every(x => x && typeof x === "object" && typeof x.id === "string");
    source[key] = valid ? saved : seed[key]; // missing / malformed data falls back to demo data
  }
  replaceAll(source);
  saveAll();
}
export function saveAll() { for (const [k, a] of Object.entries(COLLECTIONS)) saveData(k, a); }
export function resetDemoData() { replaceAll(JSON.parse(SEED)); }
export function exportBackup() {
  return JSON.stringify({ app: "AcademiaHub", version: 1, exportedAt: new Date().toISOString(), data: COLLECTIONS }, null, 2);
}
export function importBackup(text) {
  const o = JSON.parse(text);
  if (o?.app !== "AcademiaHub" || !o.data) throw new Error("This is not an AcademiaHub backup file.");
  for (const k of Object.keys(COLLECTIONS)) {
    if (k === "courseOptions" || k === "teacherSubjectAssignments") continue; // older backups predate these collections
    if (!Array.isArray(o.data[k])) throw new Error(`Backup is missing "${k}".`);
  }
  if (o.data.courseOptions == null) o.data.courseOptions = JSON.parse(SEED).courseOptions;
  else if (typeof o.data.courseOptions !== "object" || Array.isArray(o.data.courseOptions)
    || !Array.isArray(o.data.courseOptions.classes)
    || (o.data.courseOptions.programs != null && !Array.isArray(o.data.courseOptions.programs))) {
    throw new Error('Backup has invalid "courseOptions".');
  }
  if (o.data.teacherSubjectAssignments == null) o.data.teacherSubjectAssignments = [];
  else if (!Array.isArray(o.data.teacherSubjectAssignments)) throw new Error('Backup has invalid "teacherSubjectAssignments".');
  delete o.data.salaryRates;
  replaceAll(o.data);
}

function syncTeacherSubjectLinks() {
  courses.filter(course => course.type === "Subject-Based").forEach(course => {
    course.teacherIds = [...new Set(teacherSubjectAssignments
      .filter(assignment => assignment.subjectId === course.id)
      .map(assignment => assignment.teacherId))];
    course.teacherId = course.teacherIds[0] || "";
  });
}
export function setTeacherSubjectAssignments(teacherId, assignments) {
  if (!teachers.some(teacher => teacher.id === teacherId)) throw new Error("Teacher not found.");
  if (!Array.isArray(assignments)) throw new Error("Choose valid subject assignments.");
  const seenIds = new Set(), seenNames = new Set();
  const normalized = assignments.map(assignment => {
    const course = courses.find(item => item.id === assignment?.subjectId && item.type === "Subject-Based");
    const amount = assignment?.monthlySalary;
    if (!course) throw new Error("An assigned subject is not available.");
    if (seenIds.has(course.id)) throw new Error("The same subject cannot be assigned twice.");
    const name = (course.subjectName || course.name).trim().toLocaleLowerCase();
    if (seenNames.has(name)) throw new Error(`The subject "${course.subjectName || course.name}" cannot be assigned twice.`);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid salary amount of 0 or more for each subject.");
    seenIds.add(course.id);
    seenNames.add(name);
    return { teacherId, subjectId: course.id, monthlySalary: amount };
  });
  teacherSubjectAssignments.splice(
    0,
    teacherSubjectAssignments.length,
    ...teacherSubjectAssignments.filter(assignment => assignment.teacherId !== teacherId),
    ...normalized
  );
  syncTeacherSubjectLinks();
  commit();
}

// Fill in fields that older saved data (or the seed) does not have yet
const SCHEDULES = ["Mon, Wed 09:00-11:00", "Tue, Thu 11:30-13:00", "Mon-Fri 14:00-16:00", "Sat 10:00-14:00"];
export const courseByName = name => courses.find(c => c.name === name);
const monthsOf = c => parseInt(c?.duration) || 1;
const LEGACY_OFFERINGS = {
  "Web Development": "CRS-001",
  "Graphic Design": "CRS-002",
  "Python Programming": "CRS-003",
  "Digital Marketing": "CRS-005",
  "Advanced Web Development": "CRS-004",
  "UI/UX Design": "CRS-006",
  "Data Science Basics": "CRS-009"
};
const legacyCourseId = id => Number(/^CRS-(\d+)$/.exec(id || "")?.[1]) <= 7 ? id : "";
const isNewOffering = c => c.type === "Class-Based" || c.type === "Subject-Based";
function knownAcademicLevel(name) {
  const value = String(name || "").trim();
  if (/^(9th|10th)\b/i.test(value)) return "Matric";
  if (/^(11th|12th|1st\s+year|2nd\s+year)\b/i.test(value)) return "Inter";
  if (/^BS\b/i.test(value)) return "BS";
  return "";
}
function standardClassName(name) {
  if (/^11th\s+Class$/i.test(String(name || "").trim())) return "1st Year";
  if (/^12th\s+Class$/i.test(String(name || "").trim())) return "2nd Year";
  return name;
}
function classId(records) {
  let next = 1;
  while (records.some(item => item.id === `CLS-${String(next).padStart(3, "0")}`)) next++;
  return `CLS-${String(next).padStart(3, "0")}`;
}
function normalizeClassCatalog() {
  const existing = Array.isArray(courseOptions.classes) ? courseOptions.classes : [];
  const existingPrograms = Array.isArray(courseOptions.programs) ? courseOptions.programs : [];
  const legacy = [...existing, ...Object.entries(schoolClasses).flatMap(([academicLevel, names]) =>
    names.map(name => ({ name, academicLevel }))), ...existingPrograms];
  const offerings = courses.map(c => c.programName || (c.academicLevel === "BS" ? c.className : "")).filter(Boolean);
  const catalog = [];
  const programs = [];
  for (const item of [...legacy, ...offerings]) {
    const name = standardClassName(typeof item === "string" ? item.trim() : String(item?.name || "").trim());
    if (!name || name === "General Programs" || catalog.some(record => record.name.toLowerCase() === name.toLowerCase())) continue;
    const old = typeof item === "object" ? item : {};
    const level = academicLevels.includes(old.academicLevel) ? old.academicLevel : knownAcademicLevel(name);
    if (level === "BS" || /^BS\b/i.test(name)) {
      if (!programs.some(program => program.toLowerCase() === name.toLowerCase())) programs.push(name);
    } else catalog.push({ id: old.id || classId(catalog), name, academicLevel: level });
  }
  courseOptions.classes.splice(0, courseOptions.classes.length, ...catalog);
  courseOptions.programs = [...new Set([...programs, "BS Computer Science", "BS Software Engineering", "BS Information Technology"])];
}
function migrate() {
  Object.keys(courseOptions).filter(key => !["classes", "programs"].includes(key)).forEach(key => delete courseOptions[key]);
  courseOptions.classes ||= [];
  courseOptions.programs ||= [];
  let replacedSeedOfferings = false;
  for (let i = courses.length - 1; i >= 0; i--) {
    const c = courses[i];
    if (LEGACY_OFFERINGS[c.name] && legacyCourseId(c.id) === c.id && !isNewOffering(c)) {
      courses.splice(i, 1);
      replacedSeedOfferings = true;
      continue;
    }
    c.teacherIds = Array.isArray(c.teacherIds) && c.teacherIds.length ? c.teacherIds : (c.teacherId ? [c.teacherId] : []);
    c.teacherId ||= c.teacherIds[0] || "";
    c.schedule ||= SCHEDULES[i % SCHEDULES.length];
    c.status ||= "Active";
    c.capacity = Number(c.capacity) > 0 ? Number(c.capacity) : 30;
    c.className = standardClassName(c.className || "");
    c.programName = standardClassName(c.programName || "");
    if (!isNewOffering(c)) {
      c.type = "Subject-Based";
      c.className ||= c.programName || "";
      c.programName ||= "";
      c.subjectName ||= c.name;
      Object.keys(c).filter(key => key.toLowerCase() === "skillname").forEach(key => delete c[key]);
    }
  }
  if (replacedSeedOfferings) {
    const migratedSeeds = JSON.parse(SEED).courses;
    migratedSeeds.forEach(seedCourse => {
      const existing = courses.find(c => c.id === seedCourse.id);
      if (existing) Object.assign(existing, seedCourse);
      else courses.push(seedCourse);
    });
  }
  normalizeClassCatalog();
  courses.forEach((c, i) => {
    c.className ||= c.programName || "";
    const knownLevel = classRecord(c.programName || c.className)?.academicLevel || "";
    c.academicLevel = academicLevels.includes(c.academicLevel) ? c.academicLevel : knownLevel;
    if (c.academicLevel === "BS" && !c.programName) c.programName = c.className;
    if (c.academicLevel === "BS" && c.semester) {
      const legacySemester = bsSemesters.find(item => item.label.toLowerCase() === String(c.semester).toLowerCase());
      if (legacySemester) c.semester = legacySemester.value;
    }
    c.teacherIds ||= c.teacherId ? [c.teacherId] : [];
  });
  if (!teacherSubjectAssignments.length) {
    const assignedNames = new Set();
    teacherSubjectAssignments.push(...courses.filter(course => course.type === "Subject-Based").flatMap(course =>
      (course.teacherIds || []).flatMap(teacherId => {
        const key = `${teacherId}:${(course.subjectName || course.name).trim().toLocaleLowerCase()}`;
        if (assignedNames.has(key)) return [];
        assignedNames.add(key);
        return [{ teacherId, subjectId: course.id, monthlySalary: null }];
      })));
  }
  syncTeacherSubjectLinks();
  const usedEnrollmentIds = new Set();
  let enrollmentSequence = Math.max(0, ...students.flatMap(s => s.enrollments || [])
    .map(enrollment => Number(/^ENR-(\d+)$/.exec(enrollment.id || "")?.[1]) || 0));
  const enrollmentIdMap = new Map();
  students.forEach(s => {
    s.enrollments ||= [];
    const mappedCourseId = LEGACY_OFFERINGS[s.course];
    const enrollmentTargets = s.enrollments.map(enrollment => ({ enrollment, targetId: LEGACY_OFFERINGS[enrollment.courseName] }));
    const mappedEnrollments = new Set();
    for (const { enrollment, targetId } of enrollmentTargets) {
      if (!targetId || !courses.some(c => c.id === targetId)) continue;
      const target = courses.find(c => c.id === targetId);
      Object.assign(enrollment, {
        courseId: target.id, courseName: target.name, courseType: target.type,
        className: target.className, programName: target.programName || "", subjectName: target.subjectName || "",
        semester: target.semester || "", fee: target.fee, totalFee: 0,
        duration: target.duration, teacherId: target.teacherId, teacherIds: target.teacherIds,
        billingStartMonth: currentBillingMonth()
      });
      mappedEnrollments.add(target.id);
    }
    const targetId = mappedCourseId && !mappedEnrollments.size ? mappedCourseId : "";
    if (targetId && courses.some(c => c.id === targetId)) {
      const target = courses.find(c => c.id === targetId);
      s.enrollments.push({
        id: `ENR-${s.id}-001`, courseId: target.id, courseName: target.name, courseType: target.type,
        className: target.className, programName: target.programName || "", subjectName: target.subjectName || "",
        semester: target.semester || "", fee: target.fee, totalFee: 0, duration: target.duration,
        teacherId: target.teacherId, teacherIds: target.teacherIds, enrollmentDate: s.admissionDate || todayISO(),
        billingStartMonth: currentBillingMonth(), discounts: {}, status: "Active"
      });
    }
    if (s.enrollments.length) {
      s.course = s.enrollments.map(enrollmentLabel).join(", ");
    }
    if (!s.enrollments.length && s.course) {
      const course = courseByName(s.course);
      if (course) s.enrollments.push({
        id: `ENR-${s.id}-001`, courseId: course.id, courseName: course.name, courseType: course.type,
        className: course.className || "", subjectName: course.subjectName || "", programName: course.programName || "",
        semester: course.semester || "", fee: Number(s.monthlyFee) || Number(course.fee) || 0,
        totalFee: typeof s.totalFee === "number" ? s.totalFee : (Number(s.monthlyFee) || Number(course.fee) || 0) * monthsOf(course),
        duration: course.duration, teacherId: course.teacherId, enrollmentDate: s.admissionDate || todayISO(), billingStartMonth: currentBillingMonth(), status: "Active"
      });
    }
    s.enrollments.forEach((enrollment, i) => {
      const course = courses.find(c => c.id === enrollment.courseId) || courseByName(enrollment.courseName || s.course);
      enrollment.id ||= `ENR-${s.id}-${String(i + 1).padStart(3, "0")}`;
      const previousId = enrollment.id;
      if (usedEnrollmentIds.has(enrollment.id)) {
        do { enrollment.id = `ENR-${String(++enrollmentSequence).padStart(3, "0")}`; }
        while (usedEnrollmentIds.has(enrollment.id));
      }
      usedEnrollmentIds.add(enrollment.id);
      const mapKey = JSON.stringify([s.id, previousId]);
      enrollmentIdMap.set(mapKey, [...(enrollmentIdMap.get(mapKey) || []), enrollment]);
      enrollment.courseId ||= course?.id || "";
      enrollment.courseName ||= course?.name || s.course || "Course";
      enrollment.courseType ||= course?.type || "Subject-Based";
      enrollment.academicLevel ||= course?.academicLevel || classRecord(enrollment.programName || enrollment.className)?.academicLevel || "";
      enrollment.className = standardClassName(enrollment.className || course?.className || "");
      enrollment.programName = standardClassName(enrollment.programName || course?.programName || "");
      enrollment.subjectName ||= course?.subjectName || "";
      enrollment.semester ||= course?.semester || "";
      if (enrollment.academicLevel === "Intermediate (Inter)") enrollment.academicLevel = "Inter";
      enrollment.fee = Number(enrollment.fee ?? enrollment.monthlyFee ?? course?.fee) || 0;
      enrollment.totalFee = Number(enrollment.totalFee ?? (enrollment.fee * monthsOf(course))) || 0;
      enrollment.duration ||= course?.duration || "1 month";
      enrollment.teacherId ||= course?.teacherId || "";
      enrollment.enrollmentDate ||= s.admissionDate || todayISO();
      enrollment.billingStartMonth ||= currentBillingMonth();
      enrollment.discounts ||= {};
      enrollment.status ||= "Active";
    });
    if (s.enrollments.length) {
      s.course = s.enrollments.map(enrollmentLabel).join(", ");
      s.monthlyFee = s.enrollments.reduce((sum, e) => sum + e.fee, 0);
      s.totalFee = s.enrollments.reduce((sum, e) => sum + e.totalFee, 0);
    }
    const activeEnrollments = s.enrollments.filter(enrollment => enrollment.status === "Active");
    s.className ||= activeEnrollments.find(enrollment => enrollment.className || enrollment.programName)?.programName
      || activeEnrollments.find(enrollment => enrollment.className)?.className || "";
    s.className = standardClassName(s.className);
    s.academicLevel = classRecord(s.className)?.academicLevel || "";
    if (s.academicLevel === "Intermediate (Inter)") s.academicLevel = "Inter";
    if (s.academicLevel === "BS") {
      const activeBS = activeEnrollments.find(enrollment => enrollment.academicLevel === "BS" || enrollment.programName);
      s.programName ||= activeBS?.programName || activeBS?.className || s.className;
      s.semester ||= activeBS?.semester || "";
    }
    s.selectedSubjectIds ||= activeEnrollments.filter(enrollment => enrollment.courseType !== "Class-Based").map(enrollment => enrollment.courseId);
    s.concessionType ||= "Fixed";
    s.concessionValue = Number(s.concessionValue) || 0;
    s.grossMonthlyFee = Number(s.grossMonthlyFee ?? activeEnrollments.reduce((sum, enrollment) => sum + Number(enrollment.subjectFee ?? enrollment.fee ?? 0), 0));
    s.concessionAmount = Number(s.concessionAmount ?? activeEnrollments.reduce((sum, enrollment) => sum + Number(enrollment.concessionShare || 0), 0));
    s.netMonthlyFee = Number(s.netMonthlyFee ?? activeEnrollments.reduce((sum, enrollment) => sum + Number(enrollment.fee || 0), 0));
  });
  payments.forEach(payment => {
    const student = students.find(s => s.id === payment.studentId);
    const candidates = enrollmentIdMap.get(JSON.stringify([payment.studentId, payment.enrollmentId])) || [];
    const enrollment = candidates.find(e => payment.courseId && e.courseId === payment.courseId)
      || candidates.find(e => payment.courseName && e.courseName === payment.courseName)
      || candidates[0]
      || student?.enrollments?.find(e => payment.courseId && e.courseId === payment.courseId)
      || student?.enrollments?.find(e => payment.courseName && e.courseName === payment.courseName)
      || student?.enrollments?.[0];
    if (enrollment) payment.enrollmentId = enrollment.id;
    if (enrollment) {
      payment.courseId = enrollment.courseId;
      payment.courseName = enrollment.courseName;
    }
    payment.date ||= todayISO();
    payment.billingMonth ||= payment.date.slice(0, 7);
    payment.reference ||= payment.id;
    payment.receiptNumber ||= payment.id;
    payment.receiptType ||= "Original";
  });
  attendance.forEach(a => {
    if (!a.courseId) {
      const student = students.find(s => s.id === a.studentId);
      a.courseId = student?.enrollments?.[0]?.courseId || courseByName(student?.course)?.id || "";
    }
    a.markedBy ||= "Imported";
  });
  teachers.forEach(t => {
    const subject = { "Web Development": "Computer Science", "Graphic Design": "English", "Python Programming": "Physics", "Digital Marketing": "Chemistry" }[t.subject];
    if (subject) t.subject = subject;
  });
  courses.forEach(course => {
    course.teacherIds = [...new Set((course.teacherIds || (course.teacherId ? [course.teacherId] : []))
      .filter(id => teachers.some(teacher => teacher.id === id)))];
    course.teacherId = course.teacherIds[0] || "";
  });
  salaries.forEach(s => {
    s.month ||= (s.paymentDate || "").slice(0, 7);
    s.teacherName ||= teachers.find(teacher => teacher.id === s.teacherId)?.name || "";
    s.notes ||= "";
    s.bonus = Number(s.bonus) || 0;
    s.deduction = Number(s.deduction) || 0;
    s.net = Number(s.net ?? (Number(s.basic || 0) + s.bonus - s.deduction));
    if (!Array.isArray(s.subjects)) s.subjects = [];
    s.payments = Array.isArray(s.payments)
      ? s.payments.filter(payment => payment && typeof payment === "object" && !Array.isArray(payment))
      : [];
    if (s.status === "Paid" && !s.payments.length) {
      s.payments.push({
        id: `${s.id}-LEGACY`, amount: s.net, date: s.paymentDate || `${s.month}-01`,
        method: "Legacy", notes: "Imported paid salary record"
      });
    }
    s.payments.forEach(payment => {
      payment.amount = Number(payment.amount) || 0;
      payment.date ||= s.paymentDate || `${s.month}-01`;
      payment.method ||= "Imported";
      payment.notes ||= "";
    });
    if (Array.isArray(s.subjects)) {
      const seen = new Set();
      s.subjects = s.subjects.filter(subject => subject?.courseId && !seen.has(subject.courseId) && seen.add(subject.courseId));
    }
  });
}

// ---------- Derived values (always calculated from records, never typed in) ----------
export const paidBy = id => payments.filter(p => p.studentId === id).reduce((t, p) => t + p.amount, 0);
export const studentEnrollments = student => student?.enrollments || [];
export const calculateConcession = (total, type, value) => {
  const amount = type === "Percentage" ? Number(total) * Number(value) / 100 : Number(value);
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};
export const enrollmentPaymentsForMonth = (enrollmentId, month) => payments.filter(p => p.enrollmentId === enrollmentId && p.billingMonth === month);
export const enrollmentPaid = (enrollmentId, month = currentBillingMonth()) => enrollmentPaymentsForMonth(enrollmentId, month).reduce((t, p) => t + Number(p.amount || 0), 0);
export const enrollmentFeeBreakdown = (enrollment, month = currentBillingMonth()) => {
  const rate = (enrollment?.feeHistory || []).filter(item => item.effectiveMonth <= month)
    .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0];
  const net = Number(rate?.fee ?? enrollment?.fee ?? 0);
  const gross = Number(rate?.subjectFee ?? enrollment?.subjectFee ?? enrollment?.fee ?? 0);
  const concession = Number(rate?.concessionShare ?? enrollment?.concessionShare ?? enrollment?.discounts?.[month] ?? 0);
  return { gross, concession, net };
};
export const enrollmentDue = (enrollment, month = currentBillingMonth()) => {
  const start = (enrollment?.billingStartMonth || enrollment?.enrollmentDate || todayISO()).slice(0, 7);
  if (month < start || month > currentBillingMonth()) return 0;
  const rate = (enrollment?.feeHistory || []).filter(item => item.effectiveMonth <= month)
    .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0];
  const fee = Number(rate?.fee ?? enrollment?.fee ?? 0);
  return Math.max(0, fee - Number(rate ? 0 : enrollment?.discounts?.[month] || 0));
};
export const enrollmentBalance = (enrollment, month = currentBillingMonth()) => Math.max(0, enrollmentDue(enrollment, month) - enrollmentPaid(enrollment?.id, month));
export const enrollmentStatus = (enrollment, month = currentBillingMonth()) => enrollmentBalance(enrollment, month) === 0 ? "Paid" : enrollmentPaid(enrollment?.id, month) > 0 ? "Partial" : "Pending";
export const billingPeriodsForEnrollment = (enrollment, throughMonth = currentBillingMonth()) => {
  const start = (enrollment?.billingStartMonth || enrollment?.enrollmentDate || todayISO()).slice(0, 7);
  const result = [];
  let month = start;
  while (month <= throughMonth && result.length < 240) {
    const due = enrollmentDue(enrollment, month);
    const paid = enrollmentPaid(enrollment.id, month);
    result.push({ month, due, paid: Math.min(due, paid), balance: Math.max(0, due - paid), status: due <= paid ? "Paid" : paid > 0 ? "Partial" : "Pending" });
    const [year, number] = month.split("-").map(Number);
    month = `${number === 12 ? year + 1 : year}-${String(number === 12 ? 1 : number + 1).padStart(2, "0")}`;
  }
  return result;
};
export const enrollmentLabel = enrollment => {
  if (enrollment.courseType === "Class-Based") return enrollment.programName || enrollment.className || enrollment.courseName;
  const parts = [enrollment.programName || enrollment.className, enrollment.subjectName].filter(Boolean);
  return parts.join(" · ") || enrollment.courseName;
};
export function feeRowsForMonth(month = currentBillingMonth()) {
  return students.flatMap(student => studentEnrollments(student)
    .filter(enrollment => enrollment.status === "Active")
    .map(enrollment => {
      const due = enrollmentDue(enrollment, month);
      const paid = Math.min(due, enrollmentPaid(enrollment.id, month));
      const breakdown = enrollmentFeeBreakdown(enrollment, month);
      const course = courses.find(c => c.id === enrollment.courseId);
      const lastPayment = enrollmentPaymentsForMonth(enrollment.id, month).slice().sort((a, b) => b.date.localeCompare(a.date))[0];
      return { student, enrollment, course, month, due, grossFee: breakdown.gross, concession: breakdown.concession, paid, pending: Math.max(0, due - paid),
        status: due <= paid ? "Paid" : paid > 0 ? "Partial" : "Pending", lastPaymentDate: lastPayment?.date || "" };
    }).filter(row => row.due > 0 || row.concession > 0));
}
export const feesDueForMonth = (month = currentBillingMonth()) => feeRowsForMonth(month).reduce((sum, row) => sum + row.due, 0);
export const feesCollectedForMonth = (month = currentBillingMonth()) => feeRowsForMonth(month).reduce((sum, row) => sum + row.paid, 0);
export const pendingFeesForMonth = (month = currentBillingMonth()) => feeRowsForMonth(month).reduce((sum, row) => sum + row.pending, 0);
export const balanceOf = (s, month = currentBillingMonth()) => (s?.enrollments || [])
  .filter(enrollment => enrollment.status === "Active")
  .reduce((total, enrollment) => total + enrollmentBalance(enrollment, month), 0);
export function feeStatus(s) {
  const enrollments = (s?.enrollments || []).filter(enrollment => enrollment.status === "Active");
  if (!enrollments.length || enrollments.every(e => enrollmentStatus(e) === "Paid")) return "Paid";
  return enrollments.some(e => enrollmentStatus(e) === "Partial") ? "Partial" : "Pending";
}
// Present + Late count as attended; "Leave" days are excluded. null = no records yet.
export function attendancePct(studentId) {
  const r = attendance.filter(a => a.studentId === studentId && a.status !== "Leave");
  return r.length ? Math.round(r.filter(a => a.status !== "Absent").length / r.length * 100) : null;
}
export function syncDerived() {
  students.forEach(s => {
    s.feeStatus = feeStatus(s); s.attendance = attendancePct(s.id);
    const active = (s.enrollments || []).filter(enrollment => enrollment.status === "Active");
    s.course = active.map(enrollmentLabel).join(", ") || s.course || "No subjects";
    s.monthlyFee = active.reduce((sum, enrollment) => sum + Number(enrollment.fee || 0), 0);
    s.netMonthlyFee = s.monthlyFee;
    s.grossMonthlyFee = active.reduce((sum, enrollment) => sum + Number(enrollment.subjectFee ?? enrollment.fee ?? 0), 0);
    s.concessionAmount = active.reduce((sum, enrollment) => sum + Number(enrollment.concessionShare || 0), 0);
    s.totalFee = active.reduce((sum, enrollment) => sum + Number(enrollment.totalFee || 0), 0);
    s.selectedSubjectIds = active.filter(enrollment => enrollment.courseType !== "Class-Based").map(enrollment => enrollment.courseId);
    s.className ||= active.find(enrollment => enrollment.programName || enrollment.className)?.programName
      || active.find(enrollment => enrollment.className)?.className || "";
  });
  courses.forEach(c => {
    c.students = students.reduce((count, s) => count + (s.enrollments || []).filter(e => e.courseId === c.id && e.status === "Active").length, 0);
  });
}
// Call after any change: recalculates derived values and persists everything
export function commit() { syncDerived(); saveAll(); }

// ---------- Teacher scoping ----------
export const teacherCourses = tid => courses.filter(c => (c.teacherIds || [c.teacherId]).includes(tid));
export function assignedTeacherSubjects(tid) {
  const subjects = new Map();
  teacherSubjectAssignments.filter(assignment => assignment.teacherId === tid).forEach(assignment => {
    const course = courses.find(item => item.id === assignment.subjectId);
    if (course) {
      const key = (course.subjectName || course.name).trim().toLocaleLowerCase();
      if (!subjects.has(key)) subjects.set(key, {
        ...course,
        monthlySalary: assignment.monthlySalary == null ? null : Number(assignment.monthlySalary)
      });
    }
  });
  return [...subjects.values()];
}
export const teacherExpectedSalary = tid => assignedTeacherSubjects(tid)
  .reduce((total, course) => total + (Number.isFinite(course.monthlySalary) ? course.monthlySalary : 0), 0);
export const salaryPaid = salary => (salary.payments || []).reduce((total, payment) => total + Number(payment.amount || 0), 0);
export const salaryBalance = salary => Math.max(0, Number(salary.net || 0) - salaryPaid(salary));
export const salaryStatus = salary => salaryBalance(salary) === 0 ? "Paid" : salaryPaid(salary) > 0 ? "Partially Paid" : "Pending";
export function teacherStudents(tid) {
  const ids = new Set(teacherCourses(tid).map(c => c.id));
  return students.filter(s => (s.enrollments || []).some(e => ids.has(e.courseId) && e.status === "Active"));
}
export const monthsForCourse = name => monthsOf(courseByName(name));
export function todayISO() { return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
