<script lang="ts">
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import type { PageData } from './$types';
	import { getImportContext } from './import-marks.remote';

	let { data }: { data: PageData } = $props();

	// --- Types ---
	type ParsedMark = { value: number; isPresent: boolean };
	type ParsedRow = { roll: number; name: string; marks: Record<string, ParsedMark> };
	type ParsedSheet = { sheetName: string; section: string; termNum: number; subjectCols: string[]; rows: ParsedRow[] };
	type MatchedEntry = {
		section: string; termName: string; roll: number; studentName: string;
		dbStudentName: string; subject: string; marksObtained: number; isPresent: boolean;
		sessionEnrollId: number; examSetupId: number;
	};

	// --- State ---
	let step = $state<'idle' | 'parsed' | 'preview' | 'importing' | 'done' | 'error'>('idle');
	let fileName = $state('');
	let parsedClass = $state('');
	let parsedYear = $state(0);
	let parsedSheets = $state<ParsedSheet[]>([]);
	let selectedSession = $state(0);
	let selectedClass = $state(0);
	let matchedEntries = $state<MatchedEntry[]>([]);
	let warnings = $state<string[]>([]);
	let importResult = $state({ inserted: 0 });
	let errorMsg = $state('');
	let isLoading = $state(false);
	let expandedSheets = $state<Record<string, boolean>>({});
	let selectedSheetKeys = $state<Record<string, boolean>>({});

	// --- Helpers ---
	function numberToRoman(num: number): string {
		const romanMap: [number, string][] = [
			[12, 'XII'], [11, 'XI'], [10, 'X'], [9, 'IX'], [8, 'VIII'],
			[7, 'VII'], [6, 'VI'], [5, 'V'], [4, 'IV'], [3, 'III'], [2, 'II'], [1, 'I']
		];
		for (const [value, roman] of romanMap) {
			if (num === value) return roman;
		}
		return String(num);
	}

	// --- Derived ---
	let subjectNames = $derived(data.subjects.map(s => s.name));

	// --- File Upload & Parse ---
	async function handleFile(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;
		const file = input.files[0];
		fileName = file.name;

		// Parse filename — supports two formats:
		// 1. "Class IX (2024).xlsx"  → class name = IX, year = 2024
		// 2. "5-AB 2024.xlsx"       → class number = 5 (maps to class V), year = 2024
		const fnMatchClassic = fileName.match(/^Class\s+([A-Z0-9]+)\s*\(?(\d{4})\)?/i);
		const fnMatchShort = fileName.match(/^(\d{1,2})-[A-Z]+\s+(\d{4})/i);

		if (fnMatchClassic) {
			parsedClass = fnMatchClassic[1];
			parsedYear = parseInt(fnMatchClassic[2]);
		} else if (fnMatchShort) {
			const classNum = parseInt(fnMatchShort[1]);
			parsedClass = numberToRoman(classNum);
			parsedYear = parseInt(fnMatchShort[2]);
		} else {
			errorMsg = `Could not parse filename "${fileName}". Expected format: "Class IX (2024).xlsx" or "5-AB 2024.xlsx"`;
			step = 'error';
			return;
		}

		// Auto-select session by year
		const matchedSession = data.sessions.find(s => s.year === parsedYear);
		if (matchedSession) selectedSession = matchedSession.id;

		// Auto-select class by name (contains match)
		const matchedClass = data.classes.find(c =>
			c.name.toUpperCase().includes(parsedClass.toUpperCase()) ||
			parsedClass.toUpperCase().includes(c.name.toUpperCase())
		);
		if (matchedClass) selectedClass = matchedClass.id;

		// Parse Excel
		const XLSX = await import('xlsx');
		const buf = await file.arrayBuffer();
		const wb = XLSX.read(buf, { type: 'array' });

		const sheets: ParsedSheet[] = [];
		for (const name of wb.SheetNames) {
			const sheetMatch = name.match(/^([A-Z])(\d)$/i);
			if (!sheetMatch) {
				warnings.push(`Skipped sheet "${name}" — does not match pattern like A1, B2.`);
				continue;
			}
			const section = sheetMatch[1].toUpperCase();
			const termNum = parseInt(sheetMatch[2]);
			const raw: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
			if (raw.length < 2) continue;

			// Row 0 = headers
			const headers = raw[0] as (string | null)[];
			// Find subject columns: only those whose header matches a subject name in DB
			const subjectCols: { name: string; colIdx: number }[] = [];
			for (let c = 0; c < headers.length; c++) {
				const h = headers[c];
				if (h && subjectNames.includes(h.trim())) {
					subjectCols.push({ name: h.trim(), colIdx: c });
				}
			}

			// Parse student rows: only rows where col 0 is a positive integer
			const rows: ParsedRow[] = [];
			for (let r = 1; r < raw.length; r++) {
				const row = raw[r] as unknown[];
				if (!row || !row.length) continue;
				const rollVal = row[0];
				if (typeof rollVal !== 'number' || rollVal < 1 || !Number.isInteger(rollVal)) continue;

				const marks: Record<string, ParsedMark> = {};
				for (const sc of subjectCols) {
					const cell = row[sc.colIdx];
					if (cell === undefined || cell === null || cell === '') {
						marks[sc.name] = { value: 0, isPresent: false };
					} else if (typeof cell === 'string' && cell.trim().toLowerCase() === 'ab') {
						marks[sc.name] = { value: 0, isPresent: false };
					} else if (typeof cell === 'number') {
						marks[sc.name] = { value: Math.round(cell * 10) / 10, isPresent: true };
					} else {
						const num = parseFloat(String(cell));
						if (!isNaN(num)) {
							marks[sc.name] = { value: Math.round(num * 10) / 10, isPresent: true };
						} else {
							marks[sc.name] = { value: 0, isPresent: false };
						}
					}
				}
				const nameVal = row[1];
				rows.push({
					roll: rollVal,
					name: typeof nameVal === 'string' ? nameVal.trim() : `Roll ${rollVal}`,
					marks
				});
			}
			sheets.push({ sheetName: name, section, termNum, subjectCols: subjectCols.map(s => s.name), rows });
		}
		parsedSheets = sheets;
		step = 'parsed';
	}

	// --- Load context & match ---
	async function loadAndMatch() {
		if (!selectedSession || !selectedClass) return;
		isLoading = true;
		warnings = [];
		matchedEntries = [];

		try {
			const ctx = await getImportContext({ sessionId: selectedSession, classId: selectedClass }).run();
			const entries: MatchedEntry[] = [];

			for (const sheet of parsedSheets) {
				// Match section
				const dbSection = ctx.sections.find(s => s.letter.toUpperCase() === sheet.section);
				if (!dbSection) {
					warnings.push(`Sheet "${sheet.sheetName}": No DB section found for letter "${sheet.section}".`);
					continue;
				}

				// Match term
				const dbTerm = data.examTerms.find(t => t.id === sheet.termNum);
				const termName = dbTerm?.name ?? `Term ${sheet.termNum}`;

				// Enrollments for this section
				const sectionEnrollments = ctx.enrollments.filter(e => e.sectionId === dbSection.id);

				for (const row of sheet.rows) {
					const enrollment = sectionEnrollments.find(e => e.rollNo === row.roll);
					if (!enrollment) {
						warnings.push(`Sheet "${sheet.sheetName}": Roll ${row.roll} (${row.name}) is in Excel but NOT in DB enrollments.`);
						continue;
					}

					for (const subName of sheet.subjectCols) {
						const dbSubject = data.subjects.find(s => s.name === subName);
						if (!dbSubject) continue;

						const setup = ctx.examSetups.find(
							s => s.subjectId === dbSubject.id && s.examTermId === sheet.termNum
						);
						if (!setup) {
							warnings.push(`Sheet "${sheet.sheetName}": No exam setup for "${subName}" in ${termName}.`);
							continue;
						}

						const mark = row.marks[subName];
						entries.push({
							section: sheet.section,
							termName,
							roll: row.roll,
							studentName: row.name,
							dbStudentName: enrollment.studentName,
							subject: subName,
							marksObtained: mark.value,
							isPresent: mark.isPresent,
							sessionEnrollId: enrollment.seid,
							examSetupId: setup.setupId
						});
					}
				}

				// Check for DB students missing from the Excel sheet
				const excelRolls = new Set(sheet.rows.map(r => r.roll));
				for (const enr of sectionEnrollments) {
					if (!excelRolls.has(enr.rollNo)) {
						warnings.push(`Sheet "${sheet.sheetName}": Roll ${enr.rollNo} (${enr.studentName}) is in DB but NOT in Excel file.`);
					}
				}
			}

			matchedEntries = entries;
			// Auto-select all sheet groups
			const keys: Record<string, boolean> = {};
			for (const e of entries) {
				keys[`${e.section}|${e.termName}`] = true;
			}
			selectedSheetKeys = keys;
			step = 'preview';
		} catch (err) {
			errorMsg = String(err);
			step = 'error';
		} finally {
			isLoading = false;
		}
	}

	// --- Selected entries (filtered by checkbox) ---
	let selectedEntries = $derived(
		matchedEntries.filter(e => selectedSheetKeys[`${e.section}|${e.termName}`])
	);

	function toggleSheetSelection(key: string) {
		selectedSheetKeys = { ...selectedSheetKeys, [key]: !selectedSheetKeys[key] };
	}

	// --- Import ---
	async function doImport() {
		step = 'importing';
		try {
			const payload = selectedEntries.map(e => ({
				sessionEnrollId: e.sessionEnrollId,
				examSetupId: e.examSetupId,
				marksObtained: e.marksObtained,
				isPresent: e.isPresent
			}));
			const res = await fetch('/admin/import-marks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entries: payload })
			});
			if (!res.ok) throw new Error(`Server error: ${res.status}`);
			const result = await res.json();
			importResult = result;
			step = 'done';
		} catch (err) {
			errorMsg = String(err);
			step = 'error';
		}
	}

	function reset() {
		step = 'idle';
		fileName = '';
		parsedSheets = [];
		matchedEntries = [];
		warnings = [];
		errorMsg = '';
		expandedSheets = {};
		selectedSheetKeys = {};
	}

	// Group entries by sheet for preview
	let groupedEntries = $derived.by(() => {
		const groups: Record<string, MatchedEntry[]> = {};
		for (const e of matchedEntries) {
			const key = `${e.section}|${e.termName}`;
			if (!groups[key]) groups[key] = [];
			groups[key].push(e);
		}
		return groups;
	});

	function toggleSheet(key: string) {
		expandedSheets = { ...expandedSheets, [key]: !expandedSheets[key] };
	}
</script>

<svelte:head>
	<title>Import Marks | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<div class="page-hero">
		<div class="hero-content">
			<div class="hero-header">
				<h1 class="page-title">Import Marks from Excel</h1>
				<p class="page-subtitle">Upload an Excel file to bulk-import marks into the database.</p>
			</div>
		</div>
	</div>

	<!-- Step 1: Upload -->
	{#if step === 'idle'}
		<div class="card upload-card">
			<div class="upload-zone">
				<svg class="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
				</svg>
				<p class="upload-label">Select an Excel file</p>
				<p class="upload-hint">Format: <code>Class IX (2024).xlsx</code> or <code>5-AB 2024.xlsx</code></p>
				<label class="upload-btn">
					Choose File
					<input type="file" accept=".xlsx,.xls" onchange={handleFile} class="sr-only" />
				</label>
			</div>
		</div>
	{/if}

	<!-- Step 2: Parsed — Configure -->
	{#if step === 'parsed'}
		<div class="card config-card">
			<h2 class="card-title">File Parsed Successfully</h2>
			<div class="parsed-info">
				<div class="info-chip"><strong>File:</strong> {fileName}</div>
				<div class="info-chip"><strong>Class:</strong> {parsedClass}</div>
				<div class="info-chip"><strong>Year:</strong> {parsedYear}</div>
				<div class="info-chip"><strong>Sheets:</strong> {parsedSheets.map(s => s.sheetName).join(', ')}</div>
			</div>

			<div class="config-row">
				<div class="config-field">
					<label for="session-select">Session</label>
					<select id="session-select" bind:value={selectedSession} class="form-select">
						<option value={0}>Select session</option>
						{#each data.sessions as s (s.id)}
							<option value={s.id}>{s.name} ({s.year})</option>
						{/each}
					</select>
				</div>
				<div class="config-field">
					<label for="class-select">Class</label>
					<select id="class-select" bind:value={selectedClass} class="form-select">
						<option value={0}>Select class</option>
						{#each data.classes as c (c.id)}
							<option value={c.id}>{c.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="config-actions">
				<button class="btn-secondary" onclick={reset}>Cancel</button>
				<button class="btn-primary" onclick={loadAndMatch} disabled={!selectedSession || !selectedClass || isLoading}>
					{#if isLoading}Matching…{:else}Load & Match{/if}
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 3: Preview -->
	{#if step === 'preview'}
		<div class="card preview-card">
			<div class="preview-header">
				<h2 class="card-title">Preview — {selectedEntries.length} of {matchedEntries.length} entries selected</h2>
				<div class="preview-actions">
					<button class="btn-secondary" onclick={reset}>Cancel</button>
					<button class="btn-primary import-btn" onclick={doImport} disabled={selectedEntries.length === 0}>
						Import {selectedEntries.length} Entries
					</button>
				</div>
			</div>

			{#if warnings.length > 0}
				<details class="warnings-box">
					<summary class="warnings-summary">⚠ {warnings.length} warning{warnings.length > 1 ? 's' : ''}</summary>
					<ul class="warnings-list">
						{#each warnings as w, i (i)}
							<li>{w}</li>
						{/each}
					</ul>
				</details>
			{/if}

			{#each Object.entries(groupedEntries) as [key, entries], gi (gi)}
				{@const [sec, term] = key.split('|')}
				{@const uniqueRolls = new Set(entries.map(e => e.roll)).size}
				{@const uniqueSubjects = new Set(entries.map(e => e.subject)).size}
				<div class="sheet-group" class:sheet-deselected={!selectedSheetKeys[key]}>
					<div class="sheet-header">
						<span class="sheet-checkbox">
							<input type="checkbox" checked={selectedSheetKeys[key] ?? false} onchange={() => toggleSheetSelection(key)} />
						</span>
						<button class="sheet-toggle" onclick={() => toggleSheet(key)}>
							<div class="sheet-info">
								<span class="sheet-badge">Section {sec}</span>
								<span class="sheet-term">{term}</span>
								<span class="sheet-stats">{uniqueRolls} students · {uniqueSubjects} subjects · {entries.length} marks</span>
							</div>
							<span class="chevron" class:rotated={expandedSheets[key]}>▸</span>
						</button>
					</div>

					{#if expandedSheets[key]}
						<div class="sheet-table-wrap" in:fade={{ duration: 200 }}>
							<table class="data-table">
								<thead>
									<tr>
										<th class="col-roll">Roll</th>
										<th>Student (Excel)</th>
										<th>Student (DB)</th>
										<th>Subject</th>
										<th class="text-right">Marks</th>
										<th class="text-center">Present</th>
									</tr>
								</thead>
								<tbody>
									{#each entries as entry, ei (ei)}
										<tr>
											<td class="tabular-nums">{entry.roll}</td>
											<td>{entry.studentName}</td>
											<td>{entry.dbStudentName}</td>
											<td>{entry.subject}</td>
											<td class="text-right tabular-nums">{entry.marksObtained}</td>
											<td class="text-center">{entry.isPresent ? '✓' : 'Ab'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Importing -->
	{#if step === 'importing'}
		<div class="card status-card">
			<div class="spinner"></div>
			<p>Importing marks… please wait.</p>
		</div>
	{/if}

	<!-- Done -->
	{#if step === 'done'}
		<div class="card status-card success-card">
			<svg class="status-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<h2>Import Complete</h2>
			<p><strong>{importResult.inserted}</strong> marks entries imported successfully.</p>
			<button class="btn-primary" onclick={reset}>Import Another File</button>
		</div>
	{/if}

	<!-- Error -->
	{#if step === 'error'}
		<div class="card status-card error-card">
			<p class="error-text">{errorMsg}</p>
			<button class="btn-secondary" onclick={reset}>Try Again</button>
		</div>
	{/if}
</div>

<style>
	.page-shell {
		padding: 0 12px 32px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	@media (min-width: 640px) {
		.page-shell { padding: 0 20px 32px; gap: 24px; }
	}
	.page-hero { padding: 24px 0 0; }
	.hero-content {
		display: flex; flex-direction: column; gap: 16px;
		background-color: var(--color-surface-lowest);
		padding: 16px; border-radius: var(--radius-xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
	}
	@media (min-width: 640px) {
		.hero-content { padding: 24px; border-radius: var(--radius-2xl); }
	}
	.page-title {
		font-family: var(--font-heading); font-size: 32px; font-weight: 700;
		color: var(--color-on-surface); letter-spacing: -0.02em; margin: 0;
	}
	.page-subtitle {
		font-family: var(--font-body); font-size: 14px;
		color: var(--color-on-surface-variant); margin-top: 6px; line-height: 1.5;
	}
	.card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-outline-variant);
		overflow: hidden; padding: 24px;
	}
	.card-title {
		font-size: 18px; font-weight: 700;
		color: var(--color-on-surface); margin: 0 0 16px;
	}

	/* Upload */
	.upload-zone {
		display: flex; flex-direction: column; align-items: center;
		justify-content: center; padding: 48px 24px;
		border: 2px dashed var(--color-outline-variant); border-radius: var(--radius-lg);
		text-align: center; transition: border-color 200ms;
	}
	.upload-zone:hover { border-color: var(--color-primary); }
	.upload-icon {
		width: 48px; height: 48px; color: var(--color-primary); margin-bottom: 16px;
	}
	.upload-label {
		font-size: 16px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 4px;
	}
	.upload-hint {
		font-size: 13px; color: var(--color-on-surface-variant); margin-bottom: 16px;
	}
	.upload-hint code {
		background: var(--color-surface-high); padding: 2px 6px; border-radius: 4px; font-size: 12px;
	}
	.upload-btn {
		display: inline-flex; align-items: center; gap: 8px;
		background-color: var(--color-primary); color: var(--color-on-primary); border: none;
		border-radius: var(--radius-md); padding: 10px 24px;
		font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;
	}
	.upload-btn:hover { background-color: color-mix(in srgb, var(--color-primary) 80%, black); }
	.sr-only {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
		overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
	}

	/* Config */
	.parsed-info {
		display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;
	}
	.info-chip {
		background: var(--color-surface-high); padding: 6px 12px;
		border-radius: var(--radius-md); font-size: 13px; color: var(--color-on-surface);
	}
	.config-row {
		display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 20px;
	}
	.config-field {
		flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px;
	}
	.config-field label {
		font-size: 12px; font-weight: 600; text-transform: uppercase;
		color: var(--color-on-surface-variant);
	}
	.config-actions {
		display: flex; gap: 12px; justify-content: flex-end;
	}
	.form-select {
		border-radius: var(--radius-lg); border: 1px solid var(--color-outline);
		background-color: var(--color-surface); padding: 10px 16px;
		font-size: 14px; color: var(--color-on-surface); transition: all 200ms ease; width: 100%;
	}
	.form-select:focus {
		border-color: var(--color-primary); outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	/* Buttons */
	.btn-primary {
		display: inline-flex; align-items: center; gap: 8px;
		background-color: var(--color-primary); color: var(--color-on-primary); border: none;
		border-radius: var(--radius-md); padding: 10px 20px;
		font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;
	}
	.btn-primary:hover { background-color: color-mix(in srgb, var(--color-primary) 80%, black); }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-secondary {
		display: inline-flex; align-items: center; gap: 8px;
		background-color: var(--color-surface-high); color: var(--color-on-surface);
		border: 1px solid var(--color-outline-variant);
		border-radius: var(--radius-md); padding: 10px 20px;
		font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
	}
	.btn-secondary:hover { background-color: var(--color-surface); }

	/* Preview */
	.preview-header {
		display: flex; justify-content: space-between; align-items: center;
		flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
	}
	.preview-actions { display: flex; gap: 12px; }
	.btn-primary.import-btn {
		background-color: #16a34a;
		color: #fff;
	}
	.btn-primary.import-btn:hover {
		background-color: #15803d;
	}

	/* Warnings */
	.warnings-box {
		background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 40%, transparent);
		border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px;
	}
	.warnings-summary {
		font-size: 14px; font-weight: 600; cursor: pointer;
		color: var(--color-on-surface);
	}
	.warnings-list {
		margin: 8px 0 0 16px; font-size: 13px;
		color: var(--color-on-surface-variant); line-height: 1.6;
	}

	/* Sheet groups */
	.sheet-group {
		border: 1px solid var(--color-outline-variant);
		border-radius: var(--radius-md); margin-bottom: 12px; overflow: hidden;
	}
	.sheet-deselected { opacity: 0.5; }
	.sheet-header {
		width: 100%; display: flex; align-items: center; gap: 0;
		background: var(--color-surface-high);
		font-size: 14px; color: var(--color-on-surface); transition: background 150ms;
	}
	.sheet-checkbox {
		display: flex; align-items: center; justify-content: center;
		padding: 12px 4px 12px 16px; cursor: pointer; flex-shrink: 0;
	}
	.sheet-checkbox input {
		width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-primary);
	}
	.sheet-toggle {
		flex: 1; display: flex; justify-content: space-between; align-items: center;
		padding: 12px 16px 12px 8px; background: none; border: none;
		cursor: pointer; text-align: left; color: inherit; font-size: inherit;
	}
	.sheet-toggle:hover { background: color-mix(in srgb, var(--color-surface) 50%, transparent); }
	.sheet-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
	.sheet-badge {
		background: var(--color-primary); color: var(--color-on-primary);
		padding: 2px 10px; border-radius: 99px; font-size: 12px; font-weight: 700;
	}
	.sheet-term { font-weight: 600; }
	.sheet-stats { font-size: 12px; color: var(--color-on-surface-variant); }
	.chevron {
		font-size: 16px; transition: transform 200ms; color: var(--color-on-surface-variant);
	}
	.chevron.rotated { transform: rotate(90deg); }

	/* Data table */
	.sheet-table-wrap { overflow-x: auto; }
	.data-table {
		width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;
	}
	.data-table th {
		padding: 8px 12px; font-size: 11px; font-weight: 600;
		text-transform: uppercase; letter-spacing: 0.03em;
		color: var(--color-on-surface-variant); background-color: var(--color-surface-high);
		border-bottom: 2px solid var(--color-outline-variant); white-space: nowrap;
	}
	.data-table td {
		padding: 6px 12px; border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface); white-space: nowrap;
	}
	.data-table tbody tr:hover {
		background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
	}
	.col-roll { width: 60px; }
	.text-right { text-align: right; }
	.text-center { text-align: center; }
	.tabular-nums { font-variant-numeric: tabular-nums; }

	/* Status cards */
	.status-card {
		display: flex; flex-direction: column; align-items: center;
		justify-content: center; text-align: center; padding: 48px 24px; gap: 16px;
	}
	.status-icon-svg { width: 64px; height: 64px; color: var(--color-status-success); }
	.success-card h2 { color: var(--color-status-success); margin: 0; }
	.success-card p { font-size: 16px; color: var(--color-on-surface-variant); }
	.error-card { border-color: var(--color-error); }
	.error-text { color: var(--color-error); font-size: 14px; }

	/* Spinner */
	.spinner {
		width: 40px; height: 40px; border: 4px solid var(--color-outline-variant);
		border-top-color: var(--color-primary); border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
</style>
