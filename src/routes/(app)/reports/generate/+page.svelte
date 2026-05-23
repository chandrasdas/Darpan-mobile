<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Generate Report — Darpan</title>
</svelte:head>

<div class="page-container">
	<header class="page-header">
		<h1 class="page-title">Generate Report</h1>
		<p class="page-subtitle">Configure and download your reports.</p>
	</header>

	<section class="content-section">
		<div class="card">
			<p>Report generation module is under construction.</p>
			<a href={resolve('/dashboard' as '/')} class="back-link">Return to Dashboard</a>
		</div>
	</section>
</div>

<style>
	.page-container {
		padding: 24px;
	}
	.page-header {
		margin-bottom: 24px;
	}
	.page-title {
		font-family: var(--font-heading);
		font-size: 24px;
		font-weight: 700;
		color: var(--color-on-surface);
	}
	.page-subtitle {
		font-family: var(--font-body);
		font-size: 14px;
		color: var(--color-on-surface-variant);
		margin-top: 4px;
	}
	.card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-lg);
		padding: 24px;
		box-shadow: var(--shadow-ambient-sm);
		text-align: center;
	}
	.card p {
		font-family: var(--font-body);
		color: var(--color-on-surface-variant);
		margin-bottom: 16px;
	}
	.back-link {
		display: inline-block;
		font-family: var(--font-heading);
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}
	.back-link:hover {
		text-decoration: underline;
	}
</style>
