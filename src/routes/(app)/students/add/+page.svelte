<script lang="ts">
	import { resolve } from '$app/paths';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	
	let { form, data } = $props<{ form: ActionData, data: PageData }>();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Add Student — Darpan</title>
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
				<h1 class="page-title">Add Student</h1>
				<p class="page-subtitle">Register a new student into the system.</p>
			</div>
		</div>
	</div>

	{#if form?.success}
		<div class="success-card">
			<div class="status-icon-wrapper emerald-icon">
				<svg class="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h2 class="status-title">Student Registered Successfully!</h2>
			<p class="status-message">The new student has been saved to the database and enrolled in the selected session.</p>
			
			<div class="status-action">
				<a href={resolve('/students/add' as "/")} class="primary-button" onclick={() => window.location.reload()}>
					Register Another Student
				</a>
			</div>
		</div>
	{:else}
		<div class="form-card">
			<form method="POST" class="student-form" use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}>
				
				{#if form?.error}
					<div class="error-alert mb-6">
						<svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
						<p class="error-text">{form.error}</p>
					</div>
				{/if}

				{#if form?.existingStudent}
					<div class="existing-student-card mb-6">
						<div class="existing-card-header">
							<svg class="existing-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span class="existing-card-title">Existing Student Record Found</span>
						</div>
						<div class="existing-details-grid">
							<div class="existing-detail">
								<span class="detail-label">Portal ID</span>
								<span class="detail-value">{form.existingStudent.portalId}</span>
							</div>
							<div class="existing-detail">
								<span class="detail-label">Name</span>
								<span class="detail-value">{form.existingStudent.name}</span>
							</div>
							<div class="existing-detail">
								<span class="detail-label">Father's Name</span>
								<span class="detail-value">{form.existingStudent.fname}</span>
							</div>
							<div class="existing-detail">
								<span class="detail-label">Date of Birth</span>
								<span class="detail-value">{form.existingStudent.dob}</span>
							</div>
							<div class="existing-detail">
								<span class="detail-label">Guardian No.</span>
								<span class="detail-value">{form.existingStudent.guardianNo}</span>
							</div>
						</div>
					</div>
				{/if}

				<div class="form-section-title">Personal Details</div>
			<div class="form-grid">
				<div class="form-group col-span-full">
					<label for="name" class="form-label">Full Name <span class="required">*</span></label>
					<input type="text" name="name" id="name" required class="form-input" placeholder="e.g. Aarav Sharma" />
				</div>

				<div class="form-group">
					<label for="fname" class="form-label">Father's Name <span class="required">*</span></label>
					<input type="text" name="fname" id="fname" required class="form-input" placeholder="e.g. Rajesh Sharma" />
				</div>

				<div class="form-group">
					<label for="dob" class="form-label">Date of Birth <span class="required">*</span></label>
					<input type="date" name="dob" id="dob" required class="form-input" />
				</div>

				<div class="form-group">
					<label for="caste" class="form-label">Caste <span class="required">*</span></label>
					<select name="caste" id="caste" required class="form-select">
						<option value="" disabled selected>Select Caste</option>
						<option value="General">General</option>
						<option value="SC">SC</option>
						<option value="ST">ST</option>
						<option value="OBC-A">OBC-A</option>
						<option value="OBC-B">OBC-B</option>
					</select>
				</div>
				
				<div class="form-group">
					<label for="penNo" class="form-label">PEN Number</label>
					<input type="number" name="penNo" id="penNo" class="form-input" placeholder="Optional" />
				</div>
				
				<div class="form-group">
					<label for="portalId" class="form-label">Portal ID <span class="required">*</span></label>
					<input type="text" name="portalId" id="portalId" required class="form-input" placeholder="e.g. 12345678901234" maxlength="14" />
				</div>
			</div>

			<div class="form-section-title mt-6">Contact Details</div>
			<div class="form-grid">
				<div class="form-group">
					<label for="guardianNo" class="form-label">Guardian Number <span class="required">*</span></label>
					<input type="number" name="guardianNo" id="guardianNo" required class="form-input" placeholder="10-digit number" />
				</div>

				<div class="form-group">
					<label for="messageNo" class="form-label">Message Number <span class="required">*</span></label>
					<input type="number" name="messageNo" id="messageNo" required class="form-input" placeholder="10-digit number" />
				</div>
			</div>

			<div class="form-section-title mt-6">Academic Details</div>
			<div class="form-grid">
				<div class="form-group">
					<label for="sessionId" class="form-label">Academic Session <span class="required">*</span></label>
					<select name="sessionId" id="sessionId" required class="form-select">
						<option value="" disabled selected>Select Session</option>
						{#each data.sessions as session (session.id)}
							<option value={session.id}>{session.name}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="sectionId" class="form-label">Class & Section <span class="required">*</span></label>
					<select name="sectionId" id="sectionId" required class="form-select">
						<option value="" disabled selected>Select Section</option>
						{#each data.sections as section (section.id)}
							<option value={section.id}>{section.fullName}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="rollNo" class="form-label">Roll Number <span class="required">*</span></label>
					<input type="number" name="rollNo" id="rollNo" required class="form-input" placeholder="e.g. 15" />
				</div>
			</div>

			<div class="form-actions mt-8">
				<button type="submit" disabled={submitting} class="primary-button full-width">
					{#if submitting}
						<svg class="spinner-icon" fill="none" viewBox="0 0 24 24">
							<circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Registering Student...
					{:else}
						Register Student
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

	.student-form {
		display: flex;
		flex-direction: column;
	}

	.form-section-title {
		font-family: var(--font-heading);
		font-size: 18px;
		font-weight: 600;
		color: var(--color-primary);
		margin-bottom: 16px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-outline-variant);
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

	.mb-6 { margin-bottom: 24px; }
	.mt-6 { margin-top: 24px; }
	.mt-8 { margin-top: 32px; }

	.form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
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
		border-radius: var(--radius-md);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 14px;
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
		font-size: 16px;
		min-height: 48px;
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

	.spinner-icon {
		margin-right: 8px;
		margin-left: -4px;
		height: 18px;
		width: 18px;
		animation: spin 1s linear infinite;
	}

	.spinner-track { opacity: 0.25; }
	.spinner-head { opacity: 0.75; }

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.existing-student-card {
		background-color: color-mix(in srgb, var(--color-tertiary) 5%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-tertiary) 20%, transparent);
		border-radius: var(--radius-lg);
		padding: 16px;
	}

	.existing-card-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
		color: var(--color-tertiary);
	}

	.existing-card-icon {
		width: 20px;
		height: 20px;
	}

	.existing-card-title {
		font-weight: 600;
		font-size: 14px;
	}

	.existing-details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
	}

	.existing-detail {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.detail-label {
		font-size: 12px;
		color: var(--color-on-surface-variant);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-on-surface);
	}
</style>
