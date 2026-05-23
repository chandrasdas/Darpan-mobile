import { db } from '$lib/server/db';
import { studSessions, studExamTerms, studSubjects } from '$lib/server/db/schema/marksheet';
import type { PageServerLoad } from './$types';
import { desc, asc } from 'drizzle-orm';
import { getClasses } from '../../students/students.remote';
import { getExistingSetups } from './setup.remote';

export const load: PageServerLoad = async () => {
	// Fetch base data for dropdowns
	const dbSessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
	const dbTerms = await db.select().from(studExamTerms).orderBy(asc(studExamTerms.id));

	// Fetch all subjects for the table
	const dbSubjects = await db.select().from(studSubjects).orderBy(asc(studSubjects.id));

	// Resolve defaults as numbers
	const defaultSession = dbSessions.length > 0 ? dbSessions[0].id : 0;
	const defaultTerm = dbTerms.length > 0 ? dbTerms[0].id : 0;

	// Fetch classes dynamically for the default session
	const dbClasses = await getClasses(defaultSession);
	const defaultClass = dbClasses.length > 0 ? dbClasses[0].id : 0;

	// Pre-fetch initial exam setups for the default filters
	let initialSetups: Awaited<ReturnType<typeof getExistingSetups>> = [];
	if (defaultSession && defaultTerm && defaultClass) {
		initialSetups = await getExistingSetups({
			sessionId: defaultSession,
			examTermId: defaultTerm,
			classId: defaultClass
		});
	}

	return {
		sessions: dbSessions,
		examTerms: dbTerms,
		classes: dbClasses,
		subjects: dbSubjects,
		initialSetups,
		defaults: {
			session: defaultSession,
			term: defaultTerm,
			class: defaultClass
		}
	};
};
