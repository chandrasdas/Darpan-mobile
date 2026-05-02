<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Reports — Darpan</title>
</svelte:head>

<div class="page-container">
	<header class="page-header">
		<h1 class="page-title">Reports</h1>
		<p class="page-subtitle">View and manage your reports.</p>
	</header>

	<section class="content-section">
		<div class="card">
			<p>Reports dashboard is under construction.</p>
			<div class="actions">
				<a href={resolve('/reports/generate' as "/")} class="btn-primary">Generate New Report</a>
			</div>
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
	.actions {
		margin-top: 16px;
	}
	.btn-primary {
		display: inline-block;
		padding: 10px 20px;
		background-color: var(--color-primary);
		color: var(--color-on-primary);
		font-family: var(--font-heading);
		font-size: 14px;
		font-weight: 600;
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: background-color 200ms ease;
	}
	.btn-primary:hover {
		background-color: var(--color-primary-variant);
	}
</style>
