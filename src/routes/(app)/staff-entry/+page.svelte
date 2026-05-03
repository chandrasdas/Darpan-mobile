<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';
	import { APP_NAME } from '$lib/config';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();
	
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Staff Data Entry | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<div class="page-hero">
		<div class="hero-header">
			<a href={resolve('/dashboard' as "/")} aria-label="Return to Dashboard" class="back-button">
				<svg class="back-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
			</a>
			<div class="hero-text">
				<h1 class="page-title">Staff Data Entry</h1>
				<p class="page-subtitle">Please provide or update your employment details below.</p>
			</div>
		</div>
	</div>

	{#if form?.success}
		<div class="success-card">
			{#if form?.noChanges}
				<div class="status-icon-wrapper blue-icon">
					<svg class="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h2 class="status-title">No data changed</h2>
				<p class="status-message">Your staff details are already up to date.</p>
			{:else}
				<div class="status-icon-wrapper emerald-icon">
					<svg class="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h2 class="status-title">Successfully Submitted!</h2>
				<p class="status-message">Your staff details have been saved to the database.</p>
			{/if}
			<div class="status-action">
				<a href={resolve('/dashboard' as "/")} class="primary-button">
					Return to Dashboard
				</a>
			</div>
		</div>
	{:else}
		<div class="form-card">
			<form method="POST" class="staff-form" use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}>
				
				{#if form?.error}
					<div class="error-alert">
						<svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
						<p class="error-text">{form.error}</p>
					</div>
				{/if}

				<div class="form-grid">
					<!-- Employee ID -->
					<div class="form-group">
						<label for="empId" class="form-label">Employee ID <span class="required">*</span></label>
						<input type="text" name="empId" id="empId" required maxlength="8"
							value={form?.data?.empId || data.existingStaff?.empId || ''}
							class="form-input"
							placeholder="e.g. EMP12345" />
					</div>

					<!-- Name (Pre-filled from auth) -->
					<div class="form-group">
						<label for="name" class="form-label">Full Name <span class="required">*</span></label>
						<input type="text" name="name" id="name" required maxlength="255"
							value={form?.data?.name || data.existingStaff?.name || data.user?.name || ''}
							class="form-input"
							placeholder="John Doe" />
					</div>

					<!-- Status Dropdown -->
					<div class="form-group">
						<label for="status" class="form-label">Status <span class="required">*</span></label>
						<select name="status" id="status" required class="form-select">
							<option value="" disabled selected={!(form?.data?.status || data.existingStaff?.status)}>Select Status</option>
							<option value="Permanent" selected={(form?.data?.status || data.existingStaff?.status) === 'Permanent'}>Permanent</option>
							<option value="Contractual" selected={(form?.data?.status || data.existingStaff?.status) === 'Contractual'}>Contractual</option>
						</select>
					</div>

					<!-- Designation Dropdown -->
					<div class="form-group">
						<label for="designation" class="form-label">Designation <span class="required">*</span></label>
						<select name="designation" id="designation" required class="form-select">
							<option value="" disabled selected={!(form?.data?.designation || data.existingStaff?.designation)}>Select Designation</option>
							<option value="Headmaster" selected={(form?.data?.designation || data.existingStaff?.designation) === 'Headmaster'}>Headmaster</option>
							<option value="Assistant Teacher" selected={(form?.data?.designation || data.existingStaff?.designation) === 'Assistant Teacher'}>Assistant Teacher</option>
							<option value="Librarian" selected={(form?.data?.designation || data.existingStaff?.designation) === 'Librarian'}>Librarian</option>
							<option value="Clerk" selected={(form?.data?.designation || data.existingStaff?.designation) === 'Clerk'}>Clerk</option>
							<option value="Group-D" selected={(form?.data?.designation || data.existingStaff?.designation) === 'Group-D'}>Group-D</option>
						</select>
					</div>

					<!-- Email -->
					<div class="form-group col-span-full">
						<label for="email" class="form-label">Email Address</label>
						<input type="email" name="email" id="email" maxlength="255" readonly
							value={form?.data?.email || data.existingStaff?.email || data.user?.email || ''}
							class="form-input readonly-input"
							placeholder="john@example.com" />
						<p class="form-hint">This will be used for official communications.</p>
					</div>

					<!-- Phone Number -->
					<div class="form-group">
						<label for="phoneNo" class="form-label">Phone Number</label>
						<input type="tel" name="phoneNo" id="phoneNo" maxlength="15"
							value={form?.data?.phoneNo || data.existingStaff?.phoneNo || ''}
							class="form-input"
							placeholder="+1234567890" />
					</div>

					<!-- Qualification -->
					<div class="form-group">
						<label for="qualification" class="form-label">Qualification</label>
						<input type="text" name="qualification" id="qualification" maxlength="255"
							value={form?.data?.qualification || data.existingStaff?.qualification || ''}
							class="form-input"
							placeholder="e.g. M.Sc, B.Ed" />
					</div>
					
					<!-- Date of Birth -->
					<div class="form-group">
						<label for="dateOfBirth" class="form-label">Date of Birth</label>
						<input type="date" name="dateOfBirth" id="dateOfBirth"
							value={form?.data?.dateOfBirth || data.existingStaff?.dateOfBirthFormatted || ''}
							class="form-input" />
					</div>

					<!-- Date of Joining -->
					<div class="form-group">
						<label for="dateOfJoining" class="form-label">Date of Joining</label>
						<input type="date" name="dateOfJoining" id="dateOfJoining"
							value={form?.data?.dateOfJoining || data.existingStaff?.dateOfJoiningFormatted || ''}
							class="form-input" />
					</div>

					<!-- Primary Subject -->
					<div class="form-group col-span-full">
						<label for="primarySubject" class="form-label">Primary Subject (if applicable)</label>
						<input type="text" name="primarySubject" id="primarySubject" maxlength="100"
							value={form?.data?.primarySubject || data.existingStaff?.primarySubject || ''}
							class="form-input"
							placeholder="e.g. Mathematics" />
					</div>
				</div>

				<div class="form-actions">
					<button type="submit" disabled={submitting} class="primary-button full-width">
						{#if submitting}
							<svg class="spinner-icon" fill="none" viewBox="0 0 24 24">
								<circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Saving Details...
						{:else}
							{data.existingStaff ? 'Update Staff Details' : 'Save Staff Details'}
						{/if}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style>
	.page-shell {
		padding: 0 20px 32px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 800px;
		margin: 0 auto;
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

	.success-card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-2xl);
		padding: 48px 24px;
		text-align: center;
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
	}

	.status-icon-wrapper {
		margin: 0 auto 16px;
		display: flex;
		height: 64px;
		width: 64px;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
	}

	.blue-icon {
		background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
		color: var(--color-primary);
	}

	.emerald-icon {
		background-color: color-mix(in srgb, var(--color-status-success) 10%, transparent);
		color: var(--color-status-success);
	}

	.status-icon {
		height: 32px;
		width: 32px;
	}

	.status-title {
		font-size: 24px;
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0 0 8px;
	}

	.status-message {
		color: var(--color-on-surface-variant);
		font-size: 16px;
		margin: 0;
	}

	.status-action {
		margin-top: 24px;
	}

	.primary-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-xl);
		background-color: var(--color-primary);
		color: var(--color-on-primary);
		padding: 12px 24px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 200ms ease;
		text-decoration: none;
	}

	.primary-button:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.primary-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.full-width {
		width: 100%;
	}

	.form-card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-2xl);
		padding: 24px;
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
	}

	@media (min-width: 640px) {
		.form-card {
			padding: 40px;
		}
	}

	.staff-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.error-alert {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
		padding: 16px;
		border-radius: var(--radius-lg);
	}

	.error-icon {
		height: 20px;
		width: 20px;
		color: var(--color-error);
		flex-shrink: 0;
	}

	.error-text {
		color: var(--color-error);
		font-size: 14px;
		font-weight: 500;
		margin: 0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
	}

	@media (min-width: 640px) {
		.form-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.col-span-full {
		grid-column: 1 / -1;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
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
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 12px 16px;
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

	.readonly-input {
		background-color: var(--color-surface);
		opacity: 0.7;
		cursor: not-allowed;
	}

	.readonly-input:focus {
		border-color: var(--color-outline);
		box-shadow: none;
		background-color: var(--color-surface);
	}

	.form-hint {
		font-size: 12px;
		color: var(--color-on-surface-variant);
		margin: 0;
	}

	.form-actions {
		margin-top: 8px;
	}

	.spinner-icon {
		margin-right: 8px;
		margin-left: -4px;
		height: 16px;
		width: 16px;
		animation: spin 1s linear infinite;
	}

	.spinner-track {
		opacity: 0.25;
	}

	.spinner-head {
		opacity: 0.75;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
