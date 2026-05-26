<script lang="ts">
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import type { PageData } from './$types';
	import { getSections, getClasses } from '../../students/students.remote';
	import { getStudentsList, getMarksheetData } from './marksheet.remote';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	let currentSession = $state(data.defaults.session);
	// svelte-ignore state_referenced_locally
	let currentClass = $state(data.defaults.class);
	// svelte-ignore state_referenced_locally
	let currentSection = $state(data.defaults.section);
	// svelte-ignore state_referenced_locally
	let currentEnrollId = $state(data.defaults.enrollId);

	// svelte-ignore state_referenced_locally
	let sections = $state(data.initialSections);
	// svelte-ignore state_referenced_locally
	let students = $state(data.initialStudents);
	// svelte-ignore state_referenced_locally
	let setups = $state(data.initialMarksheetData.setups);
	// svelte-ignore state_referenced_locally
	let marks = $state(data.initialMarksheetData.marks);
	// svelte-ignore state_referenced_locally
	let classes = $state(data.classes);

	let isLoading = $state(false);

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

	async function fetchStudents() {
		if (!currentSession || !currentSection) {
			students = [];
			currentEnrollId = 0;
			return;
		}
		const fetched = await getStudentsList({
			sessionId: currentSession,
			sectionId: currentSection
		}).run();
		students = fetched;
		if (fetched.length > 0) {
			currentEnrollId = fetched[0].seid;
		} else {
			currentEnrollId = 0;
		}
	}

	async function fetchMarksheetData() {
		if (!currentSession || !currentClass || !currentEnrollId) {
			setups = [];
			marks = [];
			return;
		}
		isLoading = true;
		try {
			const fetched = await getMarksheetData({
				sessionId: currentSession,
				classId: currentClass,
				sessionEnrollId: currentEnrollId
			}).run();
			setups = fetched.setups;
			marks = fetched.marks;
		} finally {
			isLoading = false;
		}
	}

	async function handleSessionChange() {
		currentClass = 0;
		currentSection = 0;
		currentEnrollId = 0;
		sections = [];
		students = [];
		setups = [];
		marks = [];

		const fetchedClasses = await getClasses(currentSession).run();
		classes = fetchedClasses;
		if (fetchedClasses.length > 0) {
			currentClass = fetchedClasses[0].id;
			await fetchSections();
			await fetchStudents();
			await fetchMarksheetData();
		}
	}

	async function handleClassChange() {
		await fetchSections();
		await fetchStudents();
		await fetchMarksheetData();
	}

	async function handleSectionChange() {
		await fetchStudents();
		await fetchMarksheetData();
	}

	async function handleStudentChange() {
		await fetchMarksheetData();
	}

	let uniqueTerms = $derived.by(() => {
		const termsMap = new Map<number, string>();
		for (const s of setups) {
			if (!termsMap.has(s.examTermId)) {
				termsMap.set(s.examTermId, s.termName);
			}
		}
		return Array.from(termsMap.entries()).map(([id, name]) => ({ id, name }));
	});

	let uniqueSubjects = $derived.by(() => {
		const subMap = new Map<number, string>();
		for (const s of setups) {
			if (!subMap.has(s.subjectId)) {
				subMap.set(s.subjectId, s.subjectName);
			}
		}
		return Array.from(subMap.entries()).map(([id, name]) => ({ id, name }));
	});

	function getMarkDisplay(subjectId: number, termId: number) {
		const setup = setups.find((s) => s.subjectId === subjectId && s.examTermId === termId);
		if (!setup) return '-';
		const mark = marks.find((m) => m.examSetupId === setup.setupId);
		if (!mark) return '-';
		if (!mark.isPresent) return 'Ab';
		return mark.marksObtained;
	}

	let studentDetails = $derived(students.find((s) => s.seid === currentEnrollId));
</script>

<svelte:head>
	<title>Marksheet | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<div class="page-hero">
		<div class="hero-content">
			<div class="hero-header flex-header">
				<div>
					<h1 class="page-title">Marksheet</h1>
					<p class="page-subtitle">View individual student performance across all terms.</p>
				</div>
				<button class="btn-primary print-btn" onclick={() => window.print()}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
						/>
					</svg>
					Print
				</button>
			</div>

			<div class="hero-bottom">
				<div class="hero-filters">
					<div class="filter-columns">
						<div class="filter-group">
							<select
								value={currentSession.toString()}
								onchange={(e) => {
									currentSession = Number((e.target as HTMLSelectElement).value);
									handleSessionChange();
								}}
								class="filter-select form-select"
							>
								{#each data.sessions as session (session.id)}
									<option value={session.id.toString()}>{session.year}</option>
								{/each}
							</select>

							<select
								value={currentClass.toString()}
								onchange={(e) => {
									currentClass = Number((e.target as HTMLSelectElement).value);
									handleClassChange();
								}}
								class="filter-select form-select"
							>
								{#if classes.length === 0}
									<option value="0">No Class</option>
								{/if}
								{#each classes as cls (cls.id)}
									<option value={cls.id.toString()}>{cls.name}</option>
								{/each}
							</select>

							<select
								value={currentSection.toString()}
								onchange={(e) => {
									currentSection = Number((e.target as HTMLSelectElement).value);
									handleSectionChange();
								}}
								class="filter-select form-select"
							>
								{#if sections.length === 0}
									<option value="0">No sections</option>
								{/if}
								{#each sections as sec (sec.id)}
									<option value={sec.id.toString()}>Section {sec.letter}</option>
								{/each}
							</select>

							<select
								value={currentEnrollId.toString()}
								onchange={(e) => {
									currentEnrollId = Number((e.target as HTMLSelectElement).value);
									handleStudentChange();
								}}
								class="filter-select form-select"
							>
								{#if students.length === 0}
									<option value="0">No students</option>
								{/if}
								{#each students as stu (stu.seid)}
									<option value={stu.seid.toString()}>({stu.rollNo}) {stu.studentName}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Student Info -->
	{#if studentDetails}
		<div class="card info-card">
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Student Name</span>
					<span class="info-value">{studentDetails?.studentName}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Roll No</span>
					<span class="info-value">{studentDetails?.rollNo}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Class & Section</span>
					<span class="info-value">
						{data.classes.find((c) => c.id === currentClass)?.name} - {sections.find(
							(s) => s.id === currentSection
						)?.letter}
					</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Data Table -->
	<div class="card table-card">
		<div class="table-scroll">
			<table class="data-table">
				<thead>
					<tr>
						<th class="w-48 text-left">Subject</th>
						{#each uniqueTerms as term (term.id)}
							<th class="text-center">{term.name}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each uniqueSubjects as subject (subject.id)}
						<tr>
							<td class="text-left font-medium">{subject.name}</td>
							{#each uniqueTerms as term (term.id)}
								<td class="text-center tabular-nums">
									{getMarkDisplay(subject.id, term.id)}
								</td>
							{/each}
						</tr>
					{/each}

					{#if uniqueSubjects.length === 0 && !isLoading}
						<tr>
							<td colspan={uniqueTerms.length + 1} class="empty-state">
								<div class="empty-icon">
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="1.5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
										/>
									</svg>
								</div>
								<h3 class="empty-title">No subjects found</h3>
								<p class="empty-desc">No marks available for this student.</p>
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
		color: var(--color-on-primary);
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

	.info-card {
		padding: 16px;
		border-radius: var(--radius-md);
	}

	.info-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.info-label {
		font-size: 12px;
		text-transform: uppercase;
		color: var(--color-on-surface-variant);
		font-weight: 600;
	}

	.info-value {
		font-size: 16px;
		font-weight: 700;
		color: var(--color-on-surface);
	}

	.table-scroll {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}

	.data-table th {
		padding: 10px 16px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-on-surface-variant);
		background-color: var(--color-surface-high);
		border-bottom: 2px solid var(--color-outline-variant);
		white-space: nowrap;
	}

	.data-table td {
		padding: 10px 16px;
		border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
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

	.text-center {
		text-align: center;
	}
	.text-left {
		text-align: left;
	}
	.font-medium {
		font-weight: 500;
	}
	.tabular-nums {
		font-variant-numeric: tabular-nums;
	}

	.w-48 {
		width: 200px;
	}

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

	@media print {
		@page {
			size: A4 portrait;
			margin: 15mm;
		}

		:global(body) {
			background-color: white !important;
			color: black !important;
		}

		.page-shell {
			padding: 0;
			gap: 16px;
		}

		.hero-content {
			box-shadow: none;
			border: none;
			padding: 0;
			background: transparent;
		}

		.print-btn {
			display: none !important;
		}

		.hero-filters {
			display: none !important; /* Hide dropdowns when printing marksheet usually */
		}

		.card {
			border: none;
			box-shadow: none;
			background: transparent;
		}

		.info-card {
			border: 1px solid #000 !important;
		}

		.data-table {
			font-size: 12px;
			width: 100%;
		}

		.data-table th {
			background-color: #f3f4f6 !important;
			color: black !important;
			border: 1px solid #000 !important;
			padding: 6px;
		}

		.data-table td {
			border: 1px solid #000 !important;
			padding: 6px;
			color: black !important;
		}

		/* Hide global navigation */
		:global(nav),
		:global(aside),
		:global(header) {
			display: none !important;
		}
	}
</style>
