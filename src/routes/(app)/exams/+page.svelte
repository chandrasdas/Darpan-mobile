<svelte:head>
	<title>Exams — Darpan</title>
</svelte:head>

<div class="page-shell">
	<section class="page-hero">
		<h1 class="page-title">Exams</h1>
		<p class="page-subtitle">Exam schedules, marks entry, and results.</p>
	</section>

	<div class="placeholder-card">
		<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3">
			<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
		</svg>
		<span class="placeholder-text">Exam management coming soon</span>
	</div>
</div>

<style>
	.page-shell { padding: 0 20px 32px; }
	.page-hero { padding: 24px 0 20px; }
	.page-title {
		font-family: var(--font-heading);
		font-size: 32px;
		font-weight: 700;
		color: var(--color-on-surface);
		letter-spacing: -0.02em;
	}
	.page-subtitle {
		font-family: var(--font-body);
		font-size: 16px;
		color: var(--color-on-surface-variant);
		margin-top: 6px;
	}
	.placeholder-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 64px 24px;
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-ambient-sm);
	}
	.placeholder-text {
		font-family: var(--font-heading);
		font-size: 14px;
		font-weight: 500;
		color: var(--color-outline);
		letter-spacing: 0.02em;
	}
</style>
