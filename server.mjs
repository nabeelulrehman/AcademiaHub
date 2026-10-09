import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const dbFile = resolve(process.env.ACADEMIAHUB_DB_PATH || join(root, "data", "academiahub.sqlite"));
mkdirSync(dirname(dbFile), { recursive: true });
const db = new DatabaseSync(dbFile);
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS teachers (id TEXT PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, context TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    monthly_salary REAL CHECK(monthly_salary IS NULL OR monthly_salary >= 0),
    PRIMARY KEY (teacher_id, subject_id)
  );
  CREATE TABLE IF NOT EXISTS monthly_salaries (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    month TEXT NOT NULL CHECK(month GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
    basic REAL NOT NULL CHECK(basic >= 0),
    bonus REAL NOT NULL CHECK(bonus >= 0),
    deduction REAL NOT NULL CHECK(deduction >= 0),
    net REAL NOT NULL CHECK(net >= 0),
    subjects_json TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    finalized INTEGER NOT NULL DEFAULT 1,
    payment_date TEXT NOT NULL DEFAULT '',
    UNIQUE(teacher_id, month)
  );
  CREATE TABLE IF NOT EXISTS salary_payments (
    id TEXT PRIMARY KEY,
    salary_id TEXT NOT NULL REFERENCES monthly_salaries(id) ON DELETE RESTRICT,
    amount REAL NOT NULL CHECK(amount > 0),
    date TEXT NOT NULL,
    method TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT ''
  );
`);

function migrateDatabase() {
  const assignmentSalary = db.prepare("PRAGMA table_info(teacher_subject_assignments)")
    .all().find(column => column.name === "monthly_salary");
  if (!assignmentSalary) {
    db.exec("ALTER TABLE teacher_subject_assignments ADD COLUMN monthly_salary REAL CHECK(monthly_salary IS NULL OR monthly_salary >= 0)");
  } else if (assignmentSalary.notnull) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(`
        CREATE TABLE teacher_subject_assignments_new (
          teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
          subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
          monthly_salary REAL CHECK(monthly_salary IS NULL OR monthly_salary >= 0),
          PRIMARY KEY (teacher_id, subject_id)
        );
        INSERT INTO teacher_subject_assignments_new (teacher_id, subject_id, monthly_salary)
          SELECT teacher_id, subject_id, monthly_salary FROM teacher_subject_assignments;
        DROP TABLE teacher_subject_assignments;
        ALTER TABLE teacher_subject_assignments_new RENAME TO teacher_subject_assignments;
      `);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_salary_payments_salary_date
      ON salary_payments(salary_id, date, id);
    PRAGMA user_version = 1;
  `);
}
migrateDatabase();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};
const sendJson = (response, status, value) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
};
const fail = (response, status, message) => sendJson(response, status, { error: message });
const readBody = request => new Promise((resolveBody, reject) => {
  let text = "";
  request.on("data", chunk => {
    text += chunk;
    if (text.length > 5_000_000) {
      reject(new Error("Request body is too large."));
      request.destroy();
    }
  });
  request.on("end", () => {
    try { resolveBody(JSON.parse(text || "{}")); }
    catch { reject(new Error("Request body must be valid JSON.")); }
  });
  request.on("error", reject);
});
const transaction = callback => {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};
const validAmount = value => typeof value === "number" && Number.isFinite(value) && value >= 0;
const validMonth = value => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

function upsertCatalog(body) {
  if (!Array.isArray(body.teachers) || !Array.isArray(body.subjects)) throw new Error("Teacher and subject catalogs are required.");
  const saveTeacher = db.prepare("INSERT INTO teachers(id, name) VALUES(?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name");
  for (const teacher of body.teachers) {
    if (!teacher || typeof teacher.id !== "string" || typeof teacher.name !== "string" || !teacher.name.trim()) throw new Error("Invalid teacher catalog entry.");
    saveTeacher.run(teacher.id, teacher.name.trim());
  }
  const saveSubject = db.prepare("INSERT INTO subjects(id, name, context) VALUES(?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, context=excluded.context");
  for (const subject of body.subjects) {
    if (!subject || typeof subject.id !== "string" || typeof subject.name !== "string" || !subject.name.trim()) throw new Error("Invalid subject catalog entry.");
    saveSubject.run(subject.id, subject.name.trim(), typeof subject.context === "string" ? subject.context : "Unassigned");
  }
}

function salaryState() {
  const assignments = db.prepare(`
    SELECT a.teacher_id AS teacherId, a.subject_id AS subjectId, a.monthly_salary AS monthlySalary,
      s.name AS subjectName, s.context
    FROM teacher_subject_assignments a JOIN subjects s ON s.id = a.subject_id
    ORDER BY a.teacher_id, lower(s.name), s.context
  `).all();
  const records = db.prepare(`
    SELECT id, teacher_id AS teacherId, month, basic, bonus, deduction, net, subjects_json AS subjectsJson,
      notes, finalized, payment_date AS paymentDate
    FROM monthly_salaries ORDER BY month DESC, id DESC
  `).all();
  const payments = db.prepare(`
    SELECT id, salary_id AS salaryId, amount, date, method, notes FROM salary_payments ORDER BY date, id
  `).all();
  const grouped = new Map();
  payments.forEach(payment => {
    const list = grouped.get(payment.salaryId) || [];
    list.push({ id: payment.id, amount: payment.amount, date: payment.date, method: payment.method, notes: payment.notes });
    grouped.set(payment.salaryId, list);
  });
  const salaries = records.map(record => {
    let subjects;
    try { subjects = JSON.parse(record.subjectsJson); }
    catch { throw new Error(`Stored salary snapshot ${record.id} is invalid.`); }
    const salary = {
      id: record.id, teacherId: record.teacherId, month: record.month, basic: record.basic,
      bonus: record.bonus, deduction: record.deduction, net: record.net, subjects,
      notes: record.notes, finalized: Boolean(record.finalized), paymentDate: record.paymentDate,
      payments: grouped.get(record.id) || []
    };
    const paid = salary.payments.reduce((sum, item) => sum + item.amount, 0);
    salary.status = paid >= salary.net ? "Paid" : paid > 0 ? "Partially Paid" : "Pending";
    return salary;
  });
  return { assignments, salaries };
}

function insertLegacySalary(record) {
  if (!record || typeof record.id !== "string" || typeof record.teacherId !== "string"
    || !validMonth(record.month) || !validAmount(Number(record.basic))
    || !validAmount(Number(record.bonus || 0)) || !validAmount(Number(record.deduction || 0))
    || !validAmount(Number(record.net))) return;
  if (!db.prepare("SELECT id FROM teachers WHERE id=?").get(record.teacherId)) return;
  const exists = db.prepare("SELECT id FROM monthly_salaries WHERE id=? OR (teacher_id=? AND month=?)").get(record.id, record.teacherId, record.month);
  if (exists) return;
  db.prepare(`INSERT INTO monthly_salaries
    (id, teacher_id, month, basic, bonus, deduction, net, subjects_json, notes, finalized, payment_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(
    record.id, record.teacherId, record.month, Number(record.basic), Number(record.bonus || 0),
    Number(record.deduction || 0), Number(record.net),
    JSON.stringify(Array.isArray(record.subjects) ? record.subjects : []),
    typeof record.notes === "string" ? record.notes : "",
    typeof record.paymentDate === "string" ? record.paymentDate : ""
  );
  const savePayment = db.prepare("INSERT OR IGNORE INTO salary_payments(id, salary_id, amount, date, method, notes) VALUES (?, ?, ?, ?, ?, ?)");
  for (const payment of Array.isArray(record.payments) ? record.payments : []) {
    if (!payment || typeof payment.id !== "string" || !Number.isFinite(Number(payment.amount)) || Number(payment.amount) <= 0) continue;
    savePayment.run(payment.id, record.id, Number(payment.amount), payment.date || `${record.month}-01`, payment.method || "Imported", payment.notes || "");
  }
}

function bootstrap(body) {
  return transaction(() => {
    upsertCatalog(body);
    const initialized = db.prepare("SELECT value FROM app_meta WHERE key='salary_db_initialized'").get();
    if (!initialized) {
      const initialAssignments = Array.isArray(body.assignments) && body.assignments.length
        ? body.assignments
        : Array.isArray(body.legacyAssignments) ? body.legacyAssignments : [];
      const insertAssignment = db.prepare("INSERT OR IGNORE INTO teacher_subject_assignments(teacher_id, subject_id, monthly_salary) VALUES (?, ?, ?)");
      const usedNames = new Set();
      for (const assignment of initialAssignments) {
        const salary = assignment?.monthlySalary == null ? null : assignment.monthlySalary;
        if (!assignment || (salary !== null && !validAmount(salary))) continue;
        const subject = db.prepare("SELECT name FROM subjects WHERE id=?").get(assignment.subjectId);
        if (!subject || !db.prepare("SELECT id FROM teachers WHERE id=?").get(assignment.teacherId)) continue;
        const uniqueName = `${assignment.teacherId}:${subject.name.trim().toLocaleLowerCase()}`;
        if (usedNames.has(uniqueName)) continue;
        usedNames.add(uniqueName);
        insertAssignment.run(assignment.teacherId, assignment.subjectId, salary);
      }
      for (const salary of Array.isArray(body.salaries) ? body.salaries : []) insertLegacySalary(salary);
      db.prepare("INSERT INTO app_meta(key, value) VALUES ('salary_db_initialized', '1')").run();
    }
    return salaryState();
  });
}

function saveAssignments(teacherId, body) {
  if (!Array.isArray(body.assignments)) throw new Error("Assignments must be an array.");
  return transaction(() => {
    upsertCatalog(body);
    if (!db.prepare("SELECT id FROM teachers WHERE id=?").get(teacherId)) throw new Error("Teacher does not exist.");
    const normalizedNames = new Set();
    const records = body.assignments.map(item => {
      if (!item || typeof item.subjectId !== "string" || !validAmount(item.monthlySalary)) throw new Error("Every assigned subject needs a valid salary amount of 0 or more.");
      const subject = db.prepare("SELECT id, name FROM subjects WHERE id=?").get(item.subjectId);
      if (!subject) throw new Error("An assigned subject is not present in Subject Management.");
      const normalizedName = subject.name.trim().toLocaleLowerCase();
      if (normalizedNames.has(normalizedName)) throw new Error(`The subject "${subject.name}" cannot be assigned more than once to the same teacher.`);
      normalizedNames.add(normalizedName);
      return { subjectId: subject.id, monthlySalary: item.monthlySalary };
    });
    db.prepare("DELETE FROM teacher_subject_assignments WHERE teacher_id=?").run(teacherId);
    const insert = db.prepare("INSERT INTO teacher_subject_assignments(teacher_id, subject_id, monthly_salary) VALUES (?, ?, ?)");
    records.forEach(item => insert.run(teacherId, item.subjectId, item.monthlySalary));
    return salaryState();
  });
}

function restorePayroll(body) {
  if (!Array.isArray(body.assignments) || !Array.isArray(body.salaries)) throw new Error("Payroll assignments and salary records are required.");
  const seenSalaryMonths = new Set();
  const seenPaymentIds = new Set();
  for (const salary of body.salaries) {
    if (!salary || typeof salary.id !== "string" || typeof salary.teacherId !== "string"
      || !validMonth(salary.month) || !validAmount(salary.basic) || !validAmount(salary.bonus)
      || !validAmount(salary.deduction) || !validAmount(salary.net) || typeof salary.notes !== "string"
      || !Array.isArray(salary.subjects) || !Array.isArray(salary.payments)) throw new Error("Backup contains an invalid salary record.");
    const key = `${salary.teacherId}:${salary.month}`;
    if (seenSalaryMonths.has(key)) throw new Error("Backup contains duplicate salary records for a teacher and month.");
    seenSalaryMonths.add(key);
    let paid = 0;
    for (const payment of salary.payments) {
      if (!payment || typeof payment.id !== "string" || !validAmount(payment.amount) || payment.amount <= 0
        || typeof payment.date !== "string" || typeof payment.method !== "string" || typeof payment.notes !== "string"
        || seenPaymentIds.has(payment.id)) throw new Error("Backup contains an invalid or duplicate salary payment.");
      seenPaymentIds.add(payment.id);
      paid += payment.amount;
    }
    if (paid > salary.net) throw new Error("Backup salary payments exceed a salary record's net amount.");
  }
  return transaction(() => {
    db.exec("DELETE FROM salary_payments; DELETE FROM monthly_salaries; DELETE FROM teacher_subject_assignments; DELETE FROM teachers; DELETE FROM subjects;");
    upsertCatalog(body);
    const usedNames = new Set();
    const insertAssignment = db.prepare("INSERT INTO teacher_subject_assignments(teacher_id, subject_id, monthly_salary) VALUES (?, ?, ?)");
    for (const assignment of body.assignments) {
      if (!assignment || typeof assignment.teacherId !== "string" || typeof assignment.subjectId !== "string"
        || (assignment.monthlySalary != null && !validAmount(assignment.monthlySalary))) throw new Error("Backup contains an invalid teacher-subject salary.");
      const teacher = db.prepare("SELECT id FROM teachers WHERE id=?").get(assignment.teacherId);
      const subject = db.prepare("SELECT id, name FROM subjects WHERE id=?").get(assignment.subjectId);
      if (!teacher || !subject) throw new Error("Backup refers to a teacher or subject that does not exist.");
      const key = `${assignment.teacherId}:${subject.name.trim().toLocaleLowerCase()}`;
      if (usedNames.has(key)) throw new Error(`Backup assigns the subject "${subject.name}" more than once to a teacher.`);
      usedNames.add(key);
      insertAssignment.run(assignment.teacherId, assignment.subjectId, assignment.monthlySalary ?? null);
    }
    for (const salary of body.salaries) {
      if (!db.prepare("SELECT id FROM teachers WHERE id=?").get(salary.teacherId)) throw new Error("Backup salary refers to a teacher that does not exist.");
      insertLegacySalary(salary);
    }
    db.prepare("INSERT INTO app_meta(key, value) VALUES ('salary_db_initialized', '1') ON CONFLICT(key) DO UPDATE SET value='1'").run();
    return salaryState();
  });
}

function nextId(prefix, table, column) {
  const records = db.prepare(`SELECT ${column} AS id FROM ${table}`).all();
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const maximum = Math.max(0, ...records.map(record => Number(pattern.exec(record.id)?.[1]) || 0));
  return `${prefix}-${String(maximum + 1).padStart(3, "0")}`;
}

function generateSalaries(body) {
  if (!validMonth(body.month)) throw new Error("Choose a valid salary month.");
  return transaction(() => {
    const assignments = db.prepare(`
      SELECT a.teacher_id AS teacherId, a.subject_id AS subjectId, a.monthly_salary AS monthlySalary,
        s.name AS subjectName, s.context
      FROM teacher_subject_assignments a JOIN subjects s ON s.id=a.subject_id
      ORDER BY a.teacher_id, lower(s.name), s.context
    `).all();
    const groups = new Map();
    assignments.forEach(assignment => {
      const items = groups.get(assignment.teacherId) || [];
      items.push(assignment);
      groups.set(assignment.teacherId, items);
    });
    const insert = db.prepare(`INSERT OR IGNORE INTO monthly_salaries
      (id, teacher_id, month, basic, bonus, deduction, net, subjects_json, notes, finalized, payment_date)
      VALUES (?, ?, ?, ?, 0, 0, ?, ?, '', 1, '')`);
    let created = 0;
    const skipped = [];
    const teacherList = db.prepare("SELECT id, name FROM teachers ORDER BY name").all();
    for (const teacher of teacherList) {
      const existing = db.prepare("SELECT id FROM monthly_salaries WHERE teacher_id=? AND month=?").get(teacher.id, body.month);
      if (existing) { skipped.push({ teacherId: teacher.id, reason: "already generated" }); continue; }
      const items = groups.get(teacher.id) || [];
      if (!items.length) { skipped.push({ teacherId: teacher.id, reason: "no assigned subjects" }); continue; }
      if (items.some(item => item.monthlySalary === null)) {
        skipped.push({ teacherId: teacher.id, reason: "salary amount missing for an assigned subject" }); continue;
      }
      const basic = items.reduce((sum, item) => sum + item.monthlySalary, 0);
      const snapshot = items.map(item => ({
        courseId: item.subjectId, subjectName: item.subjectName, context: item.context, rate: item.monthlySalary
      }));
      const result = insert.run(nextId("SAL", "monthly_salaries", "id"), teacher.id, body.month, basic, basic, JSON.stringify(snapshot));
      if (Number(result.changes) > 0) created++;
      else skipped.push({ teacherId: teacher.id, reason: "already generated" });
    }
    return { ...salaryState(), created, skipped };
  });
}

function updateAdjustments(salaryId, body) {
  if (!validAmount(body.bonus) || !validAmount(body.deduction) || typeof body.notes !== "string") throw new Error("Bonus, deduction, and notes are invalid.");
  const salary = db.prepare("SELECT basic, net FROM monthly_salaries WHERE id=?").get(salaryId);
  if (!salary) throw new Error("Salary record not found.");
  const paid = Number(db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM salary_payments WHERE salary_id=?").get(salaryId).total);
  const net = salary.basic + body.bonus - body.deduction;
  if (paid > 0) throw new Error("Salary adjustments cannot be changed after a payment has been recorded.");
  if (body.deduction > salary.basic + body.bonus || net < 0) throw new Error("Deduction cannot exceed base salary plus bonus.");
  db.prepare("UPDATE monthly_salaries SET bonus=?, deduction=?, net=?, notes=? WHERE id=?")
    .run(body.bonus, body.deduction, net, body.notes.trim(), salaryId);
  return salaryState();
}

function recordPayment(salaryId, body) {
  if (!body || !Number.isFinite(body.amount) || body.amount <= 0
    || typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)
    || typeof body.method !== "string" || !body.method.trim() || typeof body.notes !== "string") {
    throw new Error("Payment amount, date, and method are required and must be valid.");
  }
  const date = new Date(`${body.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== body.date) throw new Error("Payment date is invalid.");
  return transaction(() => {
    const salary = db.prepare("SELECT net FROM monthly_salaries WHERE id=?").get(salaryId);
    if (!salary) throw new Error("Salary record not found.");
    const paid = Number(db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM salary_payments WHERE salary_id=?").get(salaryId).total);
    const remaining = Math.max(0, salary.net - paid);
    if (body.amount > remaining) throw new Error(`Payment exceeds the remaining salary balance of ${remaining}.`);
    db.prepare("INSERT INTO salary_payments(id, salary_id, amount, date, method, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .run(nextId("SPY", "salary_payments", "id"), salaryId, body.amount, body.date, body.method.trim(), body.notes.trim());
    db.prepare("UPDATE monthly_salaries SET payment_date=? WHERE id=?").run(body.date, salaryId);
    return salaryState();
  });
}

async function handleApi(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/health") return sendJson(response, 200, { status: "ok", database: "sqlite", databasePath: dbFile });
    if (request.method === "GET" && url.pathname === "/api/salary-state") return sendJson(response, 200, salaryState());
    if (request.method === "POST" && url.pathname === "/api/salary/bootstrap") return sendJson(response, 200, bootstrap(await readBody(request)));
    if (request.method === "POST" && url.pathname === "/api/salary/restore") return sendJson(response, 200, restorePayroll(await readBody(request)));
    if (request.method === "POST" && url.pathname === "/api/salary/catalog") {
      const body = await readBody(request);
      transaction(() => upsertCatalog(body));
      return sendJson(response, 200, { ok: true });
    }
    if (request.method === "POST" && url.pathname === "/api/salaries/generate") {
      return sendJson(response, 200, generateSalaries(await readBody(request)));
    }
    const assignmentMatch = /^\/api\/teachers\/([^/]+)\/subjects$/.exec(url.pathname);
    if (request.method === "PUT" && assignmentMatch) {
      const body = await readBody(request);
      return sendJson(response, 200, saveAssignments(decodeURIComponent(assignmentMatch[1]), body));
    }
    if (request.method === "GET" && assignmentMatch) {
      const teacherId = decodeURIComponent(assignmentMatch[1]);
      if (!db.prepare("SELECT id FROM teachers WHERE id=?").get(teacherId)) return fail(response, 404, "Teacher not found in the salary database.");
      return sendJson(response, 200, salaryState());
    }
    const adjustmentMatch = /^\/api\/salaries\/([^/]+)\/adjustments$/.exec(url.pathname);
    if (request.method === "PUT" && adjustmentMatch) {
      return sendJson(response, 200, updateAdjustments(decodeURIComponent(adjustmentMatch[1]), await readBody(request)));
    }
    const paymentMatch = /^\/api\/salaries\/([^/]+)\/payments$/.exec(url.pathname);
    if (request.method === "POST" && paymentMatch) {
      return sendJson(response, 200, recordPayment(decodeURIComponent(paymentMatch[1]), await readBody(request)));
    }
    const teacherMatch = /^\/api\/teachers\/([^/]+)$/.exec(url.pathname);
    if (request.method === "DELETE" && teacherMatch) {
      const teacherId = decodeURIComponent(teacherMatch[1]);
      const assignmentCount = db.prepare("SELECT COUNT(*) AS count FROM teacher_subject_assignments WHERE teacher_id=?").get(teacherId).count;
      const salaryCount = db.prepare("SELECT COUNT(*) AS count FROM monthly_salaries WHERE teacher_id=?").get(teacherId).count;
      if (assignmentCount || salaryCount) return fail(response, 400, "Teacher still has subject assignments or salary history.");
      const result = db.prepare("DELETE FROM teachers WHERE id=?").run(teacherId);
      if (!Number(result.changes)) return fail(response, 404, "Teacher not found.");
      return sendJson(response, 200, { ok: true });
    }
    return fail(response, 404, "API endpoint not found.");
  } catch (error) {
    const status = /invalid|must |cannot |exceed|does not exist|not found|required|duplicate|more than once|valid salary/i.test(error.message) ? 400 : 500;
    if (status === 500) console.error("Salary API error:", error);
    return fail(response, status, error.message || "Database request failed.");
  }
}

const server = createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    handleApi(request, response, url);
    return;
  }
  const decoded = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = resolve(root, `.${normalize(decoded)}`);
  if (file !== root && !file.startsWith(`${root}${sep}`)) return fail(response, 403, "Forbidden.");
  if (!existsSync(file)) return fail(response, 404, "Not found.");
  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-cache"
  });
  createReadStream(file).on("error", error => {
    console.error("Static file error:", error);
    if (response.headersSent) response.destroy(error);
    else fail(response, 500, "Unable to read requested file.");
  }).pipe(response);
});
const port = Number(process.env.PORT || 8000);
server.listen(port, "127.0.0.1", () => console.log(`AcademiaHub listening at http://127.0.0.1:${port} (SQLite: ${dbFile})`));
