import { query } from '$app/server';
import { requireRoleRemote } from '$lib/server/auth-utils';
import { db } from '$lib/server/db';
import { studAttendancePeriods, studAttendanceEntries } from '$lib/server/db/schema/attendance';
import { studSessionEnrollments, studInfo } from '$lib/server/db/schema/marksheet';
import { eq, and, asc, inArray } from 'drizzle-orm';
import * as v from 'valibot';

/**
 * Fetches attendance periods configured for a given session + section + term.
 */
export const getPeriodsForSection = query(
	v.object({
		sessionId: v.number(),
		sectionId: v.number(),
		examTermId: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin', 'teacher');
		const results = await db
			.select({
				periodId: studAttendancePeriods.id,
				periodName: studAttendancePeriods.periodName,
				totalWorkingDays: studAttendancePeriods.totalWorkingDays
			})
			.from(studAttendancePeriods)
			.where(
				and(
					eq(studAttendancePeriods.sessionId, params.sessionId),
					eq(studAttendancePeriods.sectionId, params.sectionId),
					eq(studAttendancePeriods.examTermId, params.examTermId)
				)
			)
			.orderBy(asc(studAttendancePeriods.sortIndex));
		return results;
	}
);

/**
 * Fetches all enrolled students for a given session + section,
 * and their attendance entries for all periods in the given term.
 */
export const getStudentsForAttendance = query(
	v.object({
		sessionId: v.number(),
		sectionId: v.number(),
		examTermId: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin', 'teacher');
		const students = await db
			.select({
				seid: studSessionEnrollments.seid,
				rollNo: studSessionEnrollments.rollNo,
				studentName: studInfo.name,
				transferDate: studInfo.transferDate
			})
			.from(studSessionEnrollments)
			.innerJoin(studInfo, eq(studSessionEnrollments.studentId, studInfo.sid))
			.where(
				and(
					eq(studSessionEnrollments.sessionId, params.sessionId),
					eq(studSessionEnrollments.sectionId, params.sectionId)
				)
			)
			.orderBy(asc(studSessionEnrollments.rollNo));

		const periods = await db
			.select({ id: studAttendancePeriods.id })
			.from(studAttendancePeriods)
			.where(
				and(
					eq(studAttendancePeriods.sessionId, params.sessionId),
					eq(studAttendancePeriods.sectionId, params.sectionId),
					eq(studAttendancePeriods.examTermId, params.examTermId)
				)
			);

		const periodIds = periods.map((p) => p.id);

		let entries: { sessionEnrollId: number; periodId: number; daysPresent: number }[] = [];
		if (students.length > 0 && periodIds.length > 0) {
			const seids = students.map((s) => s.seid);
			entries = await db
				.select({
					sessionEnrollId: studAttendanceEntries.sessionEnrollId,
					periodId: studAttendanceEntries.periodId,
					daysPresent: studAttendanceEntries.daysPresent
				})
				.from(studAttendanceEntries)
				.where(
					and(
						inArray(studAttendanceEntries.sessionEnrollId, seids),
						inArray(studAttendanceEntries.periodId, periodIds)
					)
				);
		}

		return students.map((student) => {
			const studentEntries = entries.filter((e) => e.sessionEnrollId === student.seid);
			const attendanceMap: Record<number, number> = {};
			for (const e of studentEntries) {
				attendanceMap[e.periodId] = e.daysPresent;
			}
			return {
				...student,
				attendance: attendanceMap
			};
		});
	}
);

/**
 * Upserts a single attendance entry.
 */
export const saveSingleAttendance = query(
	v.object({
		sessionEnrollId: v.number(),
		periodId: v.number(),
		daysPresent: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin', 'teacher');
		await db
			.insert(studAttendanceEntries)
			.values({
				sessionEnrollId: params.sessionEnrollId,
				periodId: params.periodId,
				daysPresent: params.daysPresent
			})
			.onConflictDoUpdate({
				target: [studAttendanceEntries.sessionEnrollId, studAttendanceEntries.periodId],
				set: {
					daysPresent: params.daysPresent
				}
			});
		return { success: true };
	}
);
