<script lang="ts">
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import type { PageData } from './$types';
	import { getSections, getClasses } from '../../students/students.remote';
	import { getTabulationData } from './tabulation.remote';
	import { ALLOWED_TERM_IDS } from '$lib/config/exam-rules';

	let { data }: { data: PageData } = $props();

	// --- Filter state ---
	// svelte-ignore state_referenced_locally
	let currentSession = $state(data.defaults.session);
	// svelte-ignore state_referenced_locally
	let currentTerm = $state(data.defaults.term);
	// svelte-ignore state_referenced_locally
	let currentClass = $state(data.defaults.class);
	// svelte-ignore state_referenced_locally
	let currentSection = $state(data.defaults.section);
	// svelte-ignore state_referenced_locally
	let classes = $state(data.classes);

	// --- Dropdown data ---
	// svelte-ignore state_referenced_locally
	let sections = $state(data.initialSections);

	let filteredTerms = $derived(() => {
		const allowed = ALLOWED_TERM_IDS[currentClass];
		if (!allowed) return data.examTerms;
		return data.examTerms.filter(t => allowed.includes(t.id));
	});

	function ensureValidTerm() {
		const terms = filteredTerms();
		const isValid = terms.some(t => t.id === currentTerm);
		if (!isValid && terms.length > 0) {
			currentTerm = terms[0].id;
		}
	}

	// --- Tabulation state ---
	// svelte-ignore state_referenced_locally
	let subjects = $state(data.initialTabulationData.subjects);
	// svelte-ignore state_referenced_locally
	let students = $state(data.initialTabulationData.students);
	// svelte-ignore state_referenced_locally
	let marks = $state(data.initialTabulationData.marks);

	let isLoading = $state(false);

	let visibleSubjects = $derived(subjects.filter(sub => sub.fullMark !== 0));

	async function fetchSections() {
		if (!currentClass) {
			sections = [];
			currentSection = 0;
			return;
		}
		const fetched = await getSections(currentClass).run();
		sections = fetched;
		if (fetched.length > 0) {
			currentSection = fetched[0].id;
		} else {
			currentSection = 0;
		}
	}

	async function fetchTabulationData() {
		if (!currentSession || !currentClass || !currentSection || !currentTerm) {
			subjects = [];
			students = [];
			marks = [];
			return;
		}
		isLoading = true;
		try {
			const fetched = await getTabulationData({
				sessionId: currentSession,
				classId: currentClass,
				sectionId: currentSection,
				examTermId: currentTerm
			}).run();
			subjects = fetched.subjects;
			students = fetched.students;
			marks = fetched.marks;
		} finally {
			isLoading = false;
		}
	}

	async function handleClassChange() {
		currentSection = 0;
		subjects = [];
		students = [];
		marks = [];
		await fetchSections();
		ensureValidTerm();
		await fetchTabulationData();
	}

	async function handleSessionChange() {
		currentClass = 0;
		currentSection = 0;
		subjects = [];
		students = [];
		marks = [];

		const fetchedClasses = await getClasses(currentSession).run();
		classes = fetchedClasses;
		if (fetchedClasses.length > 0) {
			currentClass = fetchedClasses[0].id;
			await fetchSections();
			ensureValidTerm();
			await fetchTabulationData();
		}
	}

	async function handleOtherChange() {
		subjects = [];
		students = [];
		marks = [];
		await fetchTabulationData();
	}

	// Derived metrics
	let highestMarks = $derived(() => {
		const highest: Record<number, number> = {};
		for (const sub of visibleSubjects) {
			highest[sub.setupId] = 0;
		}
		for (const m of marks) {
			if (m.isPresent) {
				const stu = students.find(s => s.seid === m.sessionEnrollId);
				if (stu && !stu.transferDate) {
					if (m.marksObtained > (highest[m.examSetupId] || 0)) {
						highest[m.examSetupId] = m.marksObtained;
					}
				}
			}
		}
		return highest;
	});

	let totalFullMarks = $derived(visibleSubjects.reduce((sum, sub) => sum + sub.fullMark, 0));

	let studentCalculatedMetrics = $derived(() => {
		const metrics: Record<number, { total: number; percentage: number; isPresent: boolean }> = {};
		for (const student of students) {
			if (student.transferDate) continue;

			let total = 0;
			let hasMarks = false;
			let isPresentAny = false;

			for (const sub of visibleSubjects) {
				const m = marks.find(mark => mark.sessionEnrollId === student.seid && mark.examSetupId === sub.setupId);
				if (m) {
					hasMarks = true;
					if (m.isPresent) {
						total += m.marksObtained;
						isPresentAny = true;
					}
				}
			}

			if (hasMarks) {
				const percentage = totalFullMarks > 0 ? (total / totalFullMarks) * 100 : 0;
				metrics[student.seid] = {
					total: Math.round(total * 10) / 10,
					percentage: Math.round(percentage * 100) / 100,
					isPresent: isPresentAny
				};
			}
		}
		return metrics;
	});

	let highestTotalAndPercentage = $derived(() => {
		let maxTotal = 0;
		let maxPercentage = 0;
		const metrics = studentCalculatedMetrics();

		for (const seid of Object.keys(metrics)) {
			const m = metrics[Number(seid)];
			if (m.total > maxTotal) {
				maxTotal = m.total;
			}
			if (m.percentage > maxPercentage) {
				maxPercentage = m.percentage;
			}
		}

		return {
			total: maxTotal > 0 ? maxTotal.toFixed(1).replace(/\.0$/, '') : '0',
			percentage: maxPercentage > 0 ? maxPercentage.toFixed(1) : '0.0'
		};
	});

	function getMarkDisplay(seid: number, setupId: number, isTransferred: boolean) {
		if (isTransferred) return '';
		const m = marks.find(mark => mark.sessionEnrollId === seid && mark.examSetupId === setupId);
		if (!m) return '';
		if (!m.isPresent) return 'Ab';
		return m.marksObtained;
	}
</script>

<svelte:head>
	<title>Tabulation Sheet | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<div class="page-hero">
		<div class="hero-content">
			<div class="hero-header flex-header">
				<div>
					<h1 class="page-title">Tabulation Sheet</h1>
					<p class="page-subtitle">View class performance and marks across all subjects for a given section.</p>
				</div>
				<button class="btn-primary print-btn" onclick={() => window.print()}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
					</svg>
					Print
				</button>
			</div>

			<div class="hero-bottom">
				<div class="hero-filters">
					<div class="filter-columns">
						<div class="filter-group">
							<select value={currentSession.toString()} onchange={(e) => { currentSession = Number((e.target as HTMLSelectElement).value); handleSessionChange(); }} class="form-select filter-select">
								{#each data.sessions as session (session.id)}
									<option value={session.id.toString()}>{session.year}</option>
								{/each}
							</select>

							<select value={currentClass.toString()} onchange={(e) => { currentClass = Number((e.target as HTMLSelectElement).value); handleClassChange(); }} class="form-select filter-select">
								{#if classes.length === 0}
									<option value="0">No Class</option>
								{/if}
								{#each classes as cls (cls.id)}
									<option value={cls.id.toString()}>{cls.name}</option>
								{/each}
							</select>

							<select value={currentSection.toString()} onchange={(e) => { currentSection = Number((e.target as HTMLSelectElement).value); handleOtherChange(); }} class="form-select filter-select">
								{#if sections.length === 0}
									<option value="0">No sections</option>
								{/if}
								{#each sections as sec (sec.id)}
									<option value={sec.id.toString()}>Section {sec.letter}</option>
								{/each}
							</select>

							<select value={currentTerm.toString()} onchange={(e) => { currentTerm = Number((e.target as HTMLSelectElement).value); handleOtherChange(); }} class="form-select filter-select">
								{#each filteredTerms() as term (term.id)}
									<option value={term.id.toString()}>{term.name}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Data Table -->
	<div class="card table-card">
		<div class="table-scroll">
			<table class="data-table">
				<thead>
					<tr>
						<th class="w-16">Roll No</th>
						<th class="w-48">Student Name</th>
						{#each visibleSubjects as subject (subject.setupId)}
							<th class="subject-col" title={subject.subjectName}>
								<div class="vertical-wrapper">
									<span class="vertical-text">{subject.subjectName}</span>
								</div>
							</th>
						{/each}
						<th class="subject-col font-bold text-center" title="Total Marks">
							<div class="vertical-wrapper">
								<span class="vertical-text font-bold">Total</span>
							</div>
						</th>
						<th class="subject-col font-bold text-center" title="Percentage">
							<div class="vertical-wrapper">
								<span class="vertical-text font-bold">Percentage</span>
							</div>
						</th>
					</tr>
				</thead>
				<tbody>
					<!-- Full Marks Row -->
					{#if visibleSubjects.length > 0}
						<tr class="highlight-row">
							<td></td>
							<td class="font-bold">Full Marks</td>
							{#each visibleSubjects as subject (subject.setupId)}
								<td class="text-center font-bold">{subject.fullMark}</td>
							{/each}
							<td class="text-center font-bold">{totalFullMarks}</td>
							<td class="text-center font-bold">100.0</td>
						</tr>
						<!-- Highest Marks Row -->
						<tr class="highlight-row">
							<td></td>
							<td class="font-bold">Highest Marks</td>
							{#each visibleSubjects as subject (subject.setupId)}
								<td class="text-center font-bold text-primary">{highestMarks()[subject.setupId]}</td>
							{/each}
							<td class="text-center font-bold text-primary">{highestTotalAndPercentage().total}</td>
							<td class="text-center font-bold text-primary">{highestTotalAndPercentage().percentage}</td>
						</tr>
					{/if}

					<!-- Student Rows -->
					{#each students as student (student.seid)}
						{@const isTransferred = !!student.transferDate}
						{@const metrics = studentCalculatedMetrics()[student.seid]}
						<tr>
							<td class="font-bold tabular-nums">
								{student.rollNo}
							</td>
							<td class="font-medium {isTransferred ? 'text-muted italic' : ''}">
								{isTransferred ? 'T.C.' : student.studentName}
							</td>
							{#each visibleSubjects as subject (subject.setupId)}
								<td class="text-center tabular-nums">
									{getMarkDisplay(student.seid, subject.setupId, isTransferred)}
								</td>
							{/each}
							<td class="text-center font-bold tabular-nums">
								{isTransferred ? '' : (metrics ? metrics.total.toFixed(1).replace(/\.0$/, '') : '')}
							</td>
							<td class="text-center font-bold tabular-nums">
								{isTransferred ? '' : (metrics ? metrics.percentage.toFixed(1) : '')}
							</td>
						</tr>
					{/each}

					{#if students.length === 0 && !isLoading}
						<tr>
							<td colspan={visibleSubjects.length + 4} class="empty-state">
								<div class="empty-icon">
									<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
									</svg>
								</div>
								{#if visibleSubjects.length === 0}
									<h3 class="empty-title">No subjects configured</h3>
									<p class="empty-desc">Set up exam configuration first for this session, class, and term.</p>
								{:else}
									<h3 class="empty-title">No students found</h3>
									<p class="empty-desc">No students are enrolled for the selected section.</p>
								{/if}
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.page-shell {
		padding: 0 12px 32px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	@media (min-width: 640px) {
		.page-shell {
			padding: 0 20px 32px;
			gap: 24px;
		}
	}

	.page-hero {
		padding: 24px 0 0;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background-color: var(--color-surface-lowest);
		padding: 16px;
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
	}

	@media (min-width: 640px) {
		.hero-content {
			padding: 24px;
			border-radius: var(--radius-2xl);
		}
	}

	.hero-header {
		width: 100%;
	}

	.page-title {
		font-family: var(--font-heading);
		font-size: 32px;
		font-weight: 700;
		color: var(--color-on-surface);
		letter-spacing: -0.02em;
		margin: 0;
	}

	.page-subtitle {
		font-family: var(--font-body);
		font-size: 14px;
		color: var(--color-on-surface-variant);
		margin-top: 6px;
		line-height: 1.5;
	}

	.hero-bottom {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.hero-filters {
		width: 100%;
	}

	.filter-columns {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.filter-group {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		width: 100%;
	}

	.filter-select {
		min-width: 120px;
		flex: 1;
	}

	.card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-outline-variant);
		overflow: hidden;
	}

	.table-scroll {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 13px;
	}

	.data-table th {
		padding: 6px 8px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-on-surface-variant);
		background-color: var(--color-surface-high);
		border-bottom: 2px solid var(--color-outline-variant);
		border-right: 1px solid var(--color-outline-variant);
		position: sticky;
		top: 0;
		z-index: 1;
		white-space: nowrap;
		overflow: hidden;
	}

	.data-table th:last-child,
	.data-table td:last-child {
		border-right: none;
	}

	.data-table td {
		padding: 4px 8px;
		font-size: 13px;
		border-bottom: 1px solid var(--color-outline-variant);
		border-right: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
		vertical-align: middle;
		height: 36px;
		white-space: nowrap;
	}

	.data-table tbody tr {
		transition: background-color 100ms ease;
	}

	.data-table tbody tr:hover {
		background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
	}

	.data-table tbody tr:nth-child(even) {
		background-color: color-mix(in srgb, var(--color-surface-high) 40%, transparent);
	}

	.highlight-row {
		background-color: color-mix(in srgb, var(--color-primary) 5%, transparent) !important;
		border-bottom: 2px solid var(--color-outline-variant);
	}

	.text-center { text-align: center; }
	.font-medium { font-weight: 500; }
	.font-bold { font-weight: 700; }
	.text-muted { color: var(--color-on-surface-variant); }
	.italic { font-style: italic; }
	.tabular-nums { font-variant-numeric: tabular-nums; }
	.text-primary { color: var(--color-primary); }

	.w-16 { width: 48px; }
	.subject-col { width: 40px; }
	.w-48 { width: 200px; }

	.form-select {
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 16px;
		font-size: 14px;
		color: var(--color-on-surface);
		transition: all 200ms ease;
		width: 100%;
		appearance: none;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 12px center;
		background-repeat: no-repeat;
		background-size: 20px 20px;
		padding-right: 40px;
	}

	.form-select:focus {
		border-color: var(--color-primary);
		background-color: var(--color-surface-lowest);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.empty-state {
		padding: 48px 24px;
		text-align: center;
		color: var(--color-on-surface-variant);
	}

	.empty-icon {
		margin: 0 auto 16px;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: var(--color-surface-high);
		color: var(--color-on-surface-variant);
	}

	.empty-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-on-surface);
		margin-bottom: 4px;
	}

	.empty-desc {
		font-size: 14px;
		color: var(--color-on-surface-variant);
	}

	/* Vertical Subject Headers */
	.subject-col {
		height: 80px;
		vertical-align: bottom !important;
		padding: 4px 0 !important;
	}

	.vertical-wrapper {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		height: 100%;
		width: 100%;
		padding-bottom: 4px;
	}

	.vertical-text {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		white-space: normal;
		text-align: left;
		font-size: 11px;
		letter-spacing: 0.05em;
		line-height: 1.1;
		word-wrap: break-word;
		word-break: keep-all;
		max-height: 100px; /* Limit height so text wrapping is forced! */
	}

	.flex-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		padding: 8px 16px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-primary:hover {
		background-color: color-mix(in srgb, var(--color-primary) 80%, black);
	}

	@media print {
		@page {
			size: A4 portrait;
			margin: 10mm;
		}

		:global(body) {
			background-color: white !important;
			color: black !important;
		}

		.page-shell {
			padding: 0;
			gap: 10px;
		}

		.hero-content {
			box-shadow: none;
			border: none;
			padding: 0;
			margin-bottom: 10px;
			background: transparent;
		}

		.print-btn {
			display: none !important;
		}

		.form-select {
			border: none !important;
			appearance: none;
			background-image: none !important;
			padding: 0;
			font-weight: bold;
			color: black;
			pointer-events: none;
		}

		.card {
			border: none;
			box-shadow: none;
			background: transparent;
		}

		.table-scroll {
			overflow: visible;
		}

		.data-table {
			font-size: 11px;
			width: 100%;
		}

		.data-table th {
			background-color: #f3f4f6 !important;
			color: black !important;
			border: 1px solid #ddd !important;
			padding: 4px;
			position: static; /* Remove sticky for print */
		}

		.data-table td {
			border: 1px solid #ddd !important;
			padding: 4px;
			color: black !important;
		}

		.highlight-row td {
			background-color: #f9fafb !important;
		}

		.subject-col {
			height: 60px; /* Shorter for print */
		}

		.vertical-text {
			font-size: 10px;
			max-height: 48px;
		}

		/* Hide global sidebar/navbar elements if possible */
		:global(nav), :global(aside), :global(header) {
			display: none !important;
		}
	}
</style>
