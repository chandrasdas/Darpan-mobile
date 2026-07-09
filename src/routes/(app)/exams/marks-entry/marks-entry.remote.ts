import { query } from '$app/server';
import { requireRoleRemote } from '$lib/server/auth-utils';
import { db } from '$lib/server/db';
import {
	studExamSetups,
	studSubjects,
	studSessionEnrollments,
	studInfo,
	studMarksEntries
} from '$lib/server/db/schema/marksheet';
import { eq, and, asc, sql, gt } from 'drizzle-orm';
import * as v from 'valibot';

/**
 * Fetches subjects that have been configured in exam setups
 * for a given session + class + exam term combination.
 */
export const getSubjectsForExam = query(
	v.object({
		sessionId: v.number(),
		classId: v.number(),
		examTermId: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin', 'teacher');
		const results = await db
			.select({
				setupId: studExamSetups.setupId,
				subjectId: studExamSetups.subjectId,
				subjectName: studSubjects.name,
				subjectCode: studSubjects.code, //code is not required
				fullMark: studExamSetups.fullMark,
				passMark: studExamSetups.passMark
			})
			.from(studExamSetups)
			.innerJoin(studSubjects, eq(studExamSetups.subjectId, studSubjects.id))
			.where(
				and(
					eq(studExamSetups.sessionId, params.sessionId),
					eq(studExamSetups.classId, params.classId),
					eq(studExamSetups.examTermId, params.examTermId),
					gt(studExamSetups.fullMark, 0)
				)
			)
			.orderBy(asc(studExamSetups.sortIndex));

		return results;
	}
);

/**
 * Fetches all enrolled students for a given session + section,
 * and left-joins their marks for the selected exam setup.
 */
export const getStudentsForMarks = query(
	v.object({
		sessionId: v.number(),
		sectionId: v.number(),
		examSetupId: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin', 'teacher');
		const results = await db
			.select({
				seid: studSessionEnrollments.seid,
				rollNo: studSessionEnrollments.rollNo,
				studentName: studInfo.name,
				transferDate: studInfo.transferDate,
				mid: studMarksEntries.mid,
				isPresent: studMarksEntries.isPresent,
				marksObtained: studMarksEntries.marksObtained
			})
			.from(studSessionEnrollments)
			.innerJoin(studInfo, eq(studSessionEnrollments.studentId, studInfo.sid))
			.leftJoin(
				studMarksEntries,
				and(
					eq(studMarksEntries.sessionEnrollId, studSessionEnrollments.seid),
					eq(studMarksEntries.examSetupId, params.examSetupId)
				)
			)
			.where(
				and(
					eq(studSessionEnrollments.sessionId, params.sessionId),
					eq(studSessionEnrollments.sectionId, params.sectionId)
				)
			)
			.orderBy(asc(studSessionEnrollments.rollNo));

		return results;
	}
);

/**
 * Upserts a single mark entry.
 * Uses INSERT ... ON CONFLICT ... DO UPDATE for atomic save.
 */
export const saveSingleMark = query(
	v.object({
		sessionEnrollId: v.number(),
		examSetupId: v.number(),
		marksObtained: v.number(),
		isPresent: v.boolean()
	}),
	async (params) => {
		requireRoleRemote('admin', 'teacher');
		await db
			.insert(studMarksEntries)
			.values({
				sessionEnrollId: params.sessionEnrollId,
				examSetupId: params.examSetupId,
				marksObtained: params.marksObtained,
				isPresent: params.isPresent
			})
			.onConflictDoUpdate({
				target: [studMarksEntries.sessionEnrollId, studMarksEntries.examSetupId],
				set: {
					marksObtained: params.marksObtained,
					isPresent: params.isPresent,
					updatedAt: sql`(unixepoch())`
				}
			});

		return { success: true };
	}
);
