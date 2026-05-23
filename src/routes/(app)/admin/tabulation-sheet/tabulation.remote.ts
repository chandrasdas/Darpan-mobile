import { query } from '$app/server';
import { db } from '$lib/server/db';
import {
	studExamSetups,
	studSubjects,
	studSessionEnrollments,
	studInfo,
	studMarksEntries
} from '$lib/server/db/schema/marksheet';
import { eq, and, asc, inArray } from 'drizzle-orm';
import * as v from 'valibot';

export const getTabulationData = query(
	v.object({
		sessionId: v.number(),
		classId: v.number(),
		sectionId: v.number(),
		examTermId: v.number()
	}),
	async (params) => {
		// 1. Get subjects configured for the marksheet for this class/session/term
		const subjects = await db
			.select({
				setupId: studExamSetups.setupId,
				subjectId: studExamSetups.subjectId,
				subjectName: studSubjects.name,
				fullMark: studExamSetups.fullMark,
				passMark: studExamSetups.passMark,
				sortIndex: studExamSetups.sortIndex
			})
			.from(studExamSetups)
			.innerJoin(studSubjects, eq(studExamSetups.subjectId, studSubjects.id))
			.where(
				and(
					eq(studExamSetups.sessionId, params.sessionId),
					eq(studExamSetups.classId, params.classId),
					eq(studExamSetups.examTermId, params.examTermId)
				)
			)
			.orderBy(asc(studExamSetups.sortIndex));

		const setupIds = subjects.map((s) => s.setupId);

		// 2. Get students in this session + section
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

		const enrollIds = students.map((s) => s.seid);

		// 3. Get all marks for these students and these subjects
		let marks: {
			sessionEnrollId: number;
			examSetupId: number;
			marksObtained: number;
			isPresent: boolean;
		}[] = [];
		if (setupIds.length > 0 && enrollIds.length > 0) {
			marks = await db
				.select({
					sessionEnrollId: studMarksEntries.sessionEnrollId,
					examSetupId: studMarksEntries.examSetupId,
					marksObtained: studMarksEntries.marksObtained,
					isPresent: studMarksEntries.isPresent
				})
				.from(studMarksEntries)
				.where(
					and(
						inArray(studMarksEntries.examSetupId, setupIds),
						inArray(studMarksEntries.sessionEnrollId, enrollIds)
					)
				);
		}

		return {
			subjects,
			students,
			marks
		};
	}
);
