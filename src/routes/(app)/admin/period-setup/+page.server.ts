import { db } from '$lib/server/db';
import { studSessions, studExamTerms } from '$lib/server/db/schema/marksheet';
import type { PageServerLoad } from './$types';
import { desc, asc } from 'drizzle-orm';
import { getSections, getClasses } from '../../students/students.remote';
import { getExistingPeriods } from './period-setup.remote';

export const load: PageServerLoad = async () => {
    const dbSessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
    const dbTerms = await db.select().from(studExamTerms).orderBy(asc(studExamTerms.id));
    
    // Resolve defaults as numbers
    const defaultSession = dbSessions.length > 0 ? dbSessions[0].id : 0;
    const defaultTerm = dbTerms.length > 0 ? dbTerms[0].id : 0;
    
    // Fetch classes dynamically for the default session
    const dbClasses = defaultSession ? await getClasses(defaultSession) : [];
    const defaultClass = dbClasses.length > 0 ? dbClasses[0].id : 0;

    // Pre-fetch sections for default class
    const dbSections = defaultClass ? await getSections(defaultClass) : [];
    const defaultSection = dbSections.length > 0 ? dbSections[0].id : 0;

    // Pre-fetch initial period setups for the default filters
    let initialPeriods: Awaited<ReturnType<typeof getExistingPeriods>> = [];
    if (defaultSession && defaultTerm && defaultSection) {
        initialPeriods = await getExistingPeriods({
            sessionId: defaultSession,
            examTermId: defaultTerm,
            sectionId: defaultSection
        });
    }

    return {
        sessions: dbSessions,
        examTerms: dbTerms,
        classes: dbClasses,
        initialSections: dbSections,
        initialPeriods,
        defaults: {
            session: defaultSession,
            term: defaultTerm,
            class: defaultClass,
            section: defaultSection
        }
    };
};
