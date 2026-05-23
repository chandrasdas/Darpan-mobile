import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { studMarksEntries } from '$lib/server/db/schema/marksheet';
import { sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const { entries } = (await request.json()) as {
		entries: {
			sessionEnrollId: number;
			examSetupId: number;
			marksObtained: number;
			isPresent: boolean;
		}[];
	};

	if (!entries || !Array.isArray(entries) || entries.length === 0) {
		return json({ error: 'No entries provided' }, { status: 400 });
	}

	await db.transaction(async (tx) => {
		for (const entry of entries) {
			await tx
				.insert(studMarksEntries)
				.values({
					sessionEnrollId: entry.sessionEnrollId,
					examSetupId: entry.examSetupId,
					marksObtained: entry.marksObtained,
					isPresent: entry.isPresent
				})
				.onConflictDoUpdate({
					target: [studMarksEntries.sessionEnrollId, studMarksEntries.examSetupId],
					set: {
						marksObtained: entry.marksObtained,
						isPresent: entry.isPresent,
						updatedAt: sql`(unixepoch())`
					}
				});
		}
	});

	return json({ inserted: entries.length });
};
