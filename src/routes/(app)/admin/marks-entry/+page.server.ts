import { db } from '$lib/server/db';
import { studSessions, studExamTerms } from '$lib/server/db/schema/marksheet';
import type { PageServerLoad } from './$types';
import { desc, asc } from 'drizzle-orm';
import { getSections, getClasses } from '../../students/students.remote';
import { getSubjectsForExam, getStudentsForMarks } from './marks-entry.remote';

export const load: PageServerLoad = async () => {
	const dbSessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
	const dbTerms = await db.select().from(studExamTerms).orderBy(asc(studExamTerms.id));

	// Resolve defaults as numbers
	const defaultSession = dbSessions.length > 0 ? dbSessions[0].id : 0;

	const dbClasses = defaultSession ? await getClasses(defaultSession) : [];
	const defaultTerm = dbTerms.length > 0 ? dbTerms[0].id : 0;
	const defaultClass = dbClasses.length > 0 ? dbClasses[0].id : 0;

	// Pre-fetch sections for default class
	const dbSectionsForClass = defaultClass ? await getSections(defaultClass) : [];
	const defaultSection = dbSectionsForClass.length > 0 ? dbSectionsForClass[0].id : 0;

	// Pre-fetch subjects for default session + term + class
	const dbSubjectsForExam =
		defaultSession && defaultTerm && defaultClass
			? await getSubjectsForExam({
					sessionId: defaultSession,
					classId: defaultClass,
					examTermId: defaultTerm
				})
			: [];
	const defaultSubject = dbSubjectsForExam.length > 0 ? dbSubjectsForExam[0].setupId : 0;

	// Pre-fetch students for default session + section + subject
	const dbStudents =
		defaultSession && defaultSection && defaultSubject
			? await getStudentsForMarks({
					sessionId: defaultSession,
					sectionId: defaultSection,
					examSetupId: defaultSubject
				})
			: [];

	return {
		sessions: dbSessions,
		examTerms: dbTerms,
		classes: dbClasses,
		initialSections: dbSectionsForClass,
		initialSubjects: dbSubjectsForExam,
		initialStudents: dbStudents,
		defaults: {
			session: defaultSession,
			term: defaultTerm,
			class: defaultClass,
			section: defaultSection,
			subject: defaultSubject
		}
	};
};
