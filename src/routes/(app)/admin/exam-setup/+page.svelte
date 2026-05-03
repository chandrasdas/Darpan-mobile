<script lang="ts">
	import { getExistingSetups, saveExamSetups } from './setup.remote';
	import { getClasses } from '../../students/students.remote';
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Reactive state for filters
	// svelte-ignore state_referenced_locally
	let currentSession = $state(data.defaults.session);
	// svelte-ignore state_referenced_locally
	let currentTerm = $state(data.defaults.term);
	// svelte-ignore state_referenced_locally
	let currentClass = $state(data.defaults.class);
	// svelte-ignore state_referenced_locally
	let classes = $state(data.classes);

	// Reactive state for marks inputs
	let markInputs = $state<Record<number, number | null>>({});
	let passMarkInputs = $state<Record<number, number | null>>({});
	let sortInputs = $state<Record<number, number | null>>({});
	let includeMarksheetInputs = $state<Record<number, boolean>>({});
	let includeInputs = $state<Record<number, boolean>>({});
	let isSaving = $state(false);
	let saveMessage = $state('');
	let saveError = $state(false);
	// svelte-ignore state_referenced_locally
	let displaySubjects = $state(data.subjects);

	async function fetchSetups() {
		if (!currentSession || !currentTerm || !currentClass) return;
		
		saveMessage = '';
		saveError = false;
		const setups = await getExistingSetups({
			sessionId: parseInt(currentSession),
			examTermId: parseInt(currentTerm),
			classId: parseInt(currentClass)
		});

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

	// Fetch initial setups when page loads
	$effect(() => {
		fetchSetups();
	});

	async function handleSessionChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		currentSession = target.value;
		classes = await getClasses(parseInt(currentSession)).run();
		if (classes.length > 0) {
			currentClass = classes[0].id.toString();
		} else {
			currentClass = '';
		}
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
					fullMark: mark !== null && mark !== undefined && mark.toString() !== '' ? (typeof mark === 'string' ? parseFloat(mark) : mark) : 0,
					passMark: passMark !== null && passMark !== undefined && passMark.toString() !== '' ? (typeof passMark === 'string' ? parseFloat(passMark) : passMark) : 0,
					sortIndex: sort !== null && sort !== undefined && sort.toString() !== '' ? (typeof sort === 'string' ? parseInt(sort) : sort) : 0,
					includeInMarksheet: true,
					includeInTotal: includeInTotal !== undefined ? includeInTotal : true
				});
			}
		}

		try {
			await saveExamSetups({
				sessionId: parseInt(currentSession),
				examTermId: parseInt(currentTerm),
				classId: parseInt(currentClass),
				setups: setupsToSave
			});
			saveMessage = 'Configuration saved successfully!';
			saveError = false;
			setTimeout(() => saveMessage = '', 3000);
		} catch {
			saveMessage = 'Failed to save configuration.';
			saveError = true;
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
		<div class="hero-content-row">
			<div class="hero-text">
				<h1 class="page-title">Exam Setup</h1>
				<p class="page-subtitle">Configure full marks for each subject. Check 'Include in Marksheet' to add a subject to the exam.</p>
			</div>
			
			<div class="hero-filters">
				<div class="filter-group">
					<select value={currentSession} onchange={handleSessionChange} class="form-select filter-select">
						{#each data.sessions as session (session.id)}
							<option value={session.id.toString()}>{session.name}</option>
						{/each}
					</select>

					<select 
						value={currentTerm} 
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							currentTerm = target.value;
							fetchSetups();
						}} 
						class="form-select filter-select"
					>
						{#each data.examTerms as term (term.id)}
							<option value={term.id.toString()}>{term.name}</option>
						{/each}
					</select>

					<select 
						value={currentClass} 
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							currentClass = target.value;
							fetchSetups();
						}} 
						class="form-select filter-select"
					>
						{#each classes as cls (cls.id)}
							<option value={cls.id.toString()}>{cls.name}</option>
						{/each}
					</select>
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
							>
						</td>
						<td class="text-center">
							<input 
								type="checkbox"
								bind:checked={includeInputs[subject.id]}
								disabled={!includeMarksheetInputs[subject.id]}
								class="form-checkbox mx-auto"
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
		{#if saveMessage}
			<span class="status-message {saveError ? 'error-text' : 'success-text'}" in:fade>
				{saveMessage}
			</span>
		{/if}
		<button onclick={handleSave} disabled={isSaving} class="primary-button">
			{isSaving ? 'Saving...' : 'Save Configuration'}
		</button>
	</div>
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

	.hero-content-row {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	@media (min-width: 768px) {
		.hero-content-row {
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-end;
		}
	}

	.hero-text {
		flex: 1;
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
		font-size: 16px;
		color: var(--color-on-surface-variant);
		margin-top: 8px;
		max-width: 600px;
	}

	.hero-filters {
		width: 100%;
	}

	@media (min-width: 768px) {
		.hero-filters {
			width: auto;
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
		border-radius: var(--radius-2xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
		overflow: hidden;
	}

	.table-scroll {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		min-width: 800px;
		border-collapse: collapse;
		text-align: left;
	}

	.data-table th {
		padding: 16px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-on-surface-variant);
		background-color: var(--color-surface);
		border-bottom: 1px solid var(--color-outline-variant);
	}

	.data-table td {
		padding: 12px 16px;
		font-size: 14px;
		border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
		vertical-align: middle;
	}

	.data-table tbody tr:last-child td {
		border-bottom: none;
	}

	.data-table tbody tr {
		transition: background-color 150ms ease;
	}

	.data-table tbody tr:hover {
		background-color: color-mix(in srgb, var(--color-primary) 4%, transparent);
	}

	.data-table tbody tr:nth-child(even) {
		background-color: color-mix(in srgb, var(--color-surface) 30%, transparent);
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

	.w-16 { width: 64px; }
	.w-32 { width: 128px; }
	.w-48 { width: 192px; }

	.mx-auto {
		margin-left: auto;
		margin-right: auto;
		display: block;
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

	.form-checkbox {
		height: 20px;
		width: 20px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		cursor: pointer;
	}

	.form-checkbox:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.form-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: var(--color-surface);
	}

	.small-input {
		padding: 8px 12px;
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
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
