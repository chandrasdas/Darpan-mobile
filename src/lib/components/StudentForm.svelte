<script lang="ts">
	import { enhance } from '$app/forms';

	interface Student {
		sid?: number;
		name?: string;
		fname?: string;
		dob?: string;
		caste?: string;
		penNo?: number | null;
		portalId?: string;
		guardianNo?: number;
		messageNo?: number;
	}

	interface Enrollment {
		sessionId?: number;
		sectionId?: number;
		rollNo?: number;
	}

	interface Session {
		id: number;
		name: string;
	}

	interface Section {
		id: number;
		fullName: string;
	}

	interface FormActionData {
		success?: boolean;
		error?: string;
		existingStudent?: {
			portalId: string;
			name: string;
			fname: string;
			dob: string;
			guardianNo: number;
		} | null;
	}

	let {
		student = null,
		enrollment = null,
		sessions = [],
		sections = [],
		form = null
	} = $props<{
		student?: Student | null;
		enrollment?: Enrollment | null;
		sessions: Session[];
		sections: Section[];
		form: FormActionData | null;
	}>();

	let submitting = $state(false);
	// Computed state for edit mode
	let isEditMode = $derived(student !== null);

	// Local reactive state for DOB and Caste to ensure correct binding/hydration
	let dobValue = $state('');
	let casteValue = $state('');

	$effect(() => {
		dobValue = formatDobForInput(student?.dob);
		casteValue = formatCasteForInput(student?.caste);
	});

	// Format DOB (DD-MM-YYYY) from database to input-compatible format (YYYY-MM-DD)
	function formatDobForInput(dob: string | null | undefined): string {
		if (!dob) return '';
		if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
			return dob;
		}
		const parts = dob.split('-');
		if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
			return `${parts[2]}-${parts[1]}-${parts[0]}`;
		}
		return dob;
	}

	// Normalize caste text to match the form options case-sensitively
	function formatCasteForInput(caste: string | null | undefined): string {
		if (!caste) return '';
		const lower = caste.toLowerCase();
		if (lower === 'general') return 'General';
		if (lower === 'sc') return 'SC';
		if (lower === 'st') return 'ST';
		if (lower === 'obc-a') return 'OBC-A';
		if (lower === 'obc-b') return 'OBC-B';
		return caste;
	}
</script>

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
			<input 
				type="text" 
				name="name" 
				id="name" 
				required 
				class="form-input" 
				placeholder="e.g. Aarav Sharma" 
				value={student?.name ?? ''}
			/>
		</div>

		<div class="form-group">
			<label for="fname" class="form-label">Father's Name <span class="required">*</span></label>
			<input 
				type="text" 
				name="fname" 
				id="fname" 
				required 
				class="form-input" 
				placeholder="e.g. Rajesh Sharma" 
				value={student?.fname ?? ''}
			/>
		</div>

		<div class="form-group">
			<label for="dob" class="form-label">Date of Birth <span class="required">*</span></label>
			<input 
				type="date" 
				name="dob" 
				id="dob" 
				required 
				class="form-input" 
				bind:value={dobValue}
			/>
		</div>

		<div class="form-group">
			<label for="caste" class="form-label">Caste <span class="required">*</span></label>
			<select name="caste" id="caste" required class="form-select" bind:value={casteValue}>
				<option value="" disabled>Select Caste</option>
				<option value="General">General</option>
				<option value="SC">SC</option>
				<option value="ST">ST</option>
				<option value="OBC-A">OBC-A</option>
				<option value="OBC-B">OBC-B</option>
			</select>
		</div>
		
		<div class="form-group">
			<label for="penNo" class="form-label">PEN Number</label>
			<input 
				type="number" 
				name="penNo" 
				id="penNo" 
				class="form-input" 
				placeholder="Optional" 
				value={student?.penNo ?? ''}
			/>
		</div>
		
		<div class="form-group">
			<label for="portalId" class="form-label">Portal ID <span class="required">*</span></label>
			<input 
				type="text" 
				name="portalId" 
				id="portalId" 
				required 
				class="form-input" 
				placeholder="e.g. 12345678901234" 
				maxlength="14" 
				value={student?.portalId ?? ''}
			/>
		</div>
	</div>

	<div class="form-section-title mt-6">Contact Details</div>
	<div class="form-grid">
		<div class="form-group">
			<label for="guardianNo" class="form-label">Guardian Number <span class="required">*</span></label>
			<input 
				type="number" 
				name="guardianNo" 
				id="guardianNo" 
				required 
				class="form-input" 
				placeholder="10-digit number" 
				value={student?.guardianNo ?? ''}
			/>
		</div>

		<div class="form-group">
			<label for="messageNo" class="form-label">Message Number <span class="required">*</span></label>
			<input 
				type="number" 
				name="messageNo" 
				id="messageNo" 
				required 
				class="form-input" 
				placeholder="10-digit number" 
				value={student?.messageNo ?? ''}
			/>
		</div>
	</div>

	<div class="form-section-title mt-6">Academic Details</div>
	<div class="form-grid">
		<div class="form-group">
			<label for="sessionId" class="form-label">Academic Session <span class="required">*</span></label>
			<select name="sessionId" id="sessionId" required class="form-select" value={enrollment?.sessionId ?? ''}>
				<option value="" disabled selected={!enrollment?.sessionId}>Select Session</option>
				{#each sessions as session (session.id)}
					<option value={session.id}>{session.name}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label for="sectionId" class="form-label">Class & Section <span class="required">*</span></label>
			<select name="sectionId" id="sectionId" required class="form-select" value={enrollment?.sectionId ?? ''}>
				<option value="" disabled selected={!enrollment?.sectionId}>Select Section</option>
				{#each sections as section (section.id)}
					<option value={section.id}>{section.fullName}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label for="rollNo" class="form-label">Roll Number <span class="required">*</span></label>
			<input 
				type="number" 
				name="rollNo" 
				id="rollNo" 
				required 
				class="form-input" 
				placeholder="e.g. 15" 
				value={enrollment?.rollNo ?? ''}
			/>
		</div>
	</div>

	<div class="form-actions mt-8">
		<button type="submit" disabled={submitting} class="primary-button full-width">
			{#if submitting}
				<svg class="spinner-icon" fill="none" viewBox="0 0 24 24">
					<circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				{isEditMode ? 'Saving Changes...' : 'Registering Student...'}
			{:else}
				{isEditMode ? 'Save Changes' : 'Register Student'}
			{/if}
		</button>
	</div>
</form>

<style>
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
