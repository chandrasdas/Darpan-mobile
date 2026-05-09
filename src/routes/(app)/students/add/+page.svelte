<svelte:head>
	<title>Add Student — Darpan</title>
</svelte:head>

<div class="page-shell">
	<section class="page-hero">
		<h1 class="page-title">Add Student</h1>
		<p class="page-subtitle">Register a new student into the system.</p>
	</section>

	<div class="placeholder-card">
		<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3">
			<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-linecap="round" stroke-linejoin="round"/>
			<circle cx="8.5" cy="7" r="4" stroke-linecap="round" stroke-linejoin="round"/>
			<line x1="20" y1="8" x2="20" y2="14" stroke-linecap="round" stroke-linejoin="round"/>
			<line x1="23" y1="11" x2="17" y2="11" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
		<span class="placeholder-text">Student registration form coming soon</span>
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
		margin: 0;
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
