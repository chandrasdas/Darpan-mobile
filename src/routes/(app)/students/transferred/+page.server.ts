import { db } from '$lib/server/db';
import { studInfo, studSessionEnrollments, studClasses, studSections, studSessions } from '$lib/server/db/schema/marksheet';
import { eq, desc, and, or, like, isNull, isNotNull } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const searchQ = url.searchParams.get('searchQ') || '';
    const sidParam = url.searchParams.get('sid') || '';

    // Fetch the current active session (session with the latest year)
    const dbSessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
    const activeSession = dbSessions[0] || null;

    let sessionCondition = isNotNull(studInfo.transferDate) as any;
    if (activeSession) {
        sessionCondition = and(
            isNotNull(studInfo.transferDate),
            eq(studSessionEnrollments.sessionId, activeSession.id)
        );
    }

    // Load list of all transferred students for the current active session
    const transferredStudents = await db.select({
        sid: studInfo.sid,
        portalId: studInfo.portalId,
        name: studInfo.name,
        fname: studInfo.fname,
        dob: studInfo.dob,
        transferDate: studInfo.transferDate,
        penNo: studInfo.penNo,
        className: studClasses.name,
        sectionLetter: studSections.letter,
        rollNo: studSessionEnrollments.rollNo
    })
    .from(studInfo)
    .leftJoin(studSessionEnrollments, eq(studInfo.sid, studSessionEnrollments.studentId))
    .leftJoin(studSections, eq(studSessionEnrollments.sectionId, studSections.id))
    .leftJoin(studClasses, eq(studSections.classId, studClasses.id))
    .where(sessionCondition)
    .groupBy(studInfo.sid)
    .orderBy(desc(studInfo.transferDate));

    // Handle preselected student if passed as parameter, ensuring they belong to the active session
    let selectedStudent = null;
    if (sidParam) {
        const sid = parseInt(sidParam);
        if (!isNaN(sid)) {
            const conditions = [
                eq(studInfo.sid, sid),
                isNull(studInfo.transferDate)
            ];
            if (activeSession) {
                conditions.push(eq(studSessionEnrollments.sessionId, activeSession.id));
            }

            const [student] = await db.select({
                sid: studInfo.sid,
                portalId: studInfo.portalId,
                name: studInfo.name,
                fname: studInfo.fname,
                dob: studInfo.dob,
                className: studClasses.name,
                sectionLetter: studSections.letter,
                rollNo: studSessionEnrollments.rollNo
            })
            .from(studInfo)
            .leftJoin(studSessionEnrollments, eq(studInfo.sid, studSessionEnrollments.studentId))
            .leftJoin(studSections, eq(studSessionEnrollments.sectionId, studSections.id))
            .leftJoin(studClasses, eq(studSections.classId, studClasses.id))
            .where(and(...conditions))
            .groupBy(studInfo.sid);

            if (student) {
                selectedStudent = student;
            }
        }
    }

    // Handle search for active students, restricted to the current active session
    let searchResults: any[] = [];
    if (searchQ && searchQ.trim().length >= 2) {
        const searchConditions = [
            isNull(studInfo.transferDate),
            or(
                like(studInfo.name, `%${searchQ}%`),
                like(studInfo.portalId, `%${searchQ}%`)
            )
        ];
        if (activeSession) {
            searchConditions.push(eq(studSessionEnrollments.sessionId, activeSession.id));
        }

        searchResults = await db.select({
            sid: studInfo.sid,
            name: studInfo.name,
            portalId: studInfo.portalId,
            fname: studInfo.fname,
            className: studClasses.name,
            sectionLetter: studSections.letter,
            rollNo: studSessionEnrollments.rollNo
        })
        .from(studInfo)
        .leftJoin(studSessionEnrollments, eq(studInfo.sid, studSessionEnrollments.studentId))
        .leftJoin(studSections, eq(studSessionEnrollments.sectionId, studSections.id))
        .leftJoin(studClasses, eq(studSections.classId, studClasses.id))
        .where(and(...searchConditions))
        .groupBy(studInfo.sid)
        .limit(10);
    }

    return {
        transferredStudents,
        selectedStudent,
        searchResults,
        searchQ
    };
};

export const actions: Actions = {
    transfer: async ({ request }) => {
        const data = await request.formData();
        const sid = parseInt(data.get('sid')?.toString() || '');
        const transferDate = data.get('transferDate')?.toString() || '';

        if (isNaN(sid) || !transferDate) {
            return fail(400, { error: 'Student ID and Transfer Date are required.' });
        }

        const [student] = await db.select().from(studInfo).where(eq(studInfo.sid, sid));
        if (!student) {
            return fail(404, { error: 'Student not found.' });
        }

        // Validate that the student is enrolled in the current active session
        const dbSessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));
        const activeSession = dbSessions[0];
        if (activeSession) {
            const [enrollment] = await db.select()
                .from(studSessionEnrollments)
                .where(and(
                    eq(studSessionEnrollments.studentId, sid),
                    eq(studSessionEnrollments.sessionId, activeSession.id)
                ));
            if (!enrollment) {
                return fail(400, { error: 'Cannot transfer a student who is not enrolled in the current active session.' });
            }
        }

        await db.update(studInfo)
            .set({ transferDate })
            .where(eq(studInfo.sid, sid));

        return { success: true };
    },
    cancelTransfer: async ({ request }) => {
        const data = await request.formData();
        const sid = parseInt(data.get('sid')?.toString() || '');

        if (isNaN(sid)) {
            return fail(400, { error: 'Student ID is required.' });
        }

        await db.update(studInfo)
            .set({ transferDate: null })
            .where(eq(studInfo.sid, sid));

        return { success: true };
    }
};
