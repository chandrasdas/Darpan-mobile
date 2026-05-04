<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import { resolve } from '$app/paths';

	let { data, form } = $props();
	
	let loading = $state(false);
	
	// Helper state for editing rows
	let editingId = $state<number | null>(null);

	function startEdit(id: number) {
		editingId = id;
	}

	function cancelEdit() {
		editingId = null;
	}
</script>

<svelte:head>
	<title>Allowed Staff Management | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<div class="page-hero">
		<div class="hero-header">
			<a href={resolve('/dashboard' as "/")} aria-label="Back to Dashboard" class="back-button">
				<svg class="back-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
			</a>
			<div class="hero-text">
				<h1 class="page-title">Allowed Staff Management</h1>
				<p class="page-subtitle">Manage the list of staff members permanently allowed to register for an account.</p>
			</div>
		</div>
	</div>

	{#if form?.message}
		<div class="alert-box {form.success ? 'alert-success' : 'alert-error'}">
			{form.message}
		</div>
	{/if}

	<div class="layout-grid">
		
		<!-- Add New Member Form Area -->
		<div class="form-section">
			<div class="card form-card">
				<div class="card-glow"></div>
				<h2 class="card-title">Add New Allowed Member</h2>
				
				<form method="POST" action="?/add" use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						update();
					};
				}} class="form-body">
					<div class="form-group">
						<label for="name" class="form-label">Name (Optional)</label>
						<input type="text" id="name" name="name" 
							class="form-input" 
							placeholder="John Doe" />
					</div>

					<div class="form-group">
						<label for="email" class="form-label">Email <span class="required">*</span></label>
						<input type="email" id="email" name="email" required
							class="form-input" 
							placeholder="john@example.com" />
					</div>

					<div class="form-group">
						<label for="role" class="form-label">Role</label>
						<select id="role" name="role" class="form-select">
							<option value="teacher">Teacher</option>
							<option value="staff">Staff</option>
							<option value="admin">Admin</option>
						</select>
					</div>

					<div class="checkbox-group">
						<input type="checkbox" id="isAllowed" name="isAllowed" checked class="form-checkbox" />
						<label for="isAllowed" class="checkbox-label">Is Allowed to Register</label>
					</div>

					<button type="submit" disabled={loading} class="submit-button">
						{#if loading}
							<svg class="spinner-icon" fill="none" viewBox="0 0 24 24"><circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
						{:else}
							Add Staff Member
						{/if}
					</button>
				</form>
			</div>
		</div>

		<!-- List / Management Area -->
		<div class="list-section">
			<div class="card table-card">
				<div class="table-scroll">
					<table class="data-table">
						<thead>
							<tr>
								<th>Name / Email</th>
								<th>Role</th>
								<th>Status</th>
								<th class="text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#if data.staffList.length === 0}
								<tr>
									<td colspan="4" class="empty-state">No staff members found.</td>
								</tr>
							{:else}
								{#each data.staffList as staff (staff.id)}
									{#if editingId === staff.id}
										<!-- EDIT ROW -->
										<tr class="edit-row">
											<td colspan="4" class="edit-cell">
												<form method="POST" action="?/edit" use:enhance={() => {
													return async ({ update }) => {
														cancelEdit();
														update();
													};
												}} class="edit-form">
													<input type="hidden" name="id" value={staff.id} />
													
													<div class="edit-inputs">
														<input type="text" name="name" value={staff.name || ''} placeholder="Name" class="form-input small-input" />
														<input type="email" name="email" value={staff.email} required placeholder="Email" class="form-input small-input" />
													</div>

													<div class="edit-controls">
														<select name="role" class="form-select small-select" value={staff.role}>
															<option value="teacher">Teacher</option>
															<option value="staff">Staff</option>
															<option value="admin">Admin</option>
														</select>
														<div class="checkbox-group inline-checkbox">
															<input type="checkbox" name="isAllowed" id="edit-allow-{staff.id}" checked={staff.isAllowed} class="form-checkbox small-checkbox" />
															<label for="edit-allow-{staff.id}" class="checkbox-label small-label">Allowed</label>
														</div>
													</div>

													<div class="edit-actions">
														<button type="submit" class="action-btn save-btn">Save</button>
														<button type="button" onclick={cancelEdit} class="action-btn cancel-btn">Cancel</button>
													</div>
												</form>
											</td>
										</tr>
									{:else}
										<!-- VIEW ROW -->
										<tr>
											<td>
												<div class="staff-name">{staff.name || 'N/A'}</div>
												<div class="staff-email">{staff.email}</div>
											</td>
											<td>
												<span class="role-badge {staff.role === 'admin' ? 'role-admin' : staff.role === 'teacher' ? 'role-teacher' : 'role-staff'}">
													{staff.role}
												</span>
											</td>
											<td>
												{#if staff.isAllowed}
													<span class="status-badge status-allowed">
														<div class="status-dot"></div>
														Allowed
													</span>
												{:else}
													<span class="status-badge status-blocked">
														<div class="status-dot"></div>
														Blocked
													</span>
												{/if}
											</td>
											<td class="text-right">
												<div class="row-actions">
													<button type="button" onclick={() => startEdit(staff.id)} class="icon-btn edit-icon" title="Edit">
														<svg class="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
													</button>
													<form method="POST" action="?/delete" use:enhance={() => {
														return async ({ update }) => {
															update();
														};
													}} class="inline-form">
														<input type="hidden" name="id" value={staff.id} />
														<button type="submit" class="icon-btn delete-icon" title="Delete" onclick={(e) => { if(!confirm('Are you sure you want to delete this allowed staff member?')) e.preventDefault(); }}>
															<svg class="icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
														</button>
													</form>
												</div>
											</td>
										</tr>
									{/if}
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
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

	.hero-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}

	.back-button {
		display: flex;
		height: 40px;
		width: 40px;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-xl);
		background-color: var(--color-surface);
		color: var(--color-on-surface-variant);
		border: 1px solid var(--color-outline-variant);
		transition: all 200ms ease;
	}

	.back-button:hover {
		background-color: var(--color-surface-lowest);
		color: var(--color-on-surface);
		border-color: var(--color-outline);
	}

	.back-icon {
		height: 20px;
		width: 20px;
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

	.alert-box {
		padding: 16px;
		border-radius: var(--radius-xl);
		font-weight: 500;
		font-size: 14px;
		border: 1px solid;
	}

	.alert-success {
		background-color: color-mix(in srgb, var(--color-status-success) 10%, transparent);
		border-color: color-mix(in srgb, var(--color-status-success) 20%, transparent);
		color: var(--color-status-success);
	}

	.alert-error {
		background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
		border-color: color-mix(in srgb, var(--color-error) 20%, transparent);
		color: var(--color-error);
	}

	.layout-grid {
		display: grid;
		gap: 32px;
		grid-template-columns: 1fr;
	}

	@media (min-width: 1024px) {
		.layout-grid {
			grid-template-columns: 1fr 2fr;
		}
	}

	.card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-2xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
		position: relative;
		overflow: hidden;
	}

	.form-card {
		padding: 24px;
	}

	.card-glow {
		position: absolute;
		top: -80px;
		right: -80px;
		height: 200px;
		width: 200px;
		border-radius: 50%;
		background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
		filter: blur(40px);
		pointer-events: none;
	}

	.card-title {
		font-family: var(--font-heading);
		font-size: 20px;
		font-weight: 600;
		color: var(--color-on-surface);
		margin: 0 0 24px;
		position: relative;
		z-index: 10;
	}

	.form-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		position: relative;
		z-index: 10;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-on-surface);
	}

	.required {
		color: var(--color-error);
	}

	.form-input, .form-select {
		width: 100%;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 16px;
		font-size: 14px;
		color: var(--color-on-surface);
		transition: all 200ms ease;
	}

	.form-input::placeholder {
		color: var(--color-on-surface-variant);
		opacity: 0.5;
	}

	.form-input:focus, .form-select:focus {
		border-color: var(--color-primary);
		background-color: var(--color-surface-lowest);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.form-select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 12px center;
		background-repeat: no-repeat;
		background-size: 20px 20px;
		padding-right: 40px;
	}

	.checkbox-group {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 8px;
	}

	.checkbox-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-on-surface);
		cursor: pointer;
	}

	.submit-button {
		margin-top: 16px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		background-color: var(--color-primary);
		color: var(--color-on-primary);
		padding: 10px 20px;
		font-weight: 600;
		font-size: 14px;
		border: none;
		cursor: pointer;
		transition: all 200ms ease;
		width: 100%;
	}

	.submit-button:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner-icon {
		margin-right: 8px;
		height: 20px;
		width: 20px;
		animation: spin 1s linear infinite;
	}

	.spinner-track { opacity: 0.25; }
	.spinner-head { opacity: 0.75; }

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.table-scroll {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		min-width: 600px;
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
		padding: 16px;
		font-size: 14px;
		border-bottom: 1px solid var(--color-outline-variant);
		color: var(--color-on-surface);
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

	.text-right {
		text-align: right;
	}

	.empty-state {
		text-align: center;
		padding: 32px 16px;
		color: var(--color-on-surface-variant);
	}

	.staff-name {
		font-weight: 500;
		color: var(--color-on-surface);
	}

	.staff-email {
		font-size: 12px;
		color: var(--color-on-surface-variant);
		margin-top: 2px;
	}

	.role-badge {
		display: inline-flex;
		align-items: center;
		border-radius: var(--radius-sm);
		padding: 4px 8px;
		font-size: 12px;
		font-weight: 500;
		border: 1px solid transparent;
	}

	.role-admin {
		background-color: color-mix(in srgb, var(--color-secondary) 15%, transparent);
		color: var(--color-secondary);
		border-color: color-mix(in srgb, var(--color-secondary) 20%, transparent);
	}

	.role-teacher {
		background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
		color: var(--color-primary);
		border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
	}

	.role-staff {
		background-color: color-mix(in srgb, var(--color-outline) 20%, transparent);
		color: var(--color-on-surface-variant);
		border-color: color-mix(in srgb, var(--color-outline) 30%, transparent);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: var(--radius-sm);
		padding: 4px 8px;
		font-size: 12px;
		font-weight: 500;
		border: 1px solid transparent;
	}

	.status-allowed {
		background-color: color-mix(in srgb, var(--color-status-success) 10%, transparent);
		color: var(--color-status-success-text);
		border-color: color-mix(in srgb, var(--color-status-success) 20%, transparent);
	}

	.status-allowed .status-dot {
		background-color: var(--color-status-success);
	}

	.status-blocked {
		background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
		color: var(--color-error);
		border-color: color-mix(in srgb, var(--color-error) 20%, transparent);
	}

	.status-blocked .status-dot {
		background-color: var(--color-error);
	}

	.status-dot {
		height: 6px;
		width: 6px;
		border-radius: 50%;
	}

	.row-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 32px;
		width: 32px;
		border-radius: var(--radius-md);
		border: none;
		background: transparent;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.icon-svg {
		height: 16px;
		width: 16px;
	}

	.edit-icon {
		color: var(--color-on-surface-variant);
	}

	.edit-icon:hover {
		color: var(--color-primary);
		background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.delete-icon {
		color: var(--color-error);
	}

	.delete-icon:hover {
		background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
	}

	.inline-form {
		display: inline-block;
	}

	.edit-row {
		background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	@media (min-width: 640px) {
		.edit-form {
			flex-direction: row;
			align-items: center;
		}
	}

	.edit-inputs {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.edit-controls {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		flex-shrink: 0;
	}

	@media (min-width: 640px) {
		.edit-controls {
			width: auto;
		}
	}

	.small-input, .small-select {
		padding: 6px 12px;
	}

	.inline-checkbox {
		padding-top: 0;
		padding-left: 4px;
	}

	.small-checkbox {
		height: 16px;
		width: 16px;
	}

	.small-label {
		font-size: 12px;
	}

	.edit-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		width: 100%;
		flex-shrink: 0;
	}

	@media (min-width: 640px) {
		.edit-actions {
			width: auto;
		}
	}

	.action-btn {
		padding: 6px 12px;
		font-size: 14px;
		font-weight: 500;
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.save-btn {
		background-color: color-mix(in srgb, var(--color-status-success) 20%, transparent);
		color: var(--color-status-success-text);
	}

	.save-btn:hover {
		background-color: color-mix(in srgb, var(--color-status-success) 30%, transparent);
	}

	.cancel-btn {
		background-color: color-mix(in srgb, var(--color-outline) 20%, transparent);
		color: var(--color-on-surface-variant);
	}

	.cancel-btn:hover {
		background-color: color-mix(in srgb, var(--color-outline) 30%, transparent);
	}
</style>
