import { db } from '$lib/server/db';
import { studSessions, studExamTerms} from '$lib/server/db/schema/marksheet';
import type { PageServerLoad } from './$types';
import { desc, asc } from 'drizzle-orm';
import { getSections, getClasses } from '../../students/students.remote';
import { getTabulationData } from './tabulation.remote';

export const load: PageServerLoad = async () => {
    const dbSessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
    const dbTerms = await db.select().from(studExamTerms).orderBy(asc(studExamTerms.id));

    const defaultSession = dbSessions.length > 0 ? dbSessions[0].id : 0;

    const dbClasses = defaultSession ? await getClasses(defaultSession) : [];
    const defaultTerm = dbTerms.length > 0 ? dbTerms[0].id : 0;
    const defaultClass = dbClasses.length > 0 ? dbClasses[0].id : 0;

    // Pre-fetch sections for default class
    const dbSectionsForClass = defaultClass
        ? await getSections(defaultClass)
        : [];
    const defaultSection = dbSectionsForClass.length > 0 ? dbSectionsForClass[0].id : 0;

    // Pre-fetch tabulation data for defaults
    let initialTabulationData: {
        subjects: { setupId: number; subjectId: number; subjectName: string; fullMark: number; passMark: number; sortIndex: number; }[];
        students: { seid: number; rollNo: number; studentName: string; transferDate: string | null; }[];
        marks: { sessionEnrollId: number; examSetupId: number; marksObtained: number; isPresent: boolean; }[];
    } = { subjects: [], students: [], marks: [] };
    if (defaultSession && defaultClass && defaultSection && defaultTerm) {
        initialTabulationData = await getTabulationData({
            sessionId: defaultSession,
            classId: defaultClass,
            sectionId: defaultSection,
            examTermId: defaultTerm
        });
    }

    return {
        sessions: dbSessions,
        examTerms: dbTerms,
        classes: dbClasses,
        initialSections: dbSectionsForClass,
        initialTabulationData,
        defaults: {
            session: defaultSession,
            term: defaultTerm,
            class: defaultClass,
            section: defaultSection
        }
    };
};
