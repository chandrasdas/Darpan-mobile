<svelte:head>
	<title>Fee Record — Darpan</title>
</svelte:head>

<div class="page-shell">
	<section class="page-hero">
		<h1 class="page-title">Fee Record</h1>
		<p class="page-subtitle">Manage student fee collections and dues.</p>
	</section>

	<div class="placeholder-card">
		<svg
			width="48"
			height="48"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.2"
			opacity="0.3"
		>
			<path
				d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path d="M8 10h8M8 14h4" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		<span class="placeholder-text">Fee management module coming soon</span>
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
