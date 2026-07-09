import { query } from '$app/server';
import { requireRoleRemote } from '$lib/server/auth-utils';
import { db } from '$lib/server/db';
import {
	studExamSetups,
	studSubjects,
	studSessionEnrollments,
	studInfo,
	studMarksEntries,
	studExamTerms
} from '$lib/server/db/schema/marksheet';
import { eq, and, asc, inArray } from 'drizzle-orm';
import * as v from 'valibot';

export const getStudentsList = query(
	v.object({
		sessionId: v.number(),
		sectionId: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin');
		return await db
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
	}
);

export const getMarksheetData = query(
	v.object({
		sessionId: v.number(),
		classId: v.number(),
		sessionEnrollId: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin');
		const setups = await db
			.select({
				setupId: studExamSetups.setupId,
				examTermId: studExamSetups.examTermId,
				termName: studExamTerms.name,
				subjectId: studExamSetups.subjectId,
				subjectName: studSubjects.name,
				fullMark: studExamSetups.fullMark,
				passMark: studExamSetups.passMark,
				sortIndex: studExamSetups.sortIndex
			})
			.from(studExamSetups)
			.innerJoin(studSubjects, eq(studExamSetups.subjectId, studSubjects.id))
			.innerJoin(studExamTerms, eq(studExamSetups.examTermId, studExamTerms.id))
			.where(
				and(
					eq(studExamSetups.sessionId, params.sessionId),
					eq(studExamSetups.classId, params.classId)
				)
			)
			.orderBy(asc(studExamTerms.id), asc(studExamSetups.sortIndex));

		const setupIds = setups.map((s) => s.setupId);

		let marks: {
			examSetupId: number;
			marksObtained: number;
			isPresent: boolean;
		}[] = [];

		if (setupIds.length > 0) {
			marks = await db
				.select({
					examSetupId: studMarksEntries.examSetupId,
					marksObtained: studMarksEntries.marksObtained,
					isPresent: studMarksEntries.isPresent
				})
				.from(studMarksEntries)
				.where(
					and(
						inArray(studMarksEntries.examSetupId, setupIds),
						eq(studMarksEntries.sessionEnrollId, params.sessionEnrollId)
					)
				);
		}

		return { setups, marks };
	}
);
