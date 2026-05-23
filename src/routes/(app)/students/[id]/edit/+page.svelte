<script lang="ts">
	import { resolve } from '$app/paths';
	import { fade } from 'svelte/transition';
	import StudentForm from '$lib/components/StudentForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { form, data } = $props<{ form: ActionData; data: PageData }>();
</script>

<svelte:head>
	<title>Edit {data.student.name} — Darpan</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
	<div class="page-hero">
		<div class="hero-header">
			<a
				href={resolve(`/students/${data.student.sid}` as '/')}
				aria-label="Return to Student Details"
				class="back-button"
			>
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
				<h1 class="page-title">Edit Details</h1>
				<p class="page-subtitle">
					Update student information for <strong>{data.student.name}</strong>.
				</p>
			</div>
		</div>
	</div>

	<div class="form-card">
		<StudentForm
			sessions={data.sessions}
			sections={data.sections}
			student={data.student}
			enrollment={data.enrollment}
			{form}
		/>
	</div>
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
</style>
