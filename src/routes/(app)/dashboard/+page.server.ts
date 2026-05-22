import { db } from '$lib/server/db';
import { studSessions, studSessionEnrollments } from '$lib/server/db/schema/marksheet';
import { desc, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [currentSession] = await db
		.select()
		.from(studSessions)
		.orderBy(desc(studSessions.year))
		.limit(1);

	let totalStudents = 0;
	if (currentSession) {
		const [countResult] = await db
			.select({ count: sql<number>`count(${studSessionEnrollments.studentId})` })
			.from(studSessionEnrollments)
			.where(eq(studSessionEnrollments.sessionId, currentSession.id));

		totalStudents = countResult?.count ?? 0;
	}

	return {
		totalStudents
	};
};

