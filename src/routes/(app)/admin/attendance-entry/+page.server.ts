import { db } from '$lib/server/db';
import { studSessions, studExamTerms } from '$lib/server/db/schema/marksheet';
import type { PageServerLoad } from './$types';
import { desc, asc } from 'drizzle-orm';
import { getSections, getClasses } from '../../students/students.remote';
import { getPeriodsForSection, getStudentsForAttendance } from './attendance-entry.remote';

export const load: PageServerLoad = async () => {
    const dbSessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
    const dbTerms = await db.select().from(studExamTerms).orderBy(asc(studExamTerms.id));
    
    const defaultSession = dbSessions.length > 0 ? dbSessions[0].id : 0;
    const defaultTerm = dbTerms.length > 0 ? dbTerms[0].id : 0;

    const dbClasses = defaultSession ? await getClasses(defaultSession) : [];
    const defaultClass = dbClasses.length > 0 ? dbClasses[0].id : 0;

    const dbSections = defaultClass ? await getSections(defaultClass) : [];
    const defaultSection = dbSections.length > 0 ? dbSections[0].id : 0;

    // Pre-fetch periods for default session + section + term
    const dbPeriods = (defaultSession && defaultTerm && defaultSection)
        ? await getPeriodsForSection({
            sessionId: defaultSession,
            sectionId: defaultSection,
            examTermId: defaultTerm
        })
        : [];
    const defaultPeriod = dbPeriods.length > 0 ? dbPeriods[0].periodId : 0;

    // Pre-fetch students for default session + section + term
    const dbStudents = (defaultSession && defaultSection && defaultTerm)
        ? await getStudentsForAttendance({
            sessionId: defaultSession,
            sectionId: defaultSection,
            examTermId: defaultTerm
        })
        : [];

    return {
        sessions: dbSessions,
        examTerms: dbTerms,
        classes: dbClasses,
        initialSections: dbSections,
        initialPeriods: dbPeriods,
        initialStudents: dbStudents,
        defaults: {
            session: defaultSession,
            term: defaultTerm,
            class: defaultClass,
            section: defaultSection,
            period: defaultPeriod
        }
    };
};
