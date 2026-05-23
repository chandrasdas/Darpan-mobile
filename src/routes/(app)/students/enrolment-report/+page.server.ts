import { db } from '$lib/server/db';
import {
	studInfo,
	studSessionEnrollments,
	studSections,
	studClasses,
	studSessions
} from '$lib/server/db/schema/marksheet';
import { eq, desc, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// 1. Fetch all academic sessions sorted by year descending
	const sessions = await db.select().from(studSessions).orderBy(desc(studSessions.year));

	// Determine the active/selected session ID
	let selectedSessionId = parseInt(url.searchParams.get('sessionId') || '');
	if (isNaN(selectedSessionId) && sessions.length > 0) {
		selectedSessionId = sessions[0].id;
	}

	const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;
	const sessionName = selectedSession ? selectedSession.name : '';

	// 2. Fetch all classes and sections
	const classes = await db.select().from(studClasses).orderBy(asc(studClasses.id));
	const sections = await db.select().from(studSections).orderBy(asc(studSections.id));

	// 3. Fetch all enrollments for the selected session
	const enrollments = await db
		.select({
			rollNo: studSessionEnrollments.rollNo,
			caste: studInfo.caste,
			transferDate: studInfo.transferDate,
			classId: studClasses.id,
			className: studClasses.name,
			sectionId: studSections.id,
			sectionLetter: studSections.letter,
			sectionName: studSections.fullName,
			sectionMedium: studSections.medium
		})
		.from(studSessionEnrollments)
		.innerJoin(studInfo, eq(studSessionEnrollments.studentId, studInfo.sid))
		.innerJoin(studSections, eq(studSessionEnrollments.sectionId, studSections.id))
		.innerJoin(studClasses, eq(studSections.classId, studClasses.id))
		.where(eq(studSessionEnrollments.sessionId, selectedSessionId));

	// Helper function to normalize caste values
	function getCasteCategory(
		casteStr: string | null | undefined
	): 'General' | 'SC' | 'ST' | 'OBC-A' | 'OBC-B' {
		if (!casteStr) return 'General';
		const lower = casteStr.toLowerCase();
		if (lower === 'sc') return 'SC';
		if (lower === 'st') return 'ST';
		if (lower === 'obc-a') return 'OBC-A';
		if (lower === 'obc-b') return 'OBC-B';
		return 'General';
	}

	// 4. Aggregate Class-Section Enrolment (Table 1)
	const sectionReports = [];
	let grandTotalTc = 0;
	let grandTotalActive = 0;

	for (const cls of classes) {
		const clsSections = sections.filter((sec) => sec.classId === cls.id);
		if (clsSections.length === 0) continue;

		const classSectionsAggregated = [];
		let totalActiveInClass = 0;

		for (const sec of clsSections) {
			const secEnrollments = enrollments.filter(
				(e) => e.classId === cls.id && e.sectionId === sec.id
			);

			const lastRoll = secEnrollments.reduce((max, e) => (e.rollNo > max ? e.rollNo : max), 0);
			const tcCount = secEnrollments.filter((e) => e.transferDate !== null).length;
			const activeCount = secEnrollments.filter((e) => e.transferDate === null).length;

			totalActiveInClass += activeCount;
			grandTotalTc += tcCount;
			grandTotalActive += activeCount;

			classSectionsAggregated.push({
				sectionId: sec.id,
				letter: sec.letter,
				medium: sec.medium,
				lastRoll,
				tcCount,
				activeCount
			});
		}

		sectionReports.push({
			classId: cls.id,
			className: cls.name,
			sections: classSectionsAggregated,
			totalActiveInClass
		});
	}

	// 5. Aggregate Caste-Based Enrolment per Class (Table 2)
	const casteReports = [];
	let grandCasteGen = 0;
	let grandCasteSc = 0;
	let grandCasteSt = 0;
	let grandCasteObcA = 0;
	let grandCasteObcB = 0;

	for (const cls of classes) {
		const clsEnrollments = enrollments.filter(
			(e) => e.classId === cls.id && e.transferDate === null
		);

		let gen = 0;
		let sc = 0;
		let st = 0;
		let obcA = 0;
		let obcB = 0;

		for (const e of clsEnrollments) {
			const category = getCasteCategory(e.caste);
			if (category === 'SC') sc++;
			else if (category === 'ST') st++;
			else if (category === 'OBC-A') obcA++;
			else if (category === 'OBC-B') obcB++;
			else gen++;
		}

		const classTotal = gen + sc + st + obcA + obcB;

		grandCasteGen += gen;
		grandCasteSc += sc;
		grandCasteSt += st;
		grandCasteObcA += obcA;
		grandCasteObcB += obcB;

		casteReports.push({
			classId: cls.id,
			className: cls.name,
			gen,
			sc,
			st,
			obcA,
			obcB,
			total: classTotal
		});
	}

	return {
		sessions,
		selectedSessionId,
		sessionName,
		sectionReports,
		casteReports,
		grandTotals: {
			tc: grandTotalTc,
			active: grandTotalActive,
			caste: {
				gen: grandCasteGen,
				sc: grandCasteSc,
				st: grandCasteSt,
				obcA: grandCasteObcA,
				obcB: grandCasteObcB,
				total: grandCasteGen + grandCasteSc + grandCasteSt + grandCasteObcA + grandCasteObcB
			}
		}
	};
};
