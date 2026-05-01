<svelte:head>
	<title>Students — Darpan</title>
</svelte:head>

<div class="page-shell">
	<section class="page-hero">
		<h1 class="page-title">Students</h1>
		<p class="page-subtitle">Student enrollment and records.</p>
	</section>

	<div class="placeholder-card">
		<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3">
			<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
		<span class="placeholder-text">Student management coming soon</span>
	</div>
</div>

<style>
	.page-shell {
		padding: 0 20px 32px;
	}

	.page-hero {
		padding: 24px 0 20px;
	}

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
