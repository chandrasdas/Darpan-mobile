import { db } from '$lib/server/db';
import { studSessions, studClasses, studSubjects, studExamTerms } from '$lib/server/db/schema/marksheet';
import type { PageServerLoad } from './$types';
import { desc, asc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const sessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
	const classes = await db.select().from(studClasses).orderBy(asc(studClasses.id));
	const subjects = await db.select().from(studSubjects).orderBy(asc(studSubjects.id));
	const examTerms = await db.select().from(studExamTerms).orderBy(asc(studExamTerms.id));

	return { sessions, classes, subjects, examTerms };
};
