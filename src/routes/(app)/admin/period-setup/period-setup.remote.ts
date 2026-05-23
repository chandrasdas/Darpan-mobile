import { query } from '$app/server';
import { db } from '$lib/server/db';
import { studAttendancePeriods } from '$lib/server/db/schema/attendance';
import { eq, and, notInArray, sql } from 'drizzle-orm';
import * as v from 'valibot';

export const getExistingPeriods = query(
	v.object({
		sessionId: v.number(),
		sectionId: v.number(),
		examTermId: v.number()
	}),
	async (params) => {
		const periods = await db
			.select()
			.from(studAttendancePeriods)
			.where(
				and(
					eq(studAttendancePeriods.sessionId, params.sessionId),
					eq(studAttendancePeriods.sectionId, params.sectionId),
					eq(studAttendancePeriods.examTermId, params.examTermId)
				)
			);
		return periods;
	}
);

const savePeriodSetupsSchema = v.object({
	sessionId: v.number(),
	sectionId: v.number(),
	examTermId: v.number(),
	periods: v.array(
		v.object({
			periodName: v.string(),
			totalWorkingDays: v.number(),
			sortIndex: v.number()
		})
	)
});

type SavePeriodSetupsInput = v.InferOutput<typeof savePeriodSetupsSchema>;

export const savePeriodSetups = query(
	savePeriodSetupsSchema,
	async (params: SavePeriodSetupsInput) => {
		await db.transaction(async (tx) => {
			const periodNamesToKeep = params.periods.map((p) => p.periodName);

			// 1. Delete periods for this specific configuration that are no longer included
			if (periodNamesToKeep.length > 0) {
				await tx
					.delete(studAttendancePeriods)
					.where(
						and(
							eq(studAttendancePeriods.sessionId, params.sessionId),
							eq(studAttendancePeriods.sectionId, params.sectionId),
							eq(studAttendancePeriods.examTermId, params.examTermId),
							notInArray(studAttendancePeriods.periodName, periodNamesToKeep)
						)
					);
			} else {
				await tx
					.delete(studAttendancePeriods)
					.where(
						and(
							eq(studAttendancePeriods.sessionId, params.sessionId),
							eq(studAttendancePeriods.sectionId, params.sectionId),
							eq(studAttendancePeriods.examTermId, params.examTermId)
						)
					);
			}

			// 2. Prepare for insert/upsert
			const periodsToInsert = params.periods.map((p) => ({
				sessionId: params.sessionId,
				sectionId: params.sectionId,
				examTermId: params.examTermId,
				periodName: p.periodName,
				totalWorkingDays: p.totalWorkingDays,
				sortIndex: p.sortIndex
			}));

			// 3. Bulk upsert if there's anything to insert
			if (periodsToInsert.length > 0) {
				await tx
					.insert(studAttendancePeriods)
					.values(periodsToInsert)
					.onConflictDoUpdate({
						target: [
							studAttendancePeriods.sessionId,
							studAttendancePeriods.sectionId,
							studAttendancePeriods.periodName
						],
						set: {
							totalWorkingDays: sql`excluded.total_working_days`,
							sortIndex: sql`excluded.sort_index`,
							examTermId: sql`excluded.exam_term_id`
						}
					});
			}
		});

		return { success: true };
	}
);
