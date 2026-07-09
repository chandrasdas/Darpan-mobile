import { query } from '$app/server';
import { requireRoleRemote } from '$lib/server/auth-utils';
import { db } from '$lib/server/db';
import { studExamSetups } from '$lib/server/db/schema/marksheet';
import { eq, and, notInArray, sql } from 'drizzle-orm';
import * as v from 'valibot';

export const getExistingSetups = query(
	v.object({
		sessionId: v.number(),
		examTermId: v.number(),
		classId: v.number()
	}),
	async (params) => {
		requireRoleRemote('admin');
		const setups = await db
			.select()
			.from(studExamSetups)
			.where(
				and(
					eq(studExamSetups.sessionId, params.sessionId),
					eq(studExamSetups.examTermId, params.examTermId),
					eq(studExamSetups.classId, params.classId)
				)
			);
		return setups;
	}
);

const saveExamSetupsSchema = v.object({
	sessionId: v.number(),
	examTermId: v.number(),
	classId: v.number(),
	setups: v.array(
		v.object({
			subjectId: v.number(),
			fullMark: v.union([v.number(), v.null()]),
			passMark: v.number(),
			sortIndex: v.number(),
			includeInTotal: v.boolean()
		})
	)
});

type SaveExamSetupsInput = v.InferOutput<typeof saveExamSetupsSchema>;

export const saveExamSetups = query(saveExamSetupsSchema, async (params: SaveExamSetupsInput) => {
	requireRoleRemote('admin');
	await db.transaction(async (tx) => {
		const subjectIdsToKeep = params.setups.map((s) => s.subjectId);

		// 1. Delete setups for this specific configuration that are no longer included
		if (subjectIdsToKeep.length > 0) {
			await tx
				.delete(studExamSetups)
				.where(
					and(
						eq(studExamSetups.sessionId, params.sessionId),
						eq(studExamSetups.examTermId, params.examTermId),
						eq(studExamSetups.classId, params.classId),
						notInArray(studExamSetups.subjectId, subjectIdsToKeep)
					)
				);
		} else {
			await tx
				.delete(studExamSetups)
				.where(
					and(
						eq(studExamSetups.sessionId, params.sessionId),
						eq(studExamSetups.examTermId, params.examTermId),
						eq(studExamSetups.classId, params.classId)
					)
				);
		}

		// 2. Prepare for insert/upsert
		const setupsToInsert = params.setups.map((s) => ({
			sessionId: params.sessionId,
			examTermId: params.examTermId,
			classId: params.classId,
			subjectId: s.subjectId,
			fullMark: s.fullMark as number,
			passMark: s.passMark,
			sortIndex: s.sortIndex,
			includeInTotal: s.includeInTotal
		}));

		// 3. Bulk upsert if there's anything to insert
		if (setupsToInsert.length > 0) {
			await tx
				.insert(studExamSetups)
				.values(setupsToInsert)
				.onConflictDoUpdate({
					target: [
						studExamSetups.sessionId,
						studExamSetups.classId,
						studExamSetups.examTermId,
						studExamSetups.subjectId
					],
					set: {
						fullMark: sql`excluded.full_mark`,
						passMark: sql`excluded.pass_mark`,
						sortIndex: sql`excluded.sort_index`,
						includeInTotal: sql`excluded.include_in_total`
					}
				});
		}
	});

	return { success: true };
});
