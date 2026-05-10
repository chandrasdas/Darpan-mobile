import { db } from '$lib/server/db';
import { studSessions, studClasses } from '$lib/server/db/schema/marksheet';
import type { PageServerLoad } from './$types';
import { desc, asc } from 'drizzle-orm';
import { getSections, getClasses } from '../../students/students.remote';
import { getStudentsList, getMarksheetData } from './marksheet.remote';

export const load: PageServerLoad = async () => {
    const dbSessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
    
    const defaultSession = dbSessions.length > 0 ? dbSessions[0].id : 0;
    const dbClasses = defaultSession ? await getClasses(defaultSession) : [];
    const defaultClass = dbClasses.length > 0 ? dbClasses[0].id : 0;

    const dbSectionsForClass = defaultClass
        ? await getSections(defaultClass)
        : [];
    const defaultSection = dbSectionsForClass.length > 0 ? dbSectionsForClass[0].id : 0;

    const initialStudents = (defaultSession && defaultSection) 
        ? await getStudentsList({ sessionId: defaultSession, sectionId: defaultSection })
        : [];

    const defaultEnrollId = initialStudents.length > 0 ? initialStudents[0].seid : 0;

    let initialMarksheetData: {
        setups: { setupId: number; examTermId: number; termName: string; subjectId: number; subjectName: string; fullMark: number; passMark: number; sortIndex: number; }[];
        marks: { examSetupId: number; marksObtained: number; isPresent: boolean; }[];
    } = { setups: [], marks: [] };

    if (defaultSession && defaultClass && defaultEnrollId) {
        initialMarksheetData = await getMarksheetData({
            sessionId: defaultSession,
            classId: defaultClass,
            sessionEnrollId: defaultEnrollId
        });
    }

    return {
        sessions: dbSessions,
        classes: dbClasses,
        initialSections: dbSectionsForClass,
        initialStudents,
        initialMarksheetData,
        defaults: {
            session: defaultSession,
            class: defaultClass,
            section: defaultSection,
            enrollId: defaultEnrollId
        }
    };
};
