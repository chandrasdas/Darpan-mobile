<script lang="ts">
	import {
		getPeriodsForSection,
		getStudentsForAttendance,
		saveSingleAttendance
	} from './attendance-entry.remote';
	import { getSections, getClasses } from '../../students/students.remote';
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	import { ALLOWED_TERM_IDS } from '$lib/config/exam-rules';

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
	// svelte-ignore state_referenced_locally
	let periods = $state(data.initialPeriods);

	let filteredTerms = $derived.by(() => {
		const allowed = ALLOWED_TERM_IDS[currentClass];
		if (!allowed) return data.examTerms;
		return data.examTerms.filter((t) => allowed.includes(t.id));
	});

	function ensureValidTerm() {
		const terms = filteredTerms;
		const isValid = terms.some((t) => t.id === currentTerm);
		if (!isValid && terms.length > 0) {
			currentTerm = terms[0].id;
		}
	}

	// --- Student & attendance state ---
	type StudentRow = {
		seid: number;
		rollNo: number;
		studentName: string;
		transferDate?: string | null;
		attendance: Record<number, number>;
	};

	// svelte-ignore state_referenced_locally
	let students = $state<StudentRow[]>(data.initialStudents || []);

	let saveStatus = $state<Record<string, string>>({});

	let isLoadingStudents = $state(false);

	function getSaveKey(seid: number, periodId: number) {
		return `${seid}-${periodId}`;
	}

	function getTotalAttendance(student: StudentRow) {
		return Object.values(student.attendance || {}).reduce((sum, val) => sum + (val || 0), 0);
	}

	function handleKeydown(e: KeyboardEvent, r: number, c: number) {
		if (e.key === 'Enter') {
			e.preventDefault();
			let nextRow = e.shiftKey ? r - 1 : r + 1;
			let nextCol = c;
			if (nextRow >= students.length) {
				nextRow = 0;
				nextCol++;
			} else if (nextRow < 0) {
				nextRow = students.length - 1;
				nextCol--;
			}
			const nextInput = document.querySelector(
				`input[data-row="${nextRow}"][data-col="${nextCol}"]`
			) as HTMLInputElement;
			if (nextInput) {
				nextInput.focus();
				nextInput.select();
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			const nextInput = document.querySelector(
				`input[data-row="${r + 1}"][data-col="${c}"]`
			) as HTMLInputElement;
			if (nextInput) {
				nextInput.focus();
				nextInput.select();
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			const nextInput = document.querySelector(
				`input[data-row="${r - 1}"][data-col="${c}"]`
			) as HTMLInputElement;
			if (nextInput) {
				nextInput.focus();
				nextInput.select();
			}
		}
	}

	let totalTermWorkingDays = $derived(
		periods.reduce((sum, p) => sum + (p.totalWorkingDays || 0), 0)
	);

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
		currentSection = fetched.length > 0 ? fetched[0].id : 0;
	}

	async function fetchPeriods() {
		if (!currentSession || !currentSection || !currentTerm) {
			periods = [];
			return;
		}
		const fetched = await getPeriodsForSection({
			sessionId: currentSession,
			sectionId: currentSection,
			examTermId: currentTerm
		}).run();
		periods = fetched;
		fillExamDays();
	}

	async function fetchStudents() {
		if (!currentSession || !currentSection || !currentTerm) {
			students = [];
			return;
		}
		isLoadingStudents = true;
		try {
			const fetched = await getStudentsForAttendance({
				sessionId: currentSession,
				sectionId: currentSection,
				examTermId: currentTerm
			}).run();
			students = fetched;
			fillExamDays();
			saveStatus = {};
		} finally {
			isLoadingStudents = false;
		}
	}

	// --- Handlers ---

	async function handleSessionChange() {
		currentClass = 0;
		currentSection = 0;
		periods = [];
		students = [];
		const fetchedClasses = await getClasses(currentSession).run();
		classes = fetchedClasses;
		if (fetchedClasses.length > 0) {
			currentClass = fetchedClasses[0].id;
			await fetchSections();
			ensureValidTerm();
			await fetchPeriods();
			await fetchStudents();
		}
	}

	async function handleClassChange() {
		currentSection = 0;
		periods = [];
		students = [];
		await fetchSections();
		ensureValidTerm();
		await fetchPeriods();
		await fetchStudents();
	}

	async function handleTermChange() {
		students = [];
		await fetchPeriods();
		await fetchStudents();
	}

	async function handleSectionChange() {
		students = [];
		await fetchPeriods();
		await fetchStudents();
	}

	// ========================
	// Auto-save on blur
	// ========================

	async function handleAttendanceBlur(
		student: StudentRow,
		periodId: number,
		totalWorkingDays: number
	) {
		await doSave(student, periodId, totalWorkingDays);
	}

	async function doSave(student: StudentRow, periodId: number, totalWorkingDays: number) {
		let daysPresent = student.attendance[periodId] || 0;
		if (daysPresent < 0 || isNaN(daysPresent)) {
			daysPresent = 0;
			student.attendance[periodId] = 0;
		}
		daysPresent = Math.round(daysPresent);
		student.attendance[periodId] = daysPresent;

		const key = getSaveKey(student.seid, periodId);

		if (totalWorkingDays > 0 && daysPresent > totalWorkingDays) {
			saveStatus[key] = 'warning';
			return;
		}

		saveStatus[key] = 'saving';
		try {
			await saveSingleAttendance({
				sessionEnrollId: student.seid,
				periodId: periodId,
				daysPresent: daysPresent
			}).run();
			saveStatus[key] = 'saved';
			setTimeout(() => {
				if (saveStatus[key] === 'saved') {
					saveStatus[key] = 'idle';
				}
			}, 2000);
		} catch {
			saveStatus[key] = 'error';
		}
	}

	// Stats
	let studentCount = $derived(students.length);
	let filledCount = $derived(students.filter((s) => getTotalAttendance(s) > 0).length);

	function fillExamDays() {
		if (periods.length === 0 || students.length === 0) return;
		const lastPeriod = periods[periods.length - 1];
		for (let student of students) {
			if (
				student.attendance[lastPeriod.periodId] === undefined ||
				student.attendance[lastPeriod.periodId] === null
			) {
				student.attendance[lastPeriod.periodId] = lastPeriod.totalWorkingDays || 0;
			}
		}
	}

	// Pre-fill exam days for initial data
	fillExamDays();
</script>

<svelte:head>
	<title>Attendance Entry | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<div class="page-hero">
		<div class="hero-content">
			<div class="hero-header">
				<h1 class="page-title">Attendance Entry</h1>
				<p class="page-subtitle">
					Enter days present for each student. Changes save automatically when you move to the next
					field.
				</p>
			</div>

			<div class="hero-bottom">
				<div class="stats-row">
					<div class="stat-item">
						<span class="pulse-dot"></span>
						<span><strong>{studentCount}</strong> students</span>
					</div>
					<span class="stat-separator">•</span>
					<div class="stat-item">
						<span><strong>{filledCount}</strong> filled</span>
					</div>
				</div>

				<div class="hero-filters">
					<div class="filter-columns">
						<!-- Row 1: Session, Class, Section -->
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
						</div>

						<div class="filter-divider"></div>

						<!-- Row 2: Term, Period -->
						<div class="filter-group">
							<select
								value={currentTerm.toString()}
								onchange={(e) => {
									currentTerm = Number((e.target as HTMLSelectElement).value);
									handleTermChange();
								}}
								class="filter-select form-select"
							>
								{#each filteredTerms as term (term.id)}
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
						<th class="w-16">Roll</th>
						<th class="w-40">Student Name</th>
						{#each periods as p (p.periodId)}
							<th class="w-20 text-center">
								<div class="flex flex-col items-center">
									<span>{p.periodName}</span>
									<span class="text-muted text-[10px] font-normal">({p.totalWorkingDays})</span>
								</div>
							</th>
						{/each}
						<th class="w-20 border-l border-outline-variant text-center">
							<div class="flex flex-col items-center">
								<span>Total</span>
								<span class="text-muted text-[10px] font-normal">({totalTermWorkingDays})</span>
							</div>
						</th>
						<th class="w-20 border-l border-outline-variant text-center">
							<div class="flex flex-col items-center">
								<span>Perc</span>
								<span class="text-muted text-[10px] font-normal">%</span>
							</div>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each students as student, r (student.seid)}
						<tr class:student-transferred={student.transferDate}>
							<td class="font-bold tabular-nums">
								{student.rollNo}
							</td>
							<td class="font-medium">
								{student.studentName}
								{#if student.transferDate}
									<span class="ml-2 text-xs font-semibold text-error italic">(Transferred)</span>
								{/if}
							</td>
							{#each periods as p, c (p.periodId)}
								<td class="relative text-center">
									<input
										type="number"
										min="0"
										step="1"
										tabindex={10 + c * students.length + r}
										enterkeyhint="next"
										data-row={r}
										data-col={c}
										bind:value={student.attendance[p.periodId]}
										onchange={() => handleAttendanceBlur(student, p.periodId, p.totalWorkingDays)}
										onkeydown={(e) => handleKeydown(e, r, c)}
										onfocus={(e) => (e.target as HTMLInputElement).select()}
										disabled={!!student.transferDate}
										placeholder="0"
										class="mark-input form-input {saveStatus[
											getSaveKey(student.seid, p.periodId)
										] === 'warning'
											? 'input-warning'
											: ''}"
									/>
									<div class="absolute top-1/2 right-2 -translate-y-1/2">
										{#if saveStatus[getSaveKey(student.seid, p.periodId)] === 'saved'}
											<span class="status-icon success-icon text-[10px]" in:fade={{ duration: 200 }}
												>✓</span
											>
										{:else if saveStatus[getSaveKey(student.seid, p.periodId)] === 'warning'}
											<span
												class="status-icon warning-icon text-[10px]"
												title="Exceeds working days">!</span
											>
										{:else if saveStatus[getSaveKey(student.seid, p.periodId)] === 'error'}
											<span class="status-icon error-icon text-[10px]" title="Save failed">✗</span>
										{/if}
									</div>
								</td>
							{/each}
							<td class="border-l border-outline-variant text-center tabular-nums">
								{getTotalAttendance(student)}
							</td>
							<td class="border-l border-outline-variant text-center tabular-nums">
								{totalTermWorkingDays > 0
									? ((getTotalAttendance(student) / totalTermWorkingDays) * 100).toFixed(1)
									: '0.0'}
							</td>
						</tr>
					{/each}

					{#if students.length === 0 && !isLoadingStudents}
						<tr>
							<td colspan={periods.length + 4} class="empty-state">
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
								{#if periods.length === 0}
									<h3 class="empty-title">No periods configured</h3>
									<p class="empty-desc">Set up attendance periods first in Period Setup.</p>
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
		0% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-status-success) 50%, transparent);
		}
		70% {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-status-success) 0%, transparent);
		}
		100% {
			box-shadow: 0 0 0 0 transparent;
		}
	}
	.stat-separator {
		color: var(--color-outline);
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
	.text-center {
		text-align: center;
	}
	.font-medium {
		font-weight: 500;
	}
	.font-bold {
		font-weight: 700;
	}
	.text-muted {
		color: var(--color-on-surface-variant);
	}
	.tabular-nums {
		font-variant-numeric: tabular-nums;
	}
	.w-16 {
		width: 36px;
	}
	.w-20 {
		width: 48px;
	}
	.form-select,
	.form-input {
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
	.form-select:focus,
	.form-input:focus {
		border-color: var(--color-primary);
		background-color: var(--color-surface-lowest);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}
	.mark-input {
		padding: 3px 6px;
		border-radius: 2px;
		border: 1px solid var(--color-outline-variant);
		background-color: var(--color-surface);
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
	.student-transferred {
		opacity: 0.6;
		background-color: color-mix(in srgb, var(--color-outline-variant) 10%, transparent) !important;
	}
	.text-error {
		color: #dc2626;
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
