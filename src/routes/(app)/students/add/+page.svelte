<script lang="ts">
	import { resolve } from '$app/paths';
	import { fade } from 'svelte/transition';
	import StudentForm from '$lib/components/StudentForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data } = $props<{ form: ActionData; data: PageData }>();
</script>

<svelte:head>
	<title>Add Student — Darpan</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<div class="page-hero">
		<div class="hero-header">
			<a href={resolve('/dashboard' as '/')} aria-label="Return to Dashboard" class="back-button">
				<svg class="back-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
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
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<h2 class="status-title">Student Registered Successfully!</h2>
			<p class="status-message">
				The new student has been saved to the database and enrolled in the selected session.
			</p>

			<div class="status-action">
				<a
					href={resolve('/students/add' as '/')}
					class="primary-button"
					onclick={() => window.location.reload()}
				>
					Register Another Student
				</a>
			</div>
		</div>
	{:else}
		<div class="form-card">
			<StudentForm sessions={data.sessions} sections={data.sections} {form} />
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

	.primary-button:hover {
		filter: brightness(1.1);
	}
</style>
