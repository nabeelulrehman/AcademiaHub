# AcademiaHub — Academy Management System (browser-based demo)

HTML + Tailwind CSS (CDN) + vanilla JavaScript ES modules. All academy demo data, including teacher-subject salaries, finalized monthly payroll and payment history, is stored in browser localStorage. This demo does not require a database or backend API.

## Run locally
Serve this folder with any static HTTP server (for example, the VS Code Live Server extension) and open its `index.html` URL. No Node.js, `server.mjs`, SQLite installation or database setup is needed. Data is saved in localStorage for the browser and site origin being used; clearing site data or switching browsers/origins resets or separates the demo data.
An internet connection is needed for the Tailwind and Font Awesome CDNs.

## Demo credentials
| Role | Username | Password | Access |
|---|---|---|---|
| Admin | `admin` | `admin123` | Everything |
| Teacher | `teacher` | `teacher123` | Dr. Sohail Ahmad (TCH-001): assigned subjects/students/attendance/salary/schedule |
| Receptionist | `reception` | `reception123` | Register students, receive fees, payment history, receipts |

## Structure
`index.html` · `style/style.css` · `js/` → `app` (login/menus) · `data` (collections, migrations, derived values, backup) · `auth` (demo roles) · `storage` · `ui` (modal/toast/CSV/helpers) · `dashboard` · `students` · `teachers` · `courses` (class/subject catalog) · `attendance` · `fees` · `salaries` · `reports` · `settings`

## How the data works
- Admission records student details, an academic level (Matric, Inter, or BS), one matching class or BS course/semester selection, and one or more active subjects assigned to that selection. The fee preview lists each subject and configured monthly fee, then applies a fixed-amount or percentage concession and shows the net monthly amount.
- Admins manage subject assignments and monthly fees from the single **Subjects** page. Matric classes (9th/10th) and Inter classes (1st/2nd Year) are predefined; BS courses/programs and one of eight semesters are selected directly in subject forms. Subject management supports level/assignment filters, search, edit, deactivation, and deletion when there is no enrollment or payment history.
- Student records preserve the class, selected subject enrollments, each subject's configured fee, concession type/value/amount and net monthly fee. Editing admission details or selected subjects recalculates the fee and snapshots rate changes by billing month.
- Fees are billed per active subject enrollment and calendar month using the net subject fee after the allocated concession. Pending balance, payment status and receipts use this net due; payments retain their billing month, date, method, unique receipt number and unique reference. Removed enrollments remain inactive so their payment history is retained.
- Teacher assignments and individual monthly salary amounts are edited in Teacher Management. The Salaries page also shows every teacher's current subject-by-subject amounts and expected total, with ledger filters for year, month, teacher, subject, and payment status. The same subject can have different salary amounts for different teachers. Legacy assignments without an entered amount are clearly marked and skipped during salary generation until configured. Monthly records snapshot subject names and amounts, prevent duplicate teacher/month generation, preserve finalized history, and retain local partial-payment history and balances. Invalid amounts, duplicate subjects for one teacher, and payments above the remaining balance are rejected. Student subject fees are independent.
- Existing localStorage data is migrated on load. Clearly named legacy classes (including 11th/12th Class to 1st/2nd Year) are classified, BS course/semester details are retained, and ambiguous custom classes remain unassigned. Legacy student/enrollment fields are retained while linked payment records and billing months are preserved.
- Pending Fees provides a billing-month ledger, class/subject/status filters, payment entry, payment history, printable receipts and CSV export. A Demo Receipt previews full subject fees without applying a concession or creating a payment. An Original Receipt is generated only after a payment is saved; it records a unique receipt number plus student/fee snapshots, the concession, actual payment and remaining period balance. Original receipts can be reprinted from payment history without adding another transaction. Dashboard and reports count saved payments only.
- Attendance %: Present + Late count as attended, Leave is ignored, calculated from attendance records ("—" = no records yet).
- Enrollment counts and dashboard figures are calculated, never typed in. Subject capacity, class-to-subject matching, duplicate selection and concession bounds are validated before saving.
- Settings → Backup / Restore (JSON) and Reset demo data (admin only).

## ⚠️ Demo data note
Teacher data, salaries, payments, and permissions are demo-only and stored in localStorage. Browser storage is not a secure financial system and is scoped to the current browser and origin. Do not enter real personal data or use this demo as a production payroll system.
