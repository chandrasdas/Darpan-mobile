import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { studInfo, studSessionEnrollments, studSessions, studSections } from '$lib/server/db/schema/marksheet';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const sessions = await db.select().from(studSessions).orderBy(studSessions.year);
	const sections = await db.select().from(studSections).orderBy(studSections.id);

	return {
		sessions,
		sections
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
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
				const newStudent = await tx.insert(studInfo).values({
					name,
					fname,
					dob,
					caste,
					penNo,
					portalId,
					guardianNo,
					messageNo,
				}).returning({ sid: studInfo.sid });

				const sid = newStudent[0].sid;

				await tx.insert(studSessionEnrollments).values({
					studentId: sid,
					sessionId,
					sectionId,
					rollNo,
				});
			});

			return { success: true };
		} catch (e: unknown) {
			const errorStr = String(
				e instanceof Error ? (e as Error & { cause?: unknown }).cause || e.message : e
			);
			if (errorStr.includes('UNIQUE constraint failed')) {
				if (errorStr.includes('portal_id') && portalId) {
					// Fetch the existing student to show their details
					const existing = await db.select({
						portalId: studInfo.portalId,
						name: studInfo.name,
						fname: studInfo.fname,
						dob: studInfo.dob,
						guardianNo: studInfo.guardianNo,
					}).from(studInfo).where(eq(studInfo.portalId, portalId)).limit(1);

					return fail(400, {
						error: 'A student with this Portal ID already exists.',
						existingStudent: existing[0] ?? null,
					});
				} else if (errorStr.includes('pen_no')) {
					return fail(400, { error: 'A student with this PEN Number already exists.' });
				}
				return fail(400, { error: 'A unique constraint failed. Check Portal ID, PEN Number, or Roll Number.' });
			}
			
			// Only log unexpected errors
			console.error('Database error when adding student:', e);
			return fail(500, { error: 'Failed to save student details to the database.' });
		}
	}
};
