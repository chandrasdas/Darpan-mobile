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

	// Import Config State
	// svelte-ignore state_referenced_locally
	let importSession = $state(data.defaults.session);
	// svelte-ignore state_referenced_locally
	let importClass = $state(data.defaults.class);
	// svelte-ignore state_referenced_locally
	let importTerm = $state(data.defaults.term);
	// svelte-ignore state_referenced_locally
	let importClasses = $state(data.classes);

	// Filter exam terms based on the selected class
	let filteredTerms = $derived.by(() => {
		const allowed = ALLOWED_TERM_IDS[currentClass];
		if (!allowed) return data.examTerms;
		return data.examTerms.filter((t) => allowed.includes(t.id));
	});

	// Synchronously ensure currentTerm is valid for the current class.
	function ensureValidTerm() {
		const terms = filteredTerms;
		const isValid = terms.some((t) => t.id === currentTerm);
		if (!isValid && terms.length > 0) {
			currentTerm = terms[0].id;
		}
	}

	let filteredImportTerms = $derived.by(() => {
		const allowed = ALLOWED_TERM_IDS[importClass];
		if (!allowed) return data.examTerms;
		return data.examTerms.filter((t) => allowed.includes(t.id));
	});

	function ensureValidImportTerm() {
		const terms = filteredImportTerms;
		const isValid = terms.some((t) => t.id === importTerm);
		if (!isValid && terms.length > 0) {
			importTerm = terms[0].id;
		}
	}

	// Build initial state maps from server-provided data (before $state declarations)
	function buildInitialState() {
		const marks: Record<number, number | null> = {};
		const passMarks: Record<number, number | null> = {};
		const sorts: Record<number, number | null> = {};
		const includes: Record<number, boolean> = {};
		let sortIndex = 1;
		for (const sub of data.subjects) {
			marks[sub.id] = null;
			passMarks[sub.id] = null;
			sorts[sub.id] = sortIndex++;
			includes[sub.id] = true;
		}

		let initialDisplaySubjects: typeof data.subjects = [];
		if (data.initialSetups.length > 0) {
			const setupSubjectIds = new Set(data.initialSetups.map((s) => s.subjectId));
			initialDisplaySubjects = data.subjects.filter((s) => setupSubjectIds.has(s.id));
			initialDisplaySubjects.sort((a, b) => {
				const sortA = data.initialSetups.find((s) => s.subjectId === a.id)?.sortIndex ?? 0;
				const sortB = data.initialSetups.find((s) => s.subjectId === b.id)?.sortIndex ?? 0;
				return sortA - sortB;
			});
		}

		for (const setup of data.initialSetups) {
			marks[setup.subjectId] = setup.fullMark;
			passMarks[setup.subjectId] = setup.passMark;
			sorts[setup.subjectId] = setup.sortIndex;
			includes[setup.subjectId] = setup.includeInTotal;
		}

		initialDisplaySubjects.forEach((sub, idx) => {
			sorts[sub.id] = idx + 1;
		});

		return { marks, passMarks, sorts, includes, initialDisplaySubjects };
	}

	const initial = buildInitialState();

	// Reactive state for marks inputs — initialized with server data
	let markInputs = $state<Record<number, number | null>>(initial.marks);
	let passMarkInputs = $state<Record<number, number | null>>(initial.passMarks);
	let sortInputs = $state<Record<number, number | null>>(initial.sorts);
	let includeInputs = $state<Record<number, boolean>>(initial.includes);
	let isSaving = $state(false);
	let saveMessage = $state('');
	let saveError = $state(false);

	let displaySubjects = $state(initial.initialDisplaySubjects);

	let addedToMarksheetCount = $derived(displaySubjects.length);

	let totalFullMarks = $derived(
		displaySubjects.reduce((total, sub) => {
			if (includeInputs[sub.id]) {
				return total + (Number(markInputs[sub.id]) || 0);
			}
			return total;
		}, 0)
	);

	let addedToTotalCount = $derived(displaySubjects.filter((sub) => includeInputs[sub.id]).length);

	let availableSubjectsToAdd = $derived(
		data.subjects.filter((sub) => !displaySubjects.some((d) => d.id === sub.id))
	);
	let subjectToAddId = $state<number | null>(null);

	function addSubject() {
		if (!subjectToAddId) return;
		const sub = data.subjects.find((s) => s.id === subjectToAddId);
		if (sub) {
			displaySubjects = [...displaySubjects, sub];
			includeInputs[sub.id] = true;
			if (markInputs[sub.id] === null) markInputs[sub.id] = 50;
			if (passMarkInputs[sub.id] === null) passMarkInputs[sub.id] = 15;
			sortInputs[sub.id] = displaySubjects.length;
			subjectToAddId = null;
		}
	}

	function removeSubject(id: number) {
		const sub = data.subjects.find((s) => s.id === id);
		if (confirm(`Are you sure you want to remove ${sub?.name} from this configuration?`)) {
			displaySubjects = displaySubjects.filter((sub) => sub.id !== id);
			includeInputs[id] = false;
		}
	}

	let draggedIndex = $state<number | null>(null);

	function handleDragStart(e: DragEvent, index: number) {
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', index.toString());
		}
		draggedIndex = index;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		const newItems = [...displaySubjects];
		const [draggedItem] = newItems.splice(draggedIndex, 1);
		newItems.splice(index, 0, draggedItem);

		displaySubjects = newItems;

		displaySubjects.forEach((sub, idx) => {
			sortInputs[sub.id] = idx + 1;
		});

		draggedIndex = null;
	}

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
		const newIncludes: Record<number, boolean> = {};
		let initialSortIndex = 1;
		for (const sub of data.subjects) {
			newInputs[sub.id] = null;
			newPassMarks[sub.id] = null;
			newSorts[sub.id] = initialSortIndex++;
			newIncludes[sub.id] = true;
		}

		// Populate with existing
		for (const setup of setups) {
			newInputs[setup.subjectId] = setup.fullMark;
			newPassMarks[setup.subjectId] = setup.passMark;
			newSorts[setup.subjectId] = setup.sortIndex;
			newIncludes[setup.subjectId] = setup.includeInTotal;
		}
		markInputs = newInputs;
		passMarkInputs = newPassMarks;
		sortInputs = newSorts;
		includeInputs = newIncludes;

		// Use database order (no sorting)
		if (setups.length > 0) {
			const setupSubjectIds = new Set(setups.map((s) => s.subjectId));
			let newDisplaySubjects = data.subjects.filter((s) => setupSubjectIds.has(s.id));
			newDisplaySubjects.sort((a, b) => {
				const sortA = setups.find((s) => s.subjectId === a.id)?.sortIndex ?? 0;
				const sortB = setups.find((s) => s.subjectId === b.id)?.sortIndex ?? 0;
				return sortA - sortB;
			});
			displaySubjects = newDisplaySubjects;

			displaySubjects.forEach((sub, idx) => {
				sortInputs[sub.id] = idx + 1;
			});
		} else {
			displaySubjects = [];
		}
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

	async function handleImportSessionChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		importSession = Number(target.value);
		importClasses = await getClasses(importSession).run();
		if (importClasses.length > 0) {
			importClass = importClasses[0].id;
		} else {
			importClass = 0;
		}
		ensureValidImportTerm();
	}

	async function handleImport() {
		if (!importSession || !importTerm || !importClass) return;

		if (
			importSession === currentSession &&
			importClass === currentClass &&
			importTerm === currentTerm
		) {
			alert(
				'You are trying to import from the exact same Session, Class, and Term that you are currently editing. Please select a different configuration to import.'
			);
			return;
		}

		try {
			const setupsToImport = await getExistingSetups({
				sessionId: importSession,
				examTermId: importTerm,
				classId: importClass
			}).run();

			if (setupsToImport.length === 0) {
				alert('No configuration found for the selected Session, Class, and Term.');
				return;
			}

			if (
				confirm(
					`Are you sure you want to import ${setupsToImport.length} subjects? This will overwrite the configuration currently shown below. (Changes will not be saved until you click 'Save Configuration')`
				)
			) {
				const newInputs: Record<number, number | null> = {};
				const newPassMarks: Record<number, number | null> = {};
				const newSorts: Record<number, number | null> = {};
				const newIncludes: Record<number, boolean> = {};

				let initialSortIndex = 1;
				for (const sub of data.subjects) {
					newInputs[sub.id] = null;
					newPassMarks[sub.id] = null;
					newSorts[sub.id] = initialSortIndex++;
					newIncludes[sub.id] = true;
				}

				for (const setup of setupsToImport) {
					newInputs[setup.subjectId] = setup.fullMark;
					newPassMarks[setup.subjectId] = setup.passMark;
					newSorts[setup.subjectId] = setup.sortIndex;
					newIncludes[setup.subjectId] = setup.includeInTotal;
				}

				markInputs = newInputs;
				passMarkInputs = newPassMarks;
				sortInputs = newSorts;
				includeInputs = newIncludes;

				const setupSubjectIds = new Set(setupsToImport.map((s) => s.subjectId));
				let newDisplaySubjects = data.subjects.filter((s) => setupSubjectIds.has(s.id));
				newDisplaySubjects.sort((a, b) => {
					const sortA = setupsToImport.find((s) => s.subjectId === a.id)?.sortIndex ?? 0;
					const sortB = setupsToImport.find((s) => s.subjectId === b.id)?.sortIndex ?? 0;
					return sortA - sortB;
				});

				displaySubjects = newDisplaySubjects;

				displaySubjects.forEach((sub, idx) => {
					sortInputs[sub.id] = idx + 1;
				});

				saveMessage =
					'Imported successfully! Click "Save Configuration" at the bottom to apply changes.';
				saveError = false;
				setTimeout(() => {
					if (
						saveMessage ===
						'Imported successfully! Click "Save Configuration" at the bottom to apply changes.'
					) {
						saveMessage = '';
					}
				}, 5000);
			}
		} catch (error) {
			console.error('Import error:', error);
			alert('An error occurred while fetching the configuration to import.');
		}
	}

	async function handleSave() {
		if (!currentSession || !currentTerm || !currentClass) return;
		isSaving = true;
		saveMessage = '';
		saveError = false;

		const setupsToSave = [];
		for (const sub of displaySubjects) {
			const mark = markInputs[sub.id];
			const passMark = passMarkInputs[sub.id];
			const sort = sortInputs[sub.id];
			const includeInTotal = includeInputs[sub.id];
			setupsToSave.push({
				subjectId: sub.id,
				fullMark: mark ?? 0,
				passMark: passMark ?? 0,
				sortIndex: sort ?? 0,
				includeInTotal: includeInTotal ?? true
			});
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
				<p class="page-subtitle">
					Configure full marks for each subject. Check 'Include in Marksheet' to add a subject to
					the exam.
				</p>
			</div>

			<div class="hero-bottom">
				<div class="stats-row">
					<span class="stat-item"
						>Subjects added to Marksheet: <strong>{addedToMarksheetCount}</strong></span
					>
					<span class="stat-item"
						>Subjects added in Grand Total: <strong>{addedToTotalCount}</strong></span
					>
				</div>

				<div class="hero-filters">
					<div class="filter-group">
						<select
							value={currentSession.toString()}
							onchange={handleSessionChange}
							class="filter-select form-select"
						>
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
							value={currentTerm.toString()}
							onchange={(e) => {
								const target = e.target as HTMLSelectElement;
								currentTerm = Number(target.value);
								fetchSetups();
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

	<!-- Import Configuration Row -->
	<div
		class="card"
		style="margin-bottom: 24px; padding: 12px 20px; background: color-mix(in srgb, var(--color-surface) 90%, var(--color-primary) 10%); border: 1px solid color-mix(in srgb, var(--color-outline-variant) 80%, var(--color-primary) 20%);"
	>
		<div class="flex flex-wrap items-center gap-4" style="justify-content: space-between;">
			<div class="flex items-center gap-2 text-sm font-medium" style="color: var(--color-primary);">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline
						points="7 10 12 15 17 10"
					></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg
				>
				Import from another configuration
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<select
					value={importSession.toString()}
					onchange={handleImportSessionChange}
					class="form-select"
					style="padding: 6px 12px; font-size: 13px; width: auto; max-width: 140px; border-color: transparent;"
				>
					{#each data.sessions as session (session.id)}
						<option value={session.id.toString()}>{session.year}</option>
					{/each}
				</select>
				<select
					value={importClass.toString()}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						importClass = Number(target.value);
						ensureValidImportTerm();
					}}
					class="form-select"
					style="padding: 6px 12px; font-size: 13px; width: auto; max-width: 140px; border-color: transparent;"
				>
					{#if importClasses.length === 0}
						<option value="0">No Class</option>
					{/if}
					{#each importClasses as cls (cls.id)}
						<option value={cls.id.toString()}>{cls.name}</option>
					{/each}
				</select>
				<select
					value={importTerm.toString()}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						importTerm = Number(target.value);
					}}
					class="form-select"
					style="padding: 6px 12px; font-size: 13px; width: auto; max-width: 140px; border-color: transparent;"
				>
					{#each filteredImportTerms as term (term.id)}
						<option value={term.id.toString()}>{term.name}</option>
					{/each}
				</select>
				<button
					onclick={handleImport}
					class="primary-button flex items-center gap-1"
					style="padding: 6px 16px; font-size: 13px;"
				>
					Import Config
				</button>
			</div>
		</div>
	</div>

	<!-- Data Table -->
	<div class="card table-card">
		<div class="table-scroll">
			<table class="data-table">
				<thead>
					<tr>
						<th class="w-10 px-1 text-center">SL</th>
						<th class="px-1">Subject Name</th>
						<th class="w-16 px-1 text-center" style="line-height: 1.1; font-size: 10px;"
							>Include in Total</th
						>
						<th class="w-14 px-1 text-center" style="line-height: 1.1; font-size: 10px;"
							>Full Marks</th
						>
						<th class="w-14 px-1 text-center" style="line-height: 1.1; font-size: 10px;"
							>Pass Marks</th
						>
						<th class="w-14 px-1 text-center">Action</th>
					</tr>
				</thead>
				<tbody>
					{#if displaySubjects.length === 0}
						<tr class="no-hover">
							<td colspan="6" class="py-8 text-center font-medium text-slate-500"
								>Not configured yet. Add a subject below.</td
							>
						</tr>
					{/if}
					{#each displaySubjects as subject, i (subject.id)}
						<tr
							draggable="true"
							ondragstart={(e) => handleDragStart(e, i)}
							ondragover={handleDragOver}
							ondrop={(e) => handleDrop(e, i)}
							class:dragging={draggedIndex === i}
						>
							<td
								class="cursor-grab text-center font-medium text-slate-500 active:cursor-grabbing"
								title="Drag to reorder"
							>
								<div class="flex items-center justify-center gap-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="text-slate-400 transition-colors hover:text-slate-600"
										><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"
										></line><line x1="8" y1="18" x2="21" y2="18"></line><line
											x1="3"
											y1="6"
											x2="3.01"
											y2="6"
										></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line
											x1="3"
											y1="18"
											x2="3.01"
											y2="18"
										></line></svg
									>
									{i + 1}
								</div>
							</td>
							<td class="font-medium">
								{subject.name}
							</td>
							<td class="text-center">
								<input
									type="checkbox"
									bind:checked={includeInputs[subject.id]}
									class="mx-auto form-checkbox"
									tabindex="-1"
								/>
							</td>
							<td>
								<input
									type="number"
									min="0"
									max="1000"
									bind:value={markInputs[subject.id]}
									placeholder="-"
									class="small-input form-input"
								/>
							</td>
							<td>
								<input
									type="number"
									min="0"
									max="1000"
									bind:value={passMarkInputs[subject.id]}
									placeholder="0"
									class="small-input form-input"
								/>
							</td>
							<td class="text-center">
								<button
									type="button"
									onclick={() => removeSubject(subject.id)}
									class="inline-flex items-center justify-center text-red-500 transition-colors hover:text-red-700"
									title="Remove Subject"
									style="height: 32px; width: 32px; border-radius: 6px; background-color: var(--color-surface); border: 1px solid var(--color-outline-variant);"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
										></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line
											x1="10"
											y1="11"
											x2="10"
											y2="17"
										></line><line x1="14" y1="11" x2="14" y2="17"></line></svg
									>
								</button>
							</td>
						</tr>
					{/each}
					{#if displaySubjects.length > 0}
						<tr class="no-hover" style="background-color: var(--color-surface-high);">
							<td
								colspan="3"
								class="text-right font-bold text-slate-500"
								style="padding-right: 12px; font-size: 11px; text-transform: uppercase;"
								>Total Included Marks</td
							>
							<td
								class="text-center font-bold"
								style="color: var(--color-primary); font-size: 14px;">{totalFullMarks}</td
							>
							<td colspan="2"></td>
						</tr>
					{/if}
					{#if availableSubjectsToAdd.length > 0}
						<tr class="no-hover">
							<td></td>
							<td colspan="5">
								<div class="flex items-center gap-3 py-2">
									<select
										bind:value={subjectToAddId}
										class="form-select"
										style="max-width: 250px; padding: 8px 16px;"
									>
										<option value={null}>Select subject to add...</option>
										{#each availableSubjectsToAdd as sub (sub.id)}
											<option value={sub.id}>{sub.name}</option>
										{/each}
									</select>
									<button
										type="button"
										onclick={addSubject}
										class="primary-button flex items-center gap-1"
										disabled={!subjectToAddId}
										style="padding: 8px 16px; font-size: 13px;"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											><line x1="12" y1="5" x2="12" y2="19"></line><line
												x1="5"
												y1="12"
												x2="19"
												y2="12"
											></line></svg
										>
										Add Subject
									</button>
								</div>
							</td>
						</tr>
					{/if}
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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
							x1="12"
							y1="16"
							x2="12.01"
							y2="16"
						/></svg
					>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg
					>
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

	.data-table tbody tr:not(.no-hover):hover {
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

	.form-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: var(--color-surface);
	}

	.small-input {
		padding: 3px 4px;
		border-radius: 2px;
		border: 1px solid var(--color-outline-variant);
		background-color: var(--color-surface);
		font-size: 13px;
		font-variant-numeric: tabular-nums;
		width: 100%;
		text-align: center;
		caret-color: var(--color-on-surface);
	}

	.small-input::-webkit-outer-spin-button,
	.small-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.small-input[type='number'] {
		-moz-appearance: textfield;
	}

	.dragging {
		opacity: 0.5;
		background-color: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface) 95%);
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
		to {
			transform: rotate(360deg);
		}
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
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.1),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
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
