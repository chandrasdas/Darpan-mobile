import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { studExamTerms, studSections, studSessionEnrollments, studSessions } from "./marksheet";

// --- Attendance Columns / Periods Configuration ---
export const studAttendancePeriods = sqliteTable('stud_attendance_periods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => studSessions.id, { onDelete: 'cascade' }),
  sectionId: integer('section_id').notNull().references(() => studSections.id, { onDelete: 'cascade' }),
  examTermId: integer('exam_term_id').notNull().references(() => studExamTerms.id, { onDelete: 'cascade' }),
  
  // Custom names handle splits easily: "January", "April (Term 1)", "April (Term 2)"
  periodName: text('period_name', { length: 30 }).notNull(),
  totalWorkingDays: integer('total_working_days').notNull().default(0),
  sortIndex: integer('sort_index').notNull().default(0), 
}, (table) => [
  // Prevents creating duplicate months for the same section in a single session
  unique('uq_section_period').on(table.sessionId, table.sectionId, table.periodName),
]);

// --- Student Period-wise Attendance Records ---
export const studAttendanceEntries = sqliteTable('stud_attendance_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionEnrollId: integer('session_enroll_id').notNull().references(() => studSessionEnrollments.seid, { onDelete: 'cascade' }),
  periodId: integer('period_id').notNull().references(() => studAttendancePeriods.id, { onDelete: 'cascade' }),
  
  daysPresent: integer('days_present').notNull().default(0),
}, (table) => [
  // Safeguard: A student can only have ONE entry for a specific attendance period
  unique('uq_student_period_config').on(table.sessionEnrollId, table.periodId),
]);
