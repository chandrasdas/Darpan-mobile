import { query } from '$app/server';
import { requireRoleRemote } from '$lib/server/auth-utils';
import { db } from '$lib/server/db';
import {
	studSections,
	studExamSetups,
	studSessionEnrollments,
	studInfo
} from '$lib/server/db/schema/marksheet';
import { eq, and, asc, inArray } from 'drizzle-orm';
import * as v from 'valibot';

/**
 * Fetches sections, exam setups, and enrollments for a given session + class.
 * This provides all the DB context needed to match Excel data to DB rows.
 */
export const getImportContext = query(
	v.object({
		sessionId: v.number(),
		classId: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin');
		const sections = await db
			.select()
			.from(studSections)
			.where(eq(studSections.classId, params.classId))
			.orderBy(asc(studSections.id));

		const examSetups = await db
			.select({
				setupId: studExamSetups.setupId,
				examTermId: studExamSetups.examTermId,
				subjectId: studExamSetups.subjectId,
				fullMark: studExamSetups.fullMark,
				passMark: studExamSetups.passMark
			})
			.from(studExamSetups)
			.where(
				and(
					eq(studExamSetups.sessionId, params.sessionId),
					eq(studExamSetups.classId, params.classId)
				)
			);

		const sectionIds = sections.map((s) => s.id);
		let enrollments: {
			seid: number;
			rollNo: number;
			sectionId: number;
			studentName: string;
		}[] = [];

		if (sectionIds.length > 0) {
			enrollments = await db
				.select({
					seid: studSessionEnrollments.seid,
					rollNo: studSessionEnrollments.rollNo,
					sectionId: studSessionEnrollments.sectionId,
					studentName: studInfo.name
				})
				.from(studSessionEnrollments)
				.innerJoin(studInfo, eq(studSessionEnrollments.studentId, studInfo.sid))
				.where(
					and(
						eq(studSessionEnrollments.sessionId, params.sessionId),
						inArray(studSessionEnrollments.sectionId, sectionIds)
					)
				)
				.orderBy(asc(studSessionEnrollments.rollNo));
		}

		return { sections, examSetups, enrollments };
	}
);
