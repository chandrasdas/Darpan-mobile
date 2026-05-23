import { db } from '$lib/server/db';
import {
	studInfo,
	studSessionEnrollments,
	studClasses,
	studSections,
	studSessions
} from '$lib/server/db/schema/marksheet';
import { eq, desc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const studentId = parseInt(params.sid);

	if (isNaN(studentId)) {
		error(400, 'Invalid student ID');
	}

	// Fetch student info
	const [student] = await db.select().from(studInfo).where(eq(studInfo.sid, studentId));

	if (!student) {
		error(404, 'Student not found');
	}

	// Verify the student is marked as transferred
	if (!student.transferDate) {
		error(400, 'Student has not been marked as transferred yet.');
	}

	// Fetch the most recent enrollment
	const [enrollment] = await db
		.select({
			rollNo: studSessionEnrollments.rollNo,
			className: studClasses.name,
			sectionLetter: studSections.letter,
			sessionName: studSessions.name,
			sessionYear: studSessions.year
		})
		.from(studSessionEnrollments)
		.innerJoin(studSessions, eq(studSessionEnrollments.sessionId, studSessions.id))
		.innerJoin(studSections, eq(studSessionEnrollments.sectionId, studSections.id))
		.innerJoin(studClasses, eq(studSections.classId, studClasses.id))
		.where(eq(studSessionEnrollments.studentId, studentId))
		.orderBy(desc(studSessions.year))
		.limit(1);

	return {
		student,
		enrollment: enrollment || null
	};
};
