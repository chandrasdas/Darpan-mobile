<script lang="ts">
	import { getSubjectsForExam, getStudentsForMarks, saveSingleMark } from './marks-entry.remote';
	import { getSections } from '../../students/students.remote';
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	import { ALLOWED_TERM_IDS } from '$lib/config/exam-rules';

	// --- Filter state — stored as numbers to avoid scattered parseInt() calls ---
	// svelte-ignore state_referenced_locally
	let currentSession = $state(data.defaults.session);
	// svelte-ignore state_referenced_locally
	let currentTerm = $state(data.defaults.term);
	// svelte-ignore state_referenced_locally
	let currentClass = $state(data.defaults.class);
	// svelte-ignore state_referenced_locally
	let currentSection = $state(data.defaults.section);
	// svelte-ignore state_referenced_locally
	let currentSubject = $state(data.defaults.subject);

	// --- Dropdown data (pre-filled from server) ---
	// svelte-ignore state_referenced_locally
	let sections = $state(data.initialSections);
	// svelte-ignore state_referenced_locally
	let subjects = $state(data.initialSubjects);

	// Filter exam terms based on the selected class
	let filteredTerms = $derived(() => {
		const allowed = ALLOWED_TERM_IDS[currentClass];
		if (!allowed) return data.examTerms;
		return data.examTerms.filter(t => allowed.includes(t.id));
	});

	// Synchronously ensure currentTerm is valid for the current class.
	// Must be called explicitly before fetching subjects (not via $effect,
	// which runs too late — after fetchSubjects already fired).
	function ensureValidTerm() {
		const terms = filteredTerms();
		const isValid = terms.some(t => t.id === currentTerm);
		if (!isValid && terms.length > 0) {
			currentTerm = terms[0].id;
		}
	}

	// --- Student & marks state (pre-filled from server) ---
	type StudentRow = {
		seid: number;
		rollNo: number;
		studentName: string;
		mid: number | null;
		isPresent: boolean;
		marksObtained: number;
	};
	// svelte-ignore state_referenced_locally
	let students = $state<StudentRow[]>(
		data.initialStudents.map(s => ({
			...s,
			isPresent: s.isPresent ?? true,
			marksObtained: s.marksObtained ?? 0
		}))
	);
	// svelte-ignore state_referenced_locally
	let currentFullMark = $state(data.initialSubjects.length > 0 ? data.initialSubjects[0].fullMark : 0);
	// svelte-ignore state_referenced_locally
	let currentPassMark = $state(data.initialSubjects.length > 0 ? data.initialSubjects[0].passMark : 0);

	// svelte-ignore state_referenced_locally
	let saveStatus = $state<Record<number, string>>(
		Object.fromEntries(data.initialStudents.map(s => [s.seid, 'idle']))
	);

	// --- Loading states ---
	let isLoadingStudents = $state(false);

	// ========================
	// Cascading dropdown logic
	// ========================

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

	async function fetchSubjects() {
		if (!currentSession || !currentClass || !currentTerm) {
			subjects = [];
			currentSubject = 0;
			return;
		}
		const fetched = await getSubjectsForExam({
			sessionId: currentSession,
			classId: currentClass,
			examTermId: currentTerm
		}).run();
		subjects = fetched;
		if (fetched.length > 0) {
			currentSubject = fetched[0].setupId;
			currentFullMark = fetched[0].fullMark;
			currentPassMark = fetched[0].passMark;
		} else {
			currentSubject = 0;
			currentFullMark = 0;
			currentPassMark = 0;
		}
	}

	async function fetchStudents() {
		if (!currentSession || !currentSection || !currentSubject) {
			students = [];
			return;
		}
		isLoadingStudents = true;
		try {
			const fetched = await getStudentsForMarks({
				sessionId: currentSession,
				sectionId: currentSection,
				examSetupId: currentSubject
			}).run();
			students = fetched.map(s => ({
				...s,
				isPresent: s.isPresent ?? true,
				marksObtained: s.marksObtained ?? 0
			}));
			// Derive "All Present" from the fetched data
			allPresentMode = students.length > 0 && students.every(s => s.isPresent);
			// Reset save statuses
			const newStatus: Record<number, string> = {};
			for (const s of students) {
				newStatus[s.seid] = 'idle';
			}
			saveStatus = newStatus;
		} finally {
			isLoadingStudents = false;
		}
	}

	// --- Handlers for dropdown changes ---

	async function handleClassChange() {
		currentSection = 0;
		currentSubject = 0;
		subjects = [];
		students = [];
		await fetchSections();
		// Correct the term synchronously before fetching subjects,
		// e.g. switching from Class X (Pre-Test) to Class V (no Pre-Test)
		ensureValidTerm();
		await fetchSubjects();
		await fetchStudents();
	}

	async function handleSessionOrTermChange() {
		currentSubject = 0;
		students = [];
		await fetchSubjects();
		await fetchStudents();
	}

	async function handleSectionChange() {
		students = [];
		await fetchStudents();
	}

	async function handleSubjectChange() {
		// Update fullMark from the selected subject
		const selected = subjects.find(s => s.setupId === currentSubject);
		currentFullMark = selected?.fullMark ?? 0;
		currentPassMark = selected?.passMark ?? 0;
		students = [];
		await fetchStudents();
	}

	// Initial data is pre-loaded from the server (see +page.server.ts),
	// so no $effect needed for the first render.

	// ========================
	// Auto-save on blur
	// ========================

	async function handleMarkBlur(student: StudentRow) {
		await doSave(student);
	}

	async function handlePresentToggle(student: StudentRow) {
		// Don't zero marks — keep them intact so accidental untick doesn't destroy data.
		// Marksheet generation will use is_present to exclude absent students from totals.
		await doSave(student);
	}

	async function doSave(student: StudentRow) {
		if (!currentSubject) return;

		// Fix negative / NaN silently
		if (student.marksObtained < 0 || isNaN(student.marksObtained)) {
			student.marksObtained = 0;
		}

		// Block save if marks exceed full marks — highlight red for user to fix
		if (student.marksObtained > currentFullMark) {
			saveStatus[student.seid] = 'warning';
			return;
		}

		saveStatus[student.seid] = 'saving';
		try {
			await saveSingleMark({
				sessionEnrollId: student.seid,
				examSetupId: currentSubject,
				marksObtained: student.marksObtained,
				isPresent: student.isPresent
			}).run();
			saveStatus[student.seid] = 'saved';
			setTimeout(() => {
				if (saveStatus[student.seid] === 'saved') {
					saveStatus[student.seid] = 'idle';
				}
			}, 2000);
		} catch {
			saveStatus[student.seid] = 'error';
		}
	}

	// --- "All Present" mode: hides Present column, marks everyone present ---
	// Initialized from the server data — true only when every student is present
	// svelte-ignore state_referenced_locally
	let allPresentMode = $state(
		data.initialStudents.length > 0 && data.initialStudents.every(s => (s.isPresent ?? true))
	);

	async function handleAllPresentToggle() {
		if (allPresentMode) {
			// Just turned ON — mark every student present and save
			for (const s of students) {
				s.isPresent = true;
			}
			await Promise.all(students.map(s => doSave(s)));
		}
		// When turned OFF, user can individually toggle in the now-visible column
	}

	// Student count & stats
	let studentCount = $derived(students.length);
	let presentCount = $derived(students.filter(s => s.isPresent).length);
	let failedCount = $derived(
		students.filter(s => s.isPresent && s.marksObtained < currentPassMark).length
	);

	// Helper to check if a student has failed
	function isFailed(student: StudentRow): boolean {
		return student.isPresent && student.marksObtained < currentPassMark && saveStatus[student.seid] !== 'warning';
	}
</script>

<svelte:head>
	<title>Marks Entry | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<!-- Header Section -->
	<div class="page-hero">
		<div class="hero-content">
			<div class="hero-header">
				<h1 class="page-title">Marks Entry</h1>
				<p class="page-subtitle">Enter marks for each student. Changes save automatically when you move to the next field.</p>
			</div>

			<div class="hero-bottom">
				<!-- {#if students.length > 0} -->
					<div class="stats-row">
						<div class="stat-item">
							<span class="pulse-dot"></span>
							<span><strong>{studentCount}</strong> students</span>
						</div>
						<span class="stat-separator">•</span>
						<div class="stat-item">
							<span><strong>{presentCount}</strong> present</span>
						</div>
						{#if failedCount > 0}
							<span class="stat-separator">•</span>
							<div class="stat-item error-text">
								<span><strong>{failedCount}</strong> failed</span>
							</div>
						{/if}
					</div>
				<!-- {/if} -->

				<div class="hero-filters">
					<div class="filter-columns">
						<!-- Row 1: Session, Class, Section -->
						<div class="filter-group">
							<select value={currentSession.toString()} onchange={(e) => { currentSession = Number((e.target as HTMLSelectElement).value); handleSessionOrTermChange(); }} class="form-select filter-select">
								{#each data.sessions as session (session.id)}
									<option value={session.id.toString()}>{session.name}</option>
								{/each}
							</select>

							<select value={currentClass.toString()} onchange={(e) => { currentClass = Number((e.target as HTMLSelectElement).value); handleClassChange(); }} class="form-select filter-select">
								{#each data.classes as cls (cls.id)}
									<option value={cls.id.toString()}>{cls.name}</option>
								{/each}
							</select>

							<select value={currentSection.toString()} onchange={(e) => { currentSection = Number((e.target as HTMLSelectElement).value); handleSectionChange(); }} class="form-select filter-select">
								{#if sections.length === 0}
									<option value="0">No sections</option>
								{/if}
								{#each sections as sec (sec.id)}
									<option value={sec.id.toString()}>Section {sec.letter}</option>
								{/each}
							</select>
						</div>

						<div class="filter-divider"></div>

						<!-- Row 2: All Present toggle, Term, Subject -->
						<div class="filter-group">
							<label class="all-present-label">
								<input
									type="checkbox"
									bind:checked={allPresentMode}
									onchange={handleAllPresentToggle}
									class="form-checkbox"
								>
								<span>All Present</span>
							</label>

							<select value={currentTerm.toString()} onchange={(e) => { currentTerm = Number((e.target as HTMLSelectElement).value); handleSessionOrTermChange(); }} class="form-select filter-select">
								{#each filteredTerms() as term (term.id)}
									<option value={term.id.toString()}>{term.name}</option>
								{/each}
							</select>

							<select value={currentSubject.toString()} onchange={(e) => { currentSubject = Number((e.target as HTMLSelectElement).value); handleSubjectChange(); }} class="form-select filter-select primary-select">
								{#if subjects.length === 0}
									<option value="0">No subjects configured</option>
								{/if}
								{#each subjects as sub (sub.setupId)}
									<option value={sub.setupId.toString()}>{sub.subjectName}</option>
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
						<th class="w-20">Roll</th>
						<th>Student Name</th>
						{#if !allPresentMode}
							<th class="text-center w-28">Present</th>
						{/if}
						<th class="w-18">
							Marks {#if currentFullMark > 0} <span class="font-normal text-muted">({currentFullMark})</span>{/if}
						</th>
						<th class="text-center w-16"></th>
					</tr>
				</thead>
				<tbody>
					{#each students as student (student.seid)}
						<tr>
							<td class="font-bold tabular-nums">
								{student.rollNo}
							</td>
							<td class="font-medium">
								{student.studentName}
							</td>
							{#if !allPresentMode}
								<td class="text-center">
									<input 
										type="checkbox"
										bind:checked={student.isPresent}
										onchange={() => handlePresentToggle(student)}
										tabindex="-1"
										class="form-checkbox mx-auto"
									>
								</td>
							{/if}
							<td>
								<input 
									type="number"
									min="0"
									bind:value={student.marksObtained}
									onblur={() => handleMarkBlur(student)}
									onfocus={(e) => (e.target as HTMLInputElement).select()}
									disabled={!allPresentMode && !student.isPresent}
									placeholder="0"
									class="form-input mark-input {saveStatus[student.seid] === 'warning' ? 'input-warning' : isFailed(student) ? 'input-failed' : ''}"
								>
							</td>
							<td class="text-center w-10">
								{#if saveStatus[student.seid] === 'saved'}
									<span class="status-icon success-icon" in:fade={{ duration: 200 }}>✓</span>
								{:else if saveStatus[student.seid] === 'warning'}
									<span class="status-icon warning-icon" title="Marks exceed full marks — please correct">&gt;{currentFullMark}</span>
								{:else if saveStatus[student.seid] === 'error'}
									<span class="status-icon error-icon" title="Save failed — try again">✗</span>
								{/if}
							</td>
						</tr>
					{/each}

					{#if students.length === 0 && !isLoadingStudents}
						<tr>
							<td colspan={allPresentMode ? 4 : 5} class="empty-state">
								<div class="empty-icon">
									<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
									</svg>
								</div>
								{#if subjects.length === 0}
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

	@media (min-width: 1024px) {
		.hero-bottom {
			flex-direction: row;
			align-items: flex-end;
			justify-content: space-between;
		}
	}

	.stats-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-on-surface-variant);
	}

	.stat-item strong {
		color: var(--color-on-surface);
	}

	.pulse-dot {
		height: 10px;
		width: 10px;
		border-radius: 50%;
		background-color: var(--color-status-success);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-status-success) 30%, transparent);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-status-success) 50%, transparent); }
		70% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-status-success) 0%, transparent); }
		100% { box-shadow: 0 0 0 0 transparent; }
	}

	.stat-separator {
		color: var(--color-outline);
	}

	.error-text {
		color: var(--color-error);
	}

	.error-text strong {
		color: var(--color-error);
	}

	.hero-filters {
		width: 100%;
	}

	@media (min-width: 1024px) {
		.hero-filters {
			width: auto;
			flex-shrink: 0;
		}
	}

	.filter-columns {
		display: flex;
		flex-direction: column;
		gap: 16px;
		align-items: flex-end;
	}

	.filter-group {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		justify-content: flex-end;
		width: 100%;
	}

	.filter-select {
		min-width: 120px;
		flex: 1;
	}

	@media (min-width: 640px) {
		.filter-group {
			width: auto;
		}
	}

	.filter-divider {
		height: 1px;
		width: 100%;
		background-color: var(--color-outline-variant);
	}

	.primary-select {
		border: 2px solid color-mix(in srgb, var(--color-primary) 60%, transparent);
		background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
		font-weight: 600;
	}

	.primary-select:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
	}

	.all-present-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-on-surface);
		cursor: pointer;
		white-space: nowrap;
		padding: 0 8px;
		min-height: 40px;
		border: 1px solid var(--color-outline-variant);
		border-radius: var(--radius-lg);
		background-color: var(--color-surface);
		user-select: none;
	}

	.card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-outline-variant);
		overflow: hidden;
		/* padding: 0; */
	}

	.table-scroll {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		min-width: 320px;
		border-collapse: collapse;
		text-align: left;
		font-size: 13px;
		table-layout: fixed;
	}

	.data-table th {
		padding: 4px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-on-surface-variant);
		background-color: var(--color-surface-high);
		border-bottom: 2px solid var(--color-outline-variant);
		position: sticky;
		top: 0;
		z-index: 1;
		white-space: nowrap;
		overflow: hidden;
	}

	.data-table td {
		padding: 2px 4px;
		font-size: 13px;
		border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
		vertical-align: middle;
		height: 32px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.data-table tbody tr:last-child td {
		border-bottom: none;
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

	.text-center { text-align: center; }
	.font-medium { font-weight: 500; }
	.font-bold { font-weight: 700; }
	.text-muted { color: var(--color-on-surface-variant); }
	.tabular-nums { font-variant-numeric: tabular-nums; }
	.mx-auto { margin-left: auto; margin-right: auto; }

	.w-10 { width: 32px; }
	.w-16 { width: 36px; }
	.w-20 { width: 36px; }
	.w-28 { width: 48px; }
	/* .w-36 { width: 64px; } */



	/* Compact checkbox for grid rows */
	.data-table .form-checkbox {
		height: 16px;
		width: 16px;
		border-radius: 2px;
	}

	.form-select, .form-input {
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 16px;
		font-size: 14px;
		color: var(--color-on-surface);
		transition: all 200ms ease;
		width: 100%;
	}

	.form-select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 12px center;
		background-repeat: no-repeat;
		background-size: 20px 20px;
		padding-right: 40px;
	}

	.form-select:focus, .form-input:focus {
		border-color: var(--color-primary);
		background-color: var(--color-surface-lowest);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.mark-input {
		padding: 3px 6px;
		border-radius: 2px;
		border: 1px solid var(--color-outline-variant);
		background-color: transparent;
		font-size: 13px;
		font-variant-numeric: tabular-nums;
		width: 100%;
		text-align: right;
	}

	.mark-input:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: inset 0 0 0 1px var(--color-primary);
		background-color: var(--color-surface-lowest);
	}

	.mark-input:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		background-color: var(--color-surface);
	}

	.input-warning {
		border: 2px solid var(--color-error);
		background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
		color: var(--color-error);
	}

	.input-warning:focus {
		border-color: var(--color-error);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-error) 20%, transparent);
	}

	.input-failed {
		border-color: var(--color-secondary);
		background-color: color-mix(in srgb, var(--color-secondary) 10%, transparent);
		color: var(--color-secondary);
	}

	.input-failed:focus {
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-secondary) 20%, transparent);
	}

	.status-icon {
		display: inline-block;
	}

	.success-icon {
		color: var(--color-status-success-text);
		font-size: 16px;
	}

	.warning-icon {
		color: var(--color-error);
		font-size: 12px;
		font-weight: 600;
	}

	.error-icon {
		color: var(--color-error);
		font-size: 16px;
	}

	.empty-state {
		text-align: center;
		padding: 64px 16px;
	}

	.empty-icon {
		margin: 0 auto 16px;
		display: flex;
		height: 48px;
		width: 48px;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-xl);
		background-color: var(--color-surface);
		color: var(--color-on-surface-variant);
		border: 1px solid var(--color-outline-variant);
	}

	.empty-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-on-surface);
		margin: 0 0 4px;
	}

	.empty-desc {
		font-size: 14px;
		color: var(--color-on-surface-variant);
		margin: 0;
	}
</style>
