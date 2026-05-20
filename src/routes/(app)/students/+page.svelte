<script lang="ts">
	import { getClasses, getSections, getFilteredStudents } from './students.remote';
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Reactive state for filters and list
	// svelte-ignore state_referenced_locally
	let currentQuery = $state(data.query || '');
	// svelte-ignore state_referenced_locally
	let currentSession = $state(data.filters.session);
	// svelte-ignore state_referenced_locally
	let currentClass = $state(data.filters.class);
	// svelte-ignore state_referenced_locally
	let classes = $state(data.classes);
	// svelte-ignore state_referenced_locally
	let currentSection = $state(data.filters.section);
	// svelte-ignore state_referenced_locally
	let sections = $state(data.sections);

	// svelte-ignore state_referenced_locally
	let students = $state(data.students);
	// svelte-ignore state_referenced_locally
	let currentPage = $state(data.page);
	// svelte-ignore state_referenced_locally
	let totalPages = $state(data.totalPages);
	// svelte-ignore state_referenced_locally
	let hasNextPage = $state(data.hasNextPage);
	// svelte-ignore state_referenced_locally
	let totalRecords = $state(data.totalRecords);

	async function fetchStudents(pageToFetch = 1) {
	try {
			const result = await getFilteredStudents({
				q: currentQuery,
				session: currentSession,
				class: currentClass,
				section: currentSection,
				page: pageToFetch
			}).run();
			students = result.students;
			currentPage = result.page;
			totalPages = result.totalPages;
			hasNextPage = result.hasNextPage;
			totalRecords = result.totalRecords;
		} catch (error) {
			console.error("fetchStudents error:", error);
			alert("Error fetching students: " + error);
		}
	}

	async function handleClassChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const newClassId = target.value;
		currentClass = newClassId;
		
		if (newClassId) {
			const fetchedSections = await getSections(parseInt(newClassId)).run();
			sections = fetchedSections;
		} else {
			sections = [];
		}
		// Always reset section so all sections of the chosen class are shown initially
		currentSection = '';
		fetchStudents(1);
	}

	async function handleSessionChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		currentSession = target.value;
		classes = await getClasses(parseInt(currentSession)).run();
		
		// Reset class and section so all students in the session are shown
		currentClass = '';
		sections = [];
		currentSection = '';

		fetchStudents(1);
	}

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		currentQuery = target.value;
		if (currentQuery.length >= 3 || currentQuery.length === 0) {
			fetchStudents(1);
		}
	}
</script>

<svelte:head>
	<title>Students | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<section class="page-hero">
		<div class="hero-content">
			<div class="hero-text">
				<h1 class="page-title">Students Registry</h1>
				<p class="page-subtitle">Manage and search through the student records.</p>
				<div class="record-count">
					<span class="status-indicator">
						<span class="status-ping" class:bg-amber={totalRecords === 0} class:bg-emerald={totalRecords > 0}></span>
						<span class="status-dot" class:bg-amber-solid={totalRecords === 0} class:bg-emerald-solid={totalRecords > 0}></span>
					</span>
					<span class="count-text">
						Showing <strong class="count-number">{totalRecords}</strong> students
					</span>
				</div>
			</div>
			
			<div class="filters-container">
				<!-- Search -->
				<div class="search-box">
					<div class="search-icon-wrapper">
						<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input 
						type="search" 
						value={currentQuery}
						oninput={handleSearchInput}
						onkeydown={(e) => { if (e.key === 'Enter') fetchStudents(1); }}
						placeholder="Search name or Portal ID..." 
						class="search-input"
					>
				</div>

				<div class="filter-divider"></div>

				<!-- Filters -->
				<div class="dropdown-filters">
					<select value={currentSession} onchange={handleSessionChange} class="filter-select">
						{#each data.sessions as session (session.id)}
							<option value={session.id.toString()}>{session.name}</option>
						{/each}
					</select>

					<select 
						value={currentClass} 
						onchange={handleClassChange}
						class="filter-select"
					>
						<option value="">Select Class</option>
						{#each classes as cls (cls.id)}
							<option value={cls.id.toString()}>{cls.name}</option>
						{/each}
					</select>

					<select 
						value={currentSection}
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							currentSection = target.value;
							fetchStudents(1);
						}}
						class="filter-select"
						disabled={!currentClass}
					>
						<option value="">Select Section</option>
						{#each sections as sec (sec.id)}
							<option value={sec.id.toString()}>Section {sec.letter}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</section>

	<div class="table-container">
		<div class="table-scroll">
			<table class="data-table">
				<thead>
					<tr>
						<th>SL</th>
						<th>Name</th>
						<th>Class</th>
						<th>Section</th>
						<th>Roll</th>
						<th>Guardian No.</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each students as student, i (student.sid)}
					<tr class:student-transferred={student.transferDate}>
						<td>{((currentPage - 1) * 80) + (i + 1)}</td>
						<td class="font-medium">
							{student.name}
							{#if student.transferDate}
								<span class="transfer-badge">Transferred</span>
							{/if}
						</td>
						<td class="text-secondary">{student.className || '-'}</td>
						<td class="text-secondary">{student.sectionLetter || '-'}</td>
						<td class="text-secondary">{student.rollNo || '-'}</td>
						<td class="text-secondary">{student.guardianNo}</td>
						<td>
							<div class="actions-flex">
								<a href={resolve(`/students/${student.sid}` as "/")} class="action-icon-link view" title="View Details">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
								</a>
								{#if student.transferDate}
									<a href={resolve(`/students/${student.sid}/transfer-certificate` as "/")} class="action-icon-link cert" title="Print Transfer Certificate">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
									</a>
								{:else}
									<button type="button" class="action-icon-link cert" title="Bonafide Certificate">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
									</button>
									{#if currentSession === data.sessions[0]?.id.toString()}
										<a href={resolve(`/students/transferred?sid=${student.sid}` as "/")} class="action-icon-link transfer" title="Transfer Student">
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
										</a>
									{:else}
										<button type="button" class="action-icon-link transfer" disabled title="Cannot transfer student from a previous session">
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
										</button>
									{/if}
								{/if}
							</div>
						</td>
					</tr>
					{/each}
					{#if students.length === 0}
					<tr>
						<td colspan="7" class="empty-state">
							<div class="empty-icon-wrapper">
								<svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
								</svg>
							</div>
							<h3 class="empty-title">No students found</h3>
							<p class="empty-subtitle">We couldn't find any records matching your criteria.</p>
						</td>
					</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Pagination -->
	<div class="pagination-container">
		<p class="pagination-info">
			Page <span class="pagination-current">{currentPage}</span> of <span class="pagination-total">{totalPages}</span>
		</p>
		<div class="pagination-controls">
			<button 
				onclick={() => fetchStudents(1)} 
				disabled={currentPage === 1}
				title="First Page"
				class="pagination-btn hidden-mobile"
			>
				First
			</button>
			<button 
				onclick={() => fetchStudents(currentPage - 1)} 
				disabled={currentPage === 1}
				class="pagination-btn"
			>
				Previous
			</button>
			<button 
				onclick={() => fetchStudents(currentPage + 1)} 
				disabled={!hasNextPage}
				class="pagination-btn"
			>
				Next
			</button>
			<button 
				onclick={() => fetchStudents(totalPages)} 
				disabled={currentPage === totalPages}
				title="Last Page"
				class="pagination-btn hidden-mobile"
			>
				Last
			</button>
		</div>
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

	.hero-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
		background-color: var(--color-surface-lowest);
		padding: 24px;
		border-radius: var(--radius-2xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
	}

	@media (min-width: 768px) {
		.hero-content {
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-start;
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
	}

	.record-count {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 16px;
	}

	.status-indicator {
		position: relative;
		display: flex;
		height: 10px;
		width: 10px;
	}

	.status-ping {
		position: absolute;
		display: inline-flex;
		height: 100%;
		width: 100%;
		border-radius: 50%;
		opacity: 0.75;
		animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	.status-dot {
		position: relative;
		display: inline-flex;
		height: 10px;
		width: 10px;
		border-radius: 50%;
	}

	.bg-amber { background-color: #fbbf24; }
	.bg-amber-solid { background-color: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.8); }
	.bg-emerald { background-color: #34d399; }
	.bg-emerald-solid { background-color: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.8); }

	.count-text {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-on-surface-variant);
	}

	.count-number {
		color: var(--color-on-surface);
		font-size: 16px;
	}

	.filters-container {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 16px;
		width: 100%;
	}

	@media (min-width: 768px) {
		.filters-container {
			width: auto;
		}
	}

	.search-box {
		position: relative;
		width: 100%;
	}

	@media (min-width: 640px) {
		.search-box {
			width: 280px;
		}
	}

	.search-icon-wrapper {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		display: flex;
		align-items: center;
		padding-left: 12px;
		pointer-events: none;
		color: var(--color-outline);
	}

	.search-icon {
		height: 20px;
		width: 20px;
	}

	.search-input {
		width: 100%;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 16px 10px 40px;
		font-size: 14px;
		color: var(--color-on-surface);
		transition: all 200ms ease;
	}

	.search-input:focus {
		border-color: var(--color-primary);
		background-color: var(--color-surface-lowest);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.filter-divider {
		height: 1px;
		width: 100%;
		background-color: var(--color-outline-variant);
	}

	.dropdown-filters {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 12px;
		width: 100%;
	}

	.filter-select {
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 32px 10px 12px;
		font-size: 14px;
		color: var(--color-on-surface);
		transition: all 200ms ease;
		appearance: none;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 8px center;
		background-repeat: no-repeat;
		background-size: 20px 20px;
	}

	.filter-select:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.table-container {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-2xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-sm);
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
		padding: 8px 4px;
		font-size: 12px;
		font-weight: 600;
		color: var(--color-on-surface);
		background-color: var(--color-surface);
		border-bottom: 1px solid var(--color-outline-variant);
		white-space: nowrap;
	}

	.data-table td {
		padding: 8px 4px;
		border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
	}

	@media (min-width: 768px) {
		.data-table {
			font-size: 14px;
		}
		.data-table th, .data-table td {
			padding: 16px;
			font-size: 14px;
		}
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

	.font-medium {
		font-weight: 500;
	}

	.text-secondary {
		color: var(--color-on-surface-variant);
	}

	.student-transferred {
		opacity: 0.65;
		background-color: color-mix(in srgb, var(--color-outline-variant) 8%, transparent);
	}

	.student-transferred:hover {
		background-color: color-mix(in srgb, var(--color-outline-variant) 12%, transparent) !important;
	}

	.transfer-badge {
		display: inline-flex;
		align-items: center;
		border-radius: var(--radius-sm);
		background-color: color-mix(in srgb, var(--color-error) 15%, transparent);
		padding: 2px 6px;
		font-size: 11px;
		font-weight: 600;
		color: var(--color-error);
		border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
		margin-left: 8px;
		vertical-align: middle;
	}

	/* .col-dob {
		min-width: 110px;
		white-space: nowrap;
	} */

	/* .badge {
		display: inline-flex;
		align-items: center;
		border-radius: var(--radius-sm);
		background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
		padding: 4px 8px;
		font-size: 12px;
		font-weight: 500;
		color: var(--color-primary);
		border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
	} */

	.actions-flex {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.action-icon-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--color-on-surface-variant);
		transition: all 200ms ease;
		border-radius: var(--radius-sm);
		padding: 6px;
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		min-width: 44px;
		min-height: 44px;
	}

	.action-icon-link:hover:not(:disabled) {
		background-color: color-mix(in srgb, var(--color-on-surface) 5%, transparent);
	}

	.action-icon-link.view:hover:not(:disabled) { color: var(--color-primary); }
	.action-icon-link.cert:hover:not(:disabled) { color: #10b981; }
	.action-icon-link.transfer:hover:not(:disabled) { color: #f59e0b; }

	.action-icon-link:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		color: var(--color-outline) !important;
	}

	.empty-state {
		text-align: center;
		padding: 64px 24px;
	}

	.empty-icon-wrapper {
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

	.empty-icon {
		height: 24px;
		width: 24px;
	}

	.empty-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-on-surface);
		margin-bottom: 4px;
	}

	.empty-subtitle {
		font-size: 14px;
		color: var(--color-on-surface-variant);
	}

	.pagination-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.pagination-info {
		font-size: 14px;
		color: var(--color-on-surface-variant);
	}

	.pagination-current, .pagination-total {
		font-weight: 500;
		color: var(--color-on-surface);
	}

	.pagination-controls {
		display: flex;
		gap: 8px;
	}

	.pagination-btn {
		border-radius: var(--radius-lg);
		background-color: var(--color-surface);
		border: 1px solid var(--color-outline-variant);
		padding: 8px 16px;
		font-size: 14px;
		font-weight: 500;
		color: var(--color-on-surface);
		cursor: pointer;
		transition: all 200ms ease;
	}

	.pagination-btn:hover:not(:disabled) {
		background-color: var(--color-surface-lowest);
		border-color: var(--color-outline);
	}

	.pagination-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.hidden-mobile {
		display: none;
	}

	@media (min-width: 640px) {
		.hidden-mobile {
			display: inline-flex;
		}
	}

	@keyframes ping {
		75%, 100% {
			transform: scale(2);
			opacity: 0;
		}
	}
</style>
