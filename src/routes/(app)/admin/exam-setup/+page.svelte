<script lang="ts">
	import { getExistingSetups, saveExamSetups } from './setup.remote';
	import { getClasses } from '../../students/students.remote';
	import { fade, fly } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	import { ALLOWED_TERM_IDS } from '$lib/config/exam-rules';

	// Reactive filter state — stored as numbers to avoid scattered parseInt() calls
	// svelte-ignore state_referenced_locally
	let currentSession = $state(data.defaults.session);
	// svelte-ignore state_referenced_locally
	let currentTerm = $state(data.defaults.term);
	// svelte-ignore state_referenced_locally
	let currentClass = $state(data.defaults.class);
	// svelte-ignore state_referenced_locally
	let classes = $state(data.classes);

	// Filter exam terms based on the selected class
	let filteredTerms = $derived(() => {
		const allowed = ALLOWED_TERM_IDS[currentClass];
		if (!allowed) return data.examTerms;
		return data.examTerms.filter(t => allowed.includes(t.id));
	});

	// Synchronously ensure currentTerm is valid for the current class.
	function ensureValidTerm() {
		const terms = filteredTerms();
		const isValid = terms.some(t => t.id === currentTerm);
		if (!isValid && terms.length > 0) {
			currentTerm = terms[0].id;
		}
	}

	// Build initial state maps from server-provided data (before $state declarations)
	function buildInitialState() {
		const marks: Record<number, number | null> = {};
		const passMarks: Record<number, number | null> = {};
		const sorts: Record<number, number | null> = {};
		const includeMarksheet: Record<number, boolean> = {};
		const includes: Record<number, boolean> = {};
		let sortIndex = 1;
		for (const sub of data.subjects) {
			marks[sub.id] = null;
			passMarks[sub.id] = null;
			sorts[sub.id] = sortIndex++;
			includeMarksheet[sub.id] = false;
			includes[sub.id] = true;
		}
		for (const setup of data.initialSetups) {
			marks[setup.subjectId] = setup.fullMark;
			passMarks[setup.subjectId] = setup.passMark;
			sorts[setup.subjectId] = setup.sortIndex;
			includeMarksheet[setup.subjectId] = setup.includeInMarksheet;
			includes[setup.subjectId] = setup.includeInTotal;
		}
		return { marks, passMarks, sorts, includeMarksheet, includes };
	}

	const initial = buildInitialState();

	// Reactive state for marks inputs — initialized with server data
	let markInputs = $state<Record<number, number | null>>(initial.marks);
	let passMarkInputs = $state<Record<number, number | null>>(initial.passMarks);
	let sortInputs = $state<Record<number, number | null>>(initial.sorts);
	let includeMarksheetInputs = $state<Record<number, boolean>>(initial.includeMarksheet);
	let includeInputs = $state<Record<number, boolean>>(initial.includes);
	let isSaving = $state(false);
	let saveMessage = $state('');
	let saveError = $state(false);
	// svelte-ignore state_referenced_locally
	let displaySubjects = $state(data.subjects);

	let addedToMarksheetCount = $derived(
		displaySubjects.filter(sub => includeMarksheetInputs[sub.id]).length
	);

	let addedToTotalCount = $derived(
		displaySubjects.filter(sub => includeMarksheetInputs[sub.id] && includeInputs[sub.id]).length
	);

	async function fetchSetups() {
		if (!currentSession || !currentTerm || !currentClass) return;
		
		saveMessage = '';
		saveError = false;
		const setups = await getExistingSetups({
			sessionId: currentSession,
			examTermId: currentTerm,
			classId: currentClass
		}).run();

		// Reset inputs
		const newInputs: Record<number, number | null> = {};
		const newPassMarks: Record<number, number | null> = {};
		const newSorts: Record<number, number | null> = {};
		const newIncludeMarksheet: Record<number, boolean> = {};
		const newIncludes: Record<number, boolean> = {};
		let initialSortIndex = 1;
		for (const sub of data.subjects) {
			newInputs[sub.id] = null;
			newPassMarks[sub.id] = null;
			newSorts[sub.id] = initialSortIndex++;
			newIncludeMarksheet[sub.id] = false;
			newIncludes[sub.id] = true;
		}

		// Populate with existing
		for (const setup of setups) {
			newInputs[setup.subjectId] = setup.fullMark;
			newPassMarks[setup.subjectId] = setup.passMark;
			newSorts[setup.subjectId] = setup.sortIndex;
			newIncludeMarksheet[setup.subjectId] = setup.includeInMarksheet;
			newIncludes[setup.subjectId] = setup.includeInTotal;
		}
		markInputs = newInputs;
		passMarkInputs = newPassMarks;
		sortInputs = newSorts;
		includeMarksheetInputs = newIncludeMarksheet;
		includeInputs = newIncludes;

		// Use database order (no sorting)
		displaySubjects = [...data.subjects];
	}

	async function handleSessionChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		currentSession = Number(target.value);
		classes = await getClasses(currentSession).run();
		if (classes.length > 0) {
			currentClass = classes[0].id;
		} else {
			currentClass = 0;
		}
		ensureValidTerm();
		fetchSetups();
	}

	async function handleSave() {
		if (!currentSession || !currentTerm || !currentClass) return;
		isSaving = true;
		saveMessage = '';
		saveError = false;

		const setupsToSave = [];
		for (const sub of data.subjects) {
			const includeInMarksheet = includeMarksheetInputs[sub.id];
			if (includeInMarksheet) {
				const mark = markInputs[sub.id];
				const passMark = passMarkInputs[sub.id];
				const sort = sortInputs[sub.id];
				const includeInTotal = includeInputs[sub.id];
				setupsToSave.push({
					subjectId: sub.id,
					fullMark: mark ?? 0,
					passMark: passMark ?? 0,
					sortIndex: sort ?? 0,
					includeInMarksheet: true,
					includeInTotal: includeInTotal ?? true
				});
			}
		}

		try {
			await saveExamSetups({
				sessionId: currentSession,
				examTermId: currentTerm,
				classId: currentClass,
				setups: setupsToSave
			}).run();
			saveMessage = 'Configuration saved successfully!';
			saveError = false;
			setTimeout(() => {
				if (saveMessage === 'Configuration saved successfully!') {
					saveMessage = '';
				}
			}, 4000);
		} catch (e) {
			console.error('Save error:', e);
			saveMessage = 'Failed to save configuration. Please try again.';
			saveError = true;
			setTimeout(() => {
				if (saveMessage === 'Failed to save configuration. Please try again.') {
					saveMessage = '';
				}
			}, 4000);
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Exam Setup | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<!-- Header Section -->
	<div class="page-hero">
		<div class="hero-content">
			<div class="hero-header">
				<h1 class="page-title">Exam Setup</h1>
				<p class="page-subtitle">Configure full marks for each subject. Check 'Include in Marksheet' to add a subject to the exam.</p>
			</div>

			<div class="hero-bottom">
				{#if displaySubjects.length > 0}
					<div class="stats-row">
						<span class="stat-item">Subjects added to Marksheet: <strong>{addedToMarksheetCount}</strong></span>
						<span class="stat-item">Subjects added in Grand Total: <strong>{addedToTotalCount}</strong></span>
					</div>
				{/if}

				<div class="hero-filters">
					<div class="filter-group">
					<select value={currentSession.toString()} onchange={handleSessionChange} class="form-select filter-select">
						{#each data.sessions as session (session.id)}
							<option value={session.id.toString()}>{session.year}</option>
						{/each}
					</select>

					<select 
						value={currentClass.toString()} 
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							currentClass = Number(target.value);
							ensureValidTerm();
							fetchSetups();
						}} 
						class="form-select filter-select"
					>
						{#if classes.length === 0}
							<option value="0">No Class</option>
						{/if}
						{#each classes as cls (cls.id)}
							<option value={cls.id.toString()}>{cls.name}</option>
						{/each}
					</select>

					<select 
						value={currentTerm.toString()} 
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							currentTerm = Number(target.value);
							fetchSetups();
						}} 
						class="form-select filter-select"
					>
						{#each filteredTerms() as term (term.id)}
							<option value={term.id.toString()}>{term.name}</option>
						{/each}
					</select>

					
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
						<th class="w-16">SL</th>
						<th>Subject Name</th>
						<th class="text-center w-32">Include in Marksheet</th>
						<th class="text-center w-32">Include in Total</th>
						<th class="w-32">Sort Order</th>
						<th class="w-48">Full Marks</th>
						<th class="w-48">Pass Marks</th>
					</tr>
				</thead>
				<tbody>
					{#each displaySubjects as subject, i (subject.id)}
					<tr>
						<td class="font-medium text-slate-500">
							{i + 1}
						</td>
						<td class="font-medium">
							{subject.name}
						</td>
						<td class="text-center">
							<input 
								type="checkbox"
								bind:checked={includeMarksheetInputs[subject.id]}
								class="form-checkbox mx-auto"
								tabindex="-1"
							>
						</td>
						<td class="text-center">
							<input 
								type="checkbox"
								bind:checked={includeInputs[subject.id]}
								disabled={!includeMarksheetInputs[subject.id]}
								class="form-checkbox mx-auto"
								tabindex="-1"
							>
						</td>
						<td>
							<input 
								type="number"
								min="0"
								bind:value={sortInputs[subject.id]}
								placeholder="0"
								disabled={!includeMarksheetInputs[subject.id]}
								class="form-input small-input"
								tabindex="-1"
							>
						</td>
						<td>
							<input 
								type="number"
								min="0"
								max="1000"
								bind:value={markInputs[subject.id]}
								placeholder="-"
								disabled={!includeMarksheetInputs[subject.id]}
								class="form-input small-input"
							>
						</td>
						<td>
							<input 
								type="number"
								min="0"
								max="1000"
								bind:value={passMarkInputs[subject.id]}
								placeholder="0"
								disabled={!includeMarksheetInputs[subject.id]}
								class="form-input small-input"
							>
						</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="action-bar">
		<button onclick={handleSave} disabled={isSaving} class="primary-button">
			{#if isSaving}
				<span class="spinner"></span>
				Saving...
			{:else}
				Save Configuration
			{/if}
		</button>
	</div>

	{#if saveMessage}
		<div 
			class="floating-toast {saveError ? 'toast-error' : 'toast-success'}"
			in:fly={{ y: 20, duration: 400 }}
			out:fade={{ duration: 300 }}
		>
			<div class="toast-icon">
				{#if saveError}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
				{/if}
			</div>
			<span class="toast-text">{saveMessage}</span>
		</div>
	{/if}
</div>

<style>
	.page-shell {
		padding: 0 20px 32px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.page-hero {
		padding: 24px 0 0;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background-color: var(--color-surface-lowest);
		padding: 24px;
		border-radius: var(--radius-2xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
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

	@media (min-width: 768px) {
		.hero-bottom {
			flex-direction: row;
			align-items: flex-end;
			justify-content: space-between;
		}
	}

	.stats-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-item {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-on-surface-variant);
		line-height: 1.6;
	}

	.stat-item strong {
		color: var(--color-on-surface);
	}

	.hero-filters {
		width: 100%;
	}

	@media (min-width: 768px) {
		.hero-filters {
			width: auto;
			flex-shrink: 0;
		}
	}

	.filter-group {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.filter-select {
		min-width: 140px;
		flex: 1;
	}

	.card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
		overflow: hidden;
	}

	.table-scroll {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		min-width: 460px;
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
		white-space: normal;
		text-align: center;
		vertical-align: bottom;
		line-height: 1.2;
	}

	.data-table td {
		padding: 2px 4px;
		font-size: 13px;
		border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
		vertical-align: middle;
		height: 36px;
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

	.text-slate-500 {
		color: var(--color-on-surface-variant);
	}

	.w-16 { width: 32px; }
	.w-32 { width: 64px; }
	.w-48 { width: 64px; }

	.mx-auto {
		margin-left: auto;
		margin-right: auto;
		display: block;
	}

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

	.form-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: var(--color-surface);
	}

	.small-input {
		padding: 3px 6px;
		border-radius: 2px;
		border: 1px solid var(--color-outline-variant);
		background-color: var(--color-surface);
		font-size: 13px;
		font-variant-numeric: tabular-nums;
		width: 100%;
		text-align: right;
	}

	.small-input:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: inset 0 0 0 1px var(--color-primary);
		background-color: var(--color-surface);
	}

	.action-bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 16px;
	}

	.status-message {
		font-size: 14px;
		font-weight: 500;
	}

	.success-text {
		color: var(--color-status-success);
	}

	.error-text {
		color: var(--color-error);
	}

	.primary-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		background-color: var(--color-primary);
		color: var(--color-on-primary);
		padding: 10px 24px;
		font-weight: 600;
		font-size: 14px;
		border: none;
		cursor: pointer;
		transition: all 200ms ease;
	}

	.primary-button:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.primary-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-right: 8px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Floating Toast Styles */
	.floating-toast {
		position: fixed;
		bottom: 32px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 20px;
		border-radius: var(--radius-xl);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		min-width: 280px;
		max-width: calc(100vw - 40px);
		backdrop-filter: blur(8px);
	}

	.toast-success {
		background: linear-gradient(135deg, #059669, #10b981);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.toast-error {
		background: linear-gradient(135deg, #dc2626, #ef4444);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.toast-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.toast-text {
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.01em;
	}

	@media (max-width: 640px) {
		.floating-toast {
			bottom: 80px; /* Above mobile bottom bar if any */
		}
	}
</style>
