<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleSessionChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const url = new URL(page.url);
		url.searchParams.set('sessionId', select.value);
		goto(resolve((url.pathname + url.search) as "/"), { replaceState: true, keepFocus: true });
	}

	function printTable(type: 'section' | 'caste') {
		const className = `print-${type}-only`;
		document.body.classList.add(className);
		window.print();
		
		const cleanup = () => {
			document.body.classList.remove(className);
			window.removeEventListener('afterprint', cleanup);
		};
		window.addEventListener('afterprint', cleanup);
		setTimeout(cleanup, 1000);
	}
</script>

<svelte:head>
	<title>Enrolment Report — Darpan</title>
	<meta name="description" content="Detailed enrolment reports by class, section, roll number, transfer status, and caste category." />
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<!-- Print-only headers that appear only during paper/PDF printing -->
	<div class="print-only-header print-header-section text-center">
		<h1 class="print-school-name">DARPAN ACADEMY</h1>
		<h2 class="print-report-title">Class &amp; Section-Wise Enrolment Report</h2>
		<p class="print-session-info">Academic Session: {data.sessionName}</p>
	</div>

	<div class="print-only-header print-header-caste text-center">
		<h1 class="print-school-name">DARPAN ACADEMY</h1>
		<h2 class="print-report-title">Caste-Based Enrolment Report</h2>
		<p class="print-session-info">Academic Session: {data.sessionName}</p>
	</div>

	<!-- Screen page header -->
	<header class="page-header non-printable">
		<div class="header-main">
			<div>
				<h1 class="page-title">Enrolment Report</h1>
				<p class="page-subtitle">Detailed statistics on school enrolment per session.</p>
			</div>
			
			<div class="filter-controls">
				<label for="session-filter-select" class="sr-only">Select Session</label>
				<select 
					id="session-filter-select" 
					value={data.selectedSessionId} 
					onchange={handleSessionChange} 
					class="session-select"
				>
					{#each data.sessions as session (session.id)}
						<option value={session.id}>Session: {session.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</header>

	<div class="report-content grid gap-8">
		<!-- Table 1: Section-Wise Enrolment -->
		<section class="report-section section-table-card">
			<div class="section-header non-printable">
				<h2 class="section-title">
					<svg class="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
					Class &amp; Section-Wise Enrolment
				</h2>
				
				<button 
					id="print-section-wise-btn" 
					class="print-button"
					onclick={() => printTable('section')}
					aria-label="Print Section-Wise Table"
				>
					<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
					</svg>
					Print Table
				</button>
			</div>

			<div class="table-container">
				<table class="report-table">
					<thead>
						<tr>
							<th>Class</th>
							<th>Section</th>
							<th>Last Roll</th>
							<th>TC Students</th>
							<th>Total in Section</th>
							<th>Total in Class</th>
						</tr>
					</thead>
					<tbody>
						{#each data.sectionReports as cls (cls.classId)}
							{#each cls.sections as sec, i (sec.sectionId)}
								<tr>
									{#if i === 0}
										<td rowspan={cls.sections.length} class="class-column font-semibold">
											{cls.className}
										</td>
									{/if}
									<td class="text-center font-medium">Section {sec.letter}</td>
									<td class="text-center">{sec.lastRoll || '—'}</td>
									<td class="text-center tc-highlight" class:has-tc={sec.tcCount > 0}>
										{sec.tcCount}
									</td>
									<td class="text-center font-medium">{sec.activeCount}</td>
									{#if i === 0}
										<td rowspan={cls.sections.length} class="class-total-column text-center font-semibold">
											{cls.totalActiveInClass}
										</td>
									{/if}
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="6" class="no-records">No enrolment records found for this session.</td>
							</tr>
						{/each}
					</tbody>
					{#if data.sectionReports.length > 0}
						<tfoot>
							<tr class="totals-row font-bold">
								<td colspan="3" class="text-right">Grand Total:</td>
								<td class="text-center">{data.grandTotals.tc}</td>
								<td class="text-center">{data.grandTotals.active}</td>
								<td class="text-center">{data.grandTotals.active}</td>
							</tr>
						</tfoot>
					{/if}
				</table>
			</div>
		</section>
		<br> <br>
		<!-- Table 2: Caste-Based Enrolment -->
		<section class="report-section caste-table-card">
			<div class="section-header non-printable">
				<h2 class="section-title">
					<svg class="section-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
					Caste-Based Enrolment (Active)
				</h2>
				
				<button 
					id="print-caste-wise-btn" 
					class="print-button"
					onclick={() => printTable('caste')}
					aria-label="Print Caste-Based Table"
				>
					<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
					</svg>
					Print Table
				</button>
			</div>

			<div class="table-container">
				<table class="report-table">
					<thead>
						<tr>
							<th>Class</th>
							<th>General</th>
							<th>SC</th>
							<th>ST</th>
							<th>OBC-A</th>
							<th>OBC-B</th>
							<th>Total Active</th>
						</tr>
					</thead>
					<tbody>
						{#each data.casteReports as cls (cls.classId)}
							<tr>
								<td class="class-column font-semibold">{cls.className}</td>
								<td class="text-center">{cls.gen}</td>
								<td class="text-center">{cls.sc}</td>
								<td class="text-center">{cls.st}</td>
								<td class="text-center">{cls.obcA}</td>
								<td class="text-center">{cls.obcB}</td>
								<td class="text-center font-bold bg-surface-variant-alpha">{cls.total}</td>
							</tr>
						{:else}
							<tr>
								<td colspan="7" class="no-records">No enrolment records found for this session.</td>
							</tr>
						{/each}
					</tbody>
					{#if data.casteReports.length > 0}
						<tfoot>
							<tr class="totals-row font-bold">
								<td>Grand Total:</td>
								<td class="text-center">{data.grandTotals.caste.gen}</td>
								<td class="text-center">{data.grandTotals.caste.sc}</td>
								<td class="text-center">{data.grandTotals.caste.st}</td>
								<td class="text-center">{data.grandTotals.caste.obcA}</td>
								<td class="text-center">{data.grandTotals.caste.obcB}</td>
								<td class="text-center">{data.grandTotals.caste.total}</td>
							</tr>
						</tfoot>
					{/if}
				</table>
			</div>
		</section>
	</div>
</div>

<style>
	.page-shell {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.page-header {
		margin-bottom: 8px;
	}

	.header-main {
		display: flex;
		flex-direction: column;
		gap: 16px;
		justify-content: space-between;
		align-items: flex-start;
	}

	@media (min-width: 640px) {
		.header-main {
			flex-direction: row;
			align-items: center;
		}
	}

	.page-title {
		font-family: var(--font-heading);
		font-size: 26px;
		font-weight: 700;
		color: var(--color-on-surface);
		letter-spacing: -0.02em;
	}

	.page-subtitle {
		font-family: var(--font-body);
		font-size: 14px;
		color: var(--color-on-surface-variant);
		margin-top: 4px;
	}

	.filter-controls {
		display: flex;
		align-items: center;
	}

	.session-select {
		height: 44px;
		min-width: 180px;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		color: var(--color-on-surface);
		font-size: 14px;
		font-weight: 500;
		padding: 0 16px;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 12px center;
		background-repeat: no-repeat;
		background-size: 20px 20px;
		padding-right: 40px;
		box-shadow: var(--shadow-ambient-sm);
		transition: border-color 200ms ease, box-shadow 200ms ease;
	}

	.session-select:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.report-section {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-sm);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid var(--color-outline-variant);
		background-color: color-mix(in srgb, var(--color-surface-high) 30%, transparent);
	}

	.section-title {
		font-family: var(--font-heading);
		font-size: 18px;
		font-weight: 600;
		color: var(--color-on-surface);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.section-icon {
		width: 22px;
		height: 22px;
		color: var(--color-primary);
	}

	.print-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background-color: var(--color-secondary-container);
		color: var(--color-on-secondary-container);
		border: none;
		border-radius: var(--radius-lg);
		font-size: 14px;
		font-weight: 500;
		padding: 8px 16px;
		cursor: pointer;
		min-height: 44px;
		transition: all 150ms ease;
	}

	.print-button:hover {
		background-color: color-mix(in srgb, var(--color-secondary-container) 90%, black);
	}

	.btn-icon {
		width: 18px;
		height: 18px;
	}

	.table-container {
		width: 100%;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.report-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 14px;
	}

	.report-table th {
		background-color: color-mix(in srgb, var(--color-surface-high) 15%, transparent);
		color: var(--color-on-surface-variant);
		font-weight: 600;
		padding: 14px 20px;
		border-bottom: 2px solid var(--color-outline-variant);
	}

	.report-table td {
		padding: 14px 20px;
		border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
		vertical-align: middle;
	}

	.report-table tbody tr:hover {
		background-color: color-mix(in srgb, var(--color-surface-high) 8%, transparent);
	}

	.class-column {
		background-color: color-mix(in srgb, var(--color-surface-high) 5%, transparent);
		font-weight: 600;
		color: var(--color-primary);
	}

	.class-total-column {
		font-weight: 600;
		color: var(--color-on-surface);
		background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
	}

	.tc-highlight {
		color: var(--color-on-surface-variant);
	}

	.tc-highlight.has-tc {
		color: var(--color-error);
		font-weight: 500;
	}

	.bg-surface-variant-alpha {
		background-color: color-mix(in srgb, var(--color-surface-high) 10%, transparent);
	}

	.no-records {
		text-align: center;
		padding: 40px !important;
		color: var(--color-on-surface-variant);
		font-style: italic;
	}

	.totals-row {
		background-color: color-mix(in srgb, var(--color-surface-high) 20%, transparent);
	}

	.totals-row td {
		border-top: 2px solid var(--color-on-surface-variant);
		border-bottom: 2px solid var(--color-on-surface-variant);
		color: var(--color-on-surface);
	}

	.print-only-header {
		display: none;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* ── Printing Styles ── */
	@media print {
		/* Hide screen headers/layouts when printing */
		:global(body.print-section-only .sidebar),
		:global(body.print-section-only .header),
		:global(body.print-section-only .bottom-nav),
		:global(body.print-section-only .non-printable),
		:global(body.print-section-only .caste-table-card),
		
		:global(body.print-caste-only .sidebar),
		:global(body.print-caste-only .header),
		:global(body.print-caste-only .bottom-nav),
		:global(body.print-caste-only .non-printable),
		:global(body.print-caste-only .section-table-card) {
			display: none !important;
		}

		/* Format print page */
		:global(body.print-section-only), 
		:global(body.print-caste-only) {
			background: white !important;
			color: black !important;
			padding: 0 !important;
			margin: 0 !important;
		}

		:global(body.print-section-only .app-main),
		:global(body.print-caste-only .app-main) {
			padding: 0 !important;
			margin: 0 !important;
		}

		/* Enable print titles */
		.print-only-header {
			margin-top: 10px;
			margin-bottom: 25px;
			text-align: center;
		}

		:global(body.print-section-only .print-header-section) {
			display: block !important;
		}

		:global(body.print-caste-only .print-header-caste) {
			display: block !important;
		}

		.print-school-name {
			font-family: 'Inter', sans-serif;
			font-size: 26px;
			font-weight: 800;
			letter-spacing: 0.05em;
			margin-bottom: 5px;
			color: #000 !important;
		}

		.print-report-title {
			font-family: 'Inter', sans-serif;
			font-size: 18px;
			font-weight: 600;
			margin-bottom: 5px;
			color: #444 !important;
		}

		.print-session-info {
			font-family: 'Inter', sans-serif;
			font-size: 13px;
			color: #666 !important;
		}

		/* Enforce clean black and white tables with crisp borders */
		.report-section {
			border: none !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			background: transparent !important;
			padding: 0 !important;
			margin: 0 !important;
			display: block !important;
		}

		.table-container {
			overflow: visible !important;
		}

		.report-table {
			width: 100% !important;
			border-collapse: collapse !important;
			font-size: 11pt !important;
		}

		.report-table th, 
		.report-table td {
			border: 1px solid #000 !important;
			color: #000 !important;
			padding: 8px 10px !important;
			background: transparent !important;
		}

		.report-table th {
			font-weight: bold !important;
			background-color: #f0f0f0 !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		.class-column, 
		.class-total-column, 
		.totals-row td {
			background-color: transparent !important;
			color: #000 !important;
		}
		
		.totals-row td {
			font-weight: bold !important;
			border-top: 2px double #000 !important;
			border-bottom: 2px double #000 !important;
		}
	}
</style>
