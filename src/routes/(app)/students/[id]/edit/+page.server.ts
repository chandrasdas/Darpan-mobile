import { error, fail, redirect } from '@sveltejs/kit';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { studInfo, studSessionEnrollments, studSessions, studSections } from '$lib/server/db/schema/marksheet';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const studentId = parseInt(params.id);

	if (isNaN(studentId)) {
		error(400, 'Invalid student ID');
	}

	// Fetch student info
	const [student] = await db.select().from(studInfo).where(eq(studInfo.sid, studentId));

	if (!student) {
		error(404, 'Student not found');
	}

	// Fetch the most recent enrollment
	const [enrollment] = await db
		.select({
			sessionId: studSessionEnrollments.sessionId,
			sectionId: studSessionEnrollments.sectionId,
			rollNo: studSessionEnrollments.rollNo
		})
		.from(studSessionEnrollments)
		.innerJoin(studSessions, eq(studSessionEnrollments.sessionId, studSessions.id))
		.where(eq(studSessionEnrollments.studentId, studentId))
		.orderBy(desc(studSessions.year))
		.limit(1);

	// Load sessions and sections for select dropdowns
	const sessions = await db.select().from(studSessions).orderBy(studSessions.year);
	const sections = await db.select().from(studSections).orderBy(studSections.id);

	return {
		student,
		enrollment: enrollment || null,
		sessions,
		sections
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const studentId = parseInt(params.id);
		if (isNaN(studentId)) {
			return fail(400, { error: 'Invalid student ID.' });
		}

		const data = await request.formData();
		
		const name = data.get('name')?.toString();
		const fname = data.get('fname')?.toString();
		const dob = data.get('dob')?.toString();
		const caste = data.get('caste')?.toString();
		const penNo = data.get('penNo')?.toString() ? parseInt(data.get('penNo') as string) : null;
		const portalId = data.get('portalId')?.toString();
		
		const guardianNo = parseInt(data.get('guardianNo') as string);
		const messageNo = parseInt(data.get('messageNo') as string);
		
		const sessionId = parseInt(data.get('sessionId') as string);
		const sectionId = parseInt(data.get('sectionId') as string);
		const rollNo = parseInt(data.get('rollNo') as string);

		if (!name || !fname || !dob || !caste || !portalId || isNaN(guardianNo) || isNaN(messageNo) || isNaN(sessionId) || isNaN(sectionId) || isNaN(rollNo)) {
			return fail(400, { error: 'Please fill out all required fields.' });
		}

		try {
			await db.transaction(async (tx) => {
				// 1. Update personal details
				await tx.update(studInfo).set({
					name,
					fname,
					dob,
					caste,
					penNo,
					portalId,
					guardianNo,
					messageNo,
				}).where(eq(studInfo.sid, studentId));

				// 2. Update enrollment details
				const existingEnrollment = await tx
					.select()
					.from(studSessionEnrollments)
					.where(
						and(
							eq(studSessionEnrollments.studentId, studentId),
							eq(studSessionEnrollments.sessionId, sessionId)
						)
					)
					.limit(1);

				if (existingEnrollment.length > 0) {
					// Update existing enrollment record for this session
					await tx
						.update(studSessionEnrollments)
						.set({ sectionId, rollNo })
						.where(eq(studSessionEnrollments.seid, existingEnrollment[0].seid));
				} else {
					// Update most recent session enrollment or insert new if none exists
					const [mostRecent] = await tx
						.select()
						.from(studSessionEnrollments)
						.where(eq(studSessionEnrollments.studentId, studentId))
						.orderBy(desc(studSessionEnrollments.sessionId))
						.limit(1);

					if (mostRecent) {
						await tx
							.update(studSessionEnrollments)
							.set({ sessionId, sectionId, rollNo })
							.where(eq(studSessionEnrollments.seid, mostRecent.seid));
					} else {
						await tx.insert(studSessionEnrollments).values({
							studentId,
							sessionId,
							sectionId,
							rollNo
						});
					}
				}
			});
		} catch (e: unknown) {
			const errorStr = String(
				e instanceof Error ? (e as Error & { cause?: unknown }).cause || e.message : e
			);
			if (errorStr.includes('UNIQUE constraint failed')) {
				if (errorStr.includes('portal_id')) {
					return fail(400, { error: 'A student with this Portal ID already exists.' });
				} else if (errorStr.includes('pen_no')) {
					return fail(400, { error: 'A student with this PEN Number already exists.' });
				} else if (errorStr.includes('uq_class_roll')) {
					return fail(400, { error: 'Roll number already assigned to another student in this class & section.' });
				}
				return fail(400, { error: 'A unique constraint failed. Check Portal ID, PEN Number, or Roll Number.' });
			}
			console.error('Database error when updating student:', e);
			return fail(500, { error: 'Failed to update student details.' });
		}

		// Redirect on success to the student details page
		throw redirect(303, `/students/${studentId}`);
	}
};
