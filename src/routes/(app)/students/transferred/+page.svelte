<script lang="ts">
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	let searchQ = $state(data.searchQ || '');
	let selectedStudent = $derived(data.selectedStudent);
	let searchResults = $derived(data.searchResults);
	let transferredStudents = $derived(data.transferredStudents);

	// Get today's date formatted as YYYY-MM-DD for the date input default
	const todayStr = new Date().toISOString().split('T')[0];
	let transferDateInput = $state(todayStr);
</script>

<svelte:head>
	<title>Transferred Students | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<!-- Page Header -->
	<section class="page-hero">
		<div class="hero-content flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
			<div class="hero-text">
				<h1 class="page-title">Transferred Students</h1>
				<p class="page-subtitle">Manage student transfers, issue transfer certificates, and view transfer history.</p>
			</div>
			<div class="record-count">
				<span class="count-text">
					Total Transferred: <strong class="count-number">{transferredStudents.length}</strong> students
				</span>
			</div>
		</div>
	</section>

	<!-- Top Section: Search & Transfer (Full Width Grid) -->
	<div class="grid grid-cols-1 {selectedStudent ? 'md:grid-cols-2' : ''} gap-6">
		<!-- Step 1: Search Active Student -->
		<div class="action-card">
			<h2 class="card-title">1. Find Active Student</h2>
			<p class="card-description">Search for an active student by name or portal ID to begin the transfer process.</p>
			
			<form method="GET" action="" class="search-form flex flex-col sm:flex-row gap-2 mt-4">
				{#if selectedStudent}
					<input type="hidden" name="sid" value={selectedStudent.sid} />
				{/if}
				<div class="search-input-wrapper flex-1">
					<input 
						type="text" 
						name="searchQ" 
						bind:value={searchQ} 
						placeholder="Type name or Portal ID..." 
						class="search-input-field"
						required
					/>
				</div>
				<button type="submit" class="search-submit-btn">Search</button>
			</form>

			{#if searchResults.length > 0}
				<div class="search-results-list mt-4">
					<p class="results-heading">Search Results ({searchResults.length})</p>
					<ul class="results-container">
						{#each searchResults as res (res.sid)}
							<li class="result-item">
								<a 
									href={resolve(`/students/transferred?searchQ=${searchQ}&sid=${res.sid}` as "/")}
									class="result-link flex justify-between items-center"
									class:selected={selectedStudent && selectedStudent.sid === res.sid}
								>
									<div class="result-details">
										<span class="result-name">{res.name}</span>
										<span class="result-subtext">
											Portal ID: {res.portalId}
											{#if res.className}
												| Class {res.className} {res.sectionLetter || ''} (Roll: {res.rollNo || '-'})
											{/if}
										</span>
									</div>
									<span class="select-arrow">→</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{:else if data.searchQ && searchResults.length === 0 && searchQ === data.searchQ}
				<p class="no-results-msg mt-4">No active students found matching "{data.searchQ}".</p>
			{/if}
		</div>

		<!-- Step 2: Execute Transfer Form -->
		{#if selectedStudent}
			<div class="action-card highlight-card" in:fade={{ duration: 250 }}>
				<h2 class="card-title text-amber-600">2. Execute Transfer</h2>
				<div class="selected-student-box mt-4">
					<p class="label">Selected Student</p>
					<h3 class="student-name">{selectedStudent.name}</h3>
					<div class="grid grid-cols-2 gap-2 mt-2 text-xs text-secondary-text">
						<div><strong>Portal ID:</strong> {selectedStudent.portalId}</div>
						<div><strong>Father:</strong> {selectedStudent.fname}</div>
						{#if selectedStudent.className}
							<div><strong>Class:</strong> {selectedStudent.className}</div>
							<div><strong>Roll No:</strong> {selectedStudent.rollNo}</div>
						{/if}
					</div>
				</div>

				<form 
					method="POST" 
					action="?/transfer" 
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							searchQ = '';
							window.location.href = resolve('/students/transferred' as "/");
						};
					}}
					class="transfer-form mt-4 flex flex-col gap-4"
				>
					<input type="hidden" name="sid" value={selectedStudent.sid} />
					
					<div class="form-group">
						<label for="transferDate" class="form-label">Date of Transfer</label>
						<input 
							type="date" 
							id="transferDate" 
							name="transferDate" 
							bind:value={transferDateInput} 
							class="date-input-field" 
							required
						/>
					</div>

					<div class="flex justify-between gap-2 mt-2">
						<a href={resolve('/students/transferred' as "/")} class="btn-cancel flex-1 text-center">Clear Selection</a>
						<button type="submit" class="btn-execute flex-1">Mark as Transferred</button>
					</div>
				</form>
			</div>
		{/if}
	</div>

	<!-- Bottom Section: Transferred History Registry (Full Width) -->
	<div class="w-full">
		<div class="table-card">
			<div class="card-header flex justify-between items-center">
				<h2 class="table-card-title">Transfer History Registry</h2>
			</div>
			
			<div class="table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th>SL</th>
							<th>Name</th>
							<th>Portal ID</th>
							<th>Last Enrolled Class</th>
							<th>Transfer Date</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each transferredStudents as student, i (student.sid)}
							<tr>
								<td>{i + 1}</td>
								<td class="font-medium text-primary-text">{student.name}</td>
								<td class="text-secondary-text tabular-nums">{student.portalId}</td>
								<td class="text-secondary-text">
									{#if student.className}
										Class {student.className} {student.sectionLetter || ''}
										{#if student.rollNo}
											<span class="text-xs text-muted">(Roll: {student.rollNo})</span>
										{/if}
									{:else}
										-
									{/if}
								</td>
								<td class="text-secondary-text font-medium tabular-nums">{student.transferDate}</td>
								<td>
									<div class="flex justify-end items-center gap-2">
										<a 
											href={resolve(`/students/${student.sid}/transfer-certificate` as "/")} 
											class="btn-action cert-btn flex items-center gap-1"
											title="View & Print Transfer Certificate"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
											<span>Certificate</span>
										</a>

										<form 
											method="POST" 
											action="?/cancelTransfer" 
											use:enhance
											class="inline-block"
										>
											<input type="hidden" name="sid" value={student.sid} />
											<button 
												type="submit" 
												class="btn-action undo-btn flex items-center gap-1" 
												title="Undo Transfer (Restore Active status)"
												onclick={(e) => {
													if (!confirm('Are you sure you want to cancel the transfer for this student? This will restore them back to Active status.')) {
														e.preventDefault();
													}
												}}
											>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
												<span>Revert</span>
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
						
						{#if transferredStudents.length === 0}
							<tr>
								<td colspan="6" class="empty-state text-center py-12">
									<div class="empty-icon-wrapper mx-auto mb-4 flex justify-center items-center">
										<svg class="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
									</div>
									<h3 class="empty-title text-base font-semibold text-primary-text">No Transferred Students</h3>
									<p class="empty-subtitle text-sm text-secondary-text">There are no records of transferred students in the registry database.</p>
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
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
		background-color: var(--color-surface-lowest);
		padding: 24px;
		border-radius: var(--radius-2xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
	}

	.page-title {
		font-family: var(--font-heading);
		font-size: 30px;
		font-weight: 700;
		color: var(--color-on-surface);
		letter-spacing: -0.02em;
		margin: 0;
	}

	.page-subtitle {
		font-family: var(--font-body);
		font-size: 15px;
		color: var(--color-on-surface-variant);
		margin-top: 6px;
	}

	.record-count {
		font-size: 14px;
		color: var(--color-on-surface-variant);
		background-color: var(--color-surface);
		border: 1px solid var(--color-outline-variant);
		padding: 8px 16px;
		border-radius: var(--radius-lg);
	}

	.count-number {
		color: var(--color-primary);
		font-size: 16px;
	}

	/* Action Panel Card */
	.action-card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-outline-variant);
		padding: 20px;
		box-shadow: var(--shadow-ambient-sm);
	}

	.highlight-card {
		border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
		box-shadow: 0 4px 20px rgba(var(--color-primary), 0.05);
	}

	.card-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 6px 0;
		color: var(--color-on-surface);
	}

	.card-description {
		font-size: 13px;
		color: var(--color-on-surface-variant);
		margin: 0;
		line-height: 1.4;
	}

	.search-input-field {
		width: 100%;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 14px;
		font-size: 14px;
		color: var(--color-on-surface);
		transition: all 200ms ease;
	}

	.search-input-field:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.search-submit-btn {
		background-color: var(--color-primary);
		color: white;
		border-radius: var(--radius-lg);
		padding: 10px 18px;
		font-size: 14px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		min-height: 44px;
		transition: opacity 150ms ease;
	}

	.search-submit-btn:hover {
		opacity: 0.9;
	}

	/* Search results */
	.results-heading {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-on-surface-variant);
		margin-bottom: 8px;
	}

	.results-container {
		list-style: none;
		padding: 0;
		margin: 0;
		border: 1px solid var(--color-outline-variant);
		border-radius: var(--radius-lg);
		max-height: 220px;
		overflow-y: auto;
		background-color: var(--color-surface);
	}

	.result-item {
		border-bottom: 1px solid var(--color-outline-variant);
	}

	.result-item:last-child {
		border-bottom: none;
	}

	.result-link {
		display: flex;
		padding: 10px 14px;
		text-decoration: none;
		color: var(--color-on-surface);
		transition: background-color 150ms ease;
	}

	.result-link:hover {
		background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
	}

	.result-link.selected {
		background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
		border-left: 3px solid var(--color-primary);
	}

	.result-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.result-name {
		font-size: 14px;
		font-weight: 500;
	}

	.result-subtext {
		font-size: 11px;
		color: var(--color-on-surface-variant);
	}

	.select-arrow {
		font-size: 16px;
		color: var(--color-on-surface-variant);
	}

	.no-results-msg {
		font-size: 13px;
		color: #ef4444;
		text-align: center;
		padding: 8px;
		border: 1px dashed color-mix(in srgb, #ef4444 30%, transparent);
		background-color: color-mix(in srgb, #ef4444 5%, transparent);
		border-radius: var(--radius-lg);
	}

	/* Execute form */
	.selected-student-box {
		background-color: var(--color-surface);
		border: 1px solid var(--color-outline-variant);
		border-radius: var(--radius-lg);
		padding: 12px;
	}

	.selected-student-box .label {
		font-size: 11px;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--color-on-surface-variant);
		margin: 0 0 4px 0;
	}

	.student-name {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
		color: var(--color-on-surface);
	}

	.text-secondary-text {
		color: var(--color-on-surface-variant);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-on-surface);
	}

	.date-input-field {
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 14px;
		font-size: 14px;
		color: var(--color-on-surface);
		min-height: 44px;
		width: 100%;
	}

	.date-input-field:focus {
		border-color: var(--color-primary);
		outline: none;
	}

	.btn-cancel {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-outline);
		border-radius: var(--radius-lg);
		padding: 10px 14px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-on-surface-variant);
		background-color: var(--color-surface);
		cursor: pointer;
		min-height: 44px;
		transition: background-color 150ms ease;
	}

	.btn-cancel:hover {
		background-color: color-mix(in srgb, var(--color-outline) 5%, transparent);
	}

	.btn-execute {
		background-color: #d97706; /* Amber-600 */
		color: white;
		border-radius: var(--radius-lg);
		padding: 10px 14px;
		font-size: 13px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		min-height: 44px;
		transition: opacity 150ms ease;
	}

	.btn-execute:hover {
		opacity: 0.9;
	}

	/* Table Registry Card */
	.table-card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-sm);
		overflow: hidden;
	}

	.card-header {
		padding: 20px;
		border-bottom: 1px solid var(--color-outline-variant);
	}

	.table-card-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-on-surface);
		margin: 0;
	}

	.table-container {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 13px;
	}

	@media (min-width: 768px) {
		.data-table {
			font-size: 14px;
		}
	}

	.data-table th {
		padding: 12px 16px;
		font-size: 12px;
		font-weight: 600;
		color: var(--color-on-surface-variant);
		background-color: var(--color-surface);
		border-bottom: 2px solid var(--color-outline-variant);
		white-space: nowrap;
	}

	.data-table td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
		vertical-align: middle;
	}

	.data-table tbody tr:hover {
		background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
	}

	.text-primary-text {
		color: var(--color-on-surface);
	}

	.text-secondary-text {
		color: var(--color-on-surface-variant);
	}

	.tabular-nums {
		font-variant-numeric: tabular-nums;
	}

	.empty-state {
		padding: 48px 24px;
	}

	.empty-icon-wrapper {
		height: 48px;
		width: 48px;
		border-radius: var(--radius-xl);
		background-color: var(--color-surface);
		border: 1px solid var(--color-outline-variant);
	}

	/* Actions buttons */
	.btn-action {
		display: inline-flex;
		align-items: center;
		padding: 6px 12px;
		font-size: 12px;
		font-weight: 600;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 150ms ease;
		min-height: 38px;
		text-decoration: none;
		border: 1px solid transparent;
	}

	.cert-btn {
		background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
		color: var(--color-primary);
		border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
	}

	.cert-btn:hover {
		background-color: var(--color-primary);
		color: white;
	}

	.undo-btn {
		background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
		color: var(--color-error);
		border-color: color-mix(in srgb, var(--color-error) 20%, transparent);
	}

	.undo-btn:hover {
		background-color: var(--color-error);
		color: white;
	}
</style>
