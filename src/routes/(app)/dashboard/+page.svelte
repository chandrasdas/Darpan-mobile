<script lang="ts">
	import { resolve } from '$app/paths';

	/* ── Stat Cards Data ── */
	const statCards = [
		{
			id: 'total-students',
			value: '1,248',
			label: 'Total Students',
			badge: '+2.4%',
			badgeType: 'success' as const,
			color: 'green' as const,
			icon: 'school'
		},
		{
			id: 'total-faculties',
			value: '84',
			label: 'Total Faculties',
			badge: 'Stable',
			badgeType: 'info' as const,
			color: 'purple' as const,
			icon: 'groups'
		},
		{
			id: 'mid-term',
			value: '68%',
			label: 'Mid-Term Evaluation',
			badge: 'Active',
			badgeType: 'success' as const,
			color: 'blue' as const,
			icon: 'assessment'
		},
		{
			id: 'payment-due',
			value: '12',
			label: 'Payment Due',
			badge: 'Action Needed',
			badgeType: 'warning' as const,
			color: 'amber' as const,
			icon: 'payment'
		}
	];

	/* ── Quick Actions ── */
	const quickActions = [
		{ label: 'Add Student', icon: 'person_add', href: '/students/add' },
		{ label: 'Mark Entry', icon: 'edit_note', href: '/admin/marks-entry' },
		{ label: 'Fee Record', icon: 'receipt', href: '/fees/record' },
		{ label: 'Reports', icon: 'analytics', href: '/reports' }
	];

	/* ── Recent Activity ── */
	const recentActivity = [
		{
			title: 'Fee payment received',
			subtitle: 'Aarav Sharma — ₹12,500',
			time: '2 min ago',
			type: 'payment' as const
		},
		{
			title: 'New admission approved',
			subtitle: 'Priya Patel — Class 8-A',
			time: '15 min ago',
			type: 'admission' as const
		},
		{
			title: 'Marks updated',
			subtitle: 'Class 10-B — Mathematics',
			time: '1 hr ago',
			type: 'marks' as const
		},
		{
			title: 'Staff leave approved',
			subtitle: 'Rajesh Kumar — 3 days',
			time: '3 hr ago',
			type: 'leave' as const
		}
	];
</script>

<svelte:head>
	<title>Dashboard — Darpan</title>
	<meta name="description" content="Darpan school management dashboard — overview of students, faculties, evaluations, and fees at a glance." />
</svelte:head>

<!-- ── Dashboard Content ── -->
<div class="dashboard">
	<!-- ── Hero Section ── -->
	<section class="hero-section">
		<div class="hero-text">
			<h1 class="hero-title">Overview</h1>
			<p class="hero-subtitle">Welcome back to the Darpan management suite.</p>
		</div>
		<a href={resolve('/reports/generate' as "/")} class="hero-cta">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
				<polyline points="14 2 14 8 20 8"/>
				<line x1="16" y1="13" x2="8" y2="13"/>
				<line x1="16" y1="17" x2="8" y2="17"/>
				<polyline points="10 9 9 9 8 9"/>
			</svg>
			Generate Report
		</a>
	</section>

	<!-- ── Stat Cards Grid ── -->
	<section class="stat-grid" aria-label="Key statistics">
		{#each statCards as card (card.id)}
			<div class="stat-card stat-card-{card.color}" id="stat-{card.id}">
				<!-- Top row: icon + badge -->
				<div class="stat-top">
					<div class="stat-icon stat-icon-{card.color}">
						{#if card.icon === 'school'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
								<path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
							</svg>
						{:else if card.icon === 'groups'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
								<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
							</svg>
						{:else if card.icon === 'assessment'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
								<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
							</svg>
						{:else if card.icon === 'payment'}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
								<path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
							</svg>
						{/if}
					</div>
					<span class="stat-badge stat-badge-{card.badgeType}">{card.badge}</span>
				</div>

				<!-- Value + Label -->
				<div class="stat-body">
					<span class="stat-value">{card.value}</span>
					<span class="stat-label">{card.label}</span>
				</div>
			</div>
		{/each}
	</section>

	<!-- ── Quick Actions ── -->
	<section class="quick-actions-section" aria-label="Quick actions">
		<h3 class="section-title">Quick Actions</h3>
		<div class="quick-actions-grid">
			{#each quickActions as action (action.href)}
				<a href={resolve(action.href as "/")} class="quick-action-btn">
					<div class="quick-action-icon">
						{#if action.icon === 'person_add'}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
								<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
								<circle cx="8.5" cy="7" r="4"/>
								<line x1="20" y1="8" x2="20" y2="14"/>
								<line x1="23" y1="11" x2="17" y2="11"/>
							</svg>
						{:else if action.icon === 'edit_note'}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
								<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
								<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
							</svg>
						{:else if action.icon === 'receipt'}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
								<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/>
								<path d="M8 10h8M8 14h4"/>
							</svg>
						{:else if action.icon === 'analytics'}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 20V10M12 20V4M6 20v-6"/>
							</svg>
						{/if}
					</div>
					<span class="quick-action-label">{action.label}</span>
				</a>
			{/each}
		</div>
	</section>

	<!-- ── Recent Activity ── -->
	<section class="activity-section" aria-label="Recent activity">
		<div class="section-header">
			<h3 class="section-title">Recent Activity</h3>
			<a href={resolve('/activity' as "/")} class="section-link">View all</a>
		</div>
		<div class="activity-list">
			{#each recentActivity as item, i (i)}
				<div class="activity-item" class:activity-item-even={i % 2 === 1}>
					<div class="activity-dot activity-dot-{item.type}"></div>
					<div class="activity-content">
						<span class="activity-title">{item.title}</span>
						<span class="activity-subtitle">{item.subtitle}</span>
					</div>
					<span class="activity-time">{item.time}</span>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	/* ── Dashboard Container ── */
	.dashboard {
		padding: 0 20px 32px;
	}

	/* ── Hero Section ── */
	.hero-section {
		padding: 24px 0 20px;
	}

	.hero-title {
		font-family: var(--font-heading);
		font-size: 32px;
		font-weight: 700;
		color: var(--color-on-surface);
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.hero-subtitle {
		font-family: var(--font-body);
		font-size: 16px;
		color: var(--color-on-surface-variant);
		margin-top: 6px;
		line-height: 1.5;
	}

	/* ── Stat Cards Grid ── */
	.stat-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
	}

	.stat-card {
		border-radius: var(--radius-lg);
		padding: 18px;
		min-height: 150px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		transition: transform 250ms var(--ease-smooth), box-shadow 250ms var(--ease-smooth);
	}

	.stat-card:active {
		transform: scale(0.97);
	}

	/* Card color variants */
	.stat-card-green {
		background: linear-gradient(145deg, var(--color-card-green), color-mix(in srgb, var(--color-card-green) 85%, var(--color-card-green-icon)));
	}

	.stat-card-purple {
		background: linear-gradient(145deg, var(--color-card-purple), color-mix(in srgb, var(--color-card-purple) 85%, var(--color-card-purple-icon)));
	}

	.stat-card-blue {
		background: linear-gradient(145deg, var(--color-card-blue), color-mix(in srgb, var(--color-card-blue) 85%, var(--color-card-blue-icon)));
	}

	.stat-card-amber {
		background: linear-gradient(145deg, var(--color-card-amber), color-mix(in srgb, var(--color-card-amber) 85%, var(--color-card-amber-icon)));
	}

	.stat-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
	}

	.stat-icon-green {
		color: var(--color-card-green-icon);
		background-color: color-mix(in srgb, var(--color-card-green-icon) 15%, transparent);
	}

	.stat-icon-purple {
		color: var(--color-card-purple-icon);
		background-color: color-mix(in srgb, var(--color-card-purple-icon) 15%, transparent);
	}

	.stat-icon-blue {
		color: var(--color-card-blue-icon);
		background-color: color-mix(in srgb, var(--color-card-blue-icon) 15%, transparent);
	}

	.stat-icon-amber {
		color: var(--color-card-amber-icon);
		background-color: color-mix(in srgb, var(--color-card-amber-icon) 15%, transparent);
	}

	.stat-badge {
		font-family: var(--font-heading);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		padding: 3px 10px;
		border-radius: var(--radius-full);
	}

	.stat-badge-success {
		color: var(--color-status-success-text);
		background-color: color-mix(in srgb, var(--color-status-success-text) 15%, transparent);
	}

	.stat-badge-info {
		color: var(--color-status-info-text);
		background-color: color-mix(in srgb, var(--color-status-info-text) 15%, transparent);
	}

	.stat-badge-warning {
		color: var(--color-status-warning-text);
		background-color: color-mix(in srgb, var(--color-status-warning-text) 15%, transparent);
	}

	.stat-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: auto;
		padding-top: 12px;
	}

	.stat-value {
		font-family: var(--font-heading);
		font-size: 34px;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.02em;
		color: var(--color-on-surface);
	}

	.stat-label {
		font-family: var(--font-body);
		font-size: 13px;
		font-weight: 400;
		color: var(--color-on-surface-variant);
		margin-top: 4px;
	}

	/* ── Quick Actions ── */
	.quick-actions-section {
		margin-top: 32px;
	}

	.section-title {
		font-family: var(--font-heading);
		font-size: 18px;
		font-weight: 600;
		color: var(--color-on-surface);
		letter-spacing: -0.01em;
		margin-bottom: 16px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.section-header .section-title {
		margin-bottom: 0;
	}

	.section-link {
		font-family: var(--font-heading);
		font-size: 13px;
		font-weight: 600;
		color: var(--color-secondary);
		text-decoration: none;
		letter-spacing: 0.02em;
		transition: color 200ms var(--ease-smooth);
	}

	.section-link:hover {
		color: var(--color-primary);
	}

	.quick-actions-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}

	.quick-action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px 8px;
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-lg);
		text-decoration: none;
		box-shadow: var(--shadow-ambient-sm);
		transition: all 200ms var(--ease-smooth);
	}

	.quick-action-btn:hover {
		box-shadow: var(--shadow-ambient);
		transform: translateY(-1px);
	}

	.quick-action-btn:active {
		transform: scale(0.95);
	}

	.quick-action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius-DEFAULT);
		background-color: var(--color-surface-container);
		color: var(--color-on-surface);
		transition: background-color 200ms var(--ease-smooth);
	}

	.quick-action-btn:hover .quick-action-icon {
		background-color: var(--color-primary);
		color: var(--color-on-primary);
	}

	.quick-action-label {
		font-family: var(--font-heading);
		font-size: 11px;
		font-weight: 600;
		color: var(--color-on-surface-variant);
		text-align: center;
		letter-spacing: 0.02em;
		line-height: 1.3;
	}

	/* ── Activity Section ── */
	.activity-section {
		margin-top: 32px;
	}

	.activity-list {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-ambient-sm);
		overflow: hidden;
	}

	.activity-item {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		transition: background-color 150ms var(--ease-smooth);
	}

	.activity-item-even {
		background-color: var(--color-surface-container);
	}

	.activity-item:not(:last-child) {
		border-bottom: 1px solid var(--color-surface-container);
	}

	.activity-dot {
		width: 10px;
		height: 10px;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}

	.activity-dot-payment {
		background-color: #34a853;
	}

	.activity-dot-admission {
		background-color: #4285f4;
	}

	.activity-dot-marks {
		background-color: #7c4dff;
	}

	.activity-dot-leave {
		background-color: #ff8f00;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.activity-title {
		font-family: var(--font-heading);
		font-size: 14px;
		font-weight: 600;
		color: var(--color-on-surface);
		letter-spacing: 0;
	}

	.activity-subtitle {
		font-family: var(--font-body);
		font-size: 13px;
		color: var(--color-on-surface-variant);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.activity-time {
		font-family: var(--font-heading);
		font-size: 11px;
		font-weight: 500;
		color: var(--color-outline);
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* ── Hero CTA Button ── */
	.hero-cta {
		display: none; /* hidden on mobile */
	}

	/* ═══ TABLET (768px) ═══ */
	@media (min-width: 768px) {
		.dashboard {
			padding: 0 32px 48px;
		}

		.hero-section {
			display: flex;
			align-items: flex-end;
			justify-content: space-between;
			gap: 16px;
			padding: 32px 0 28px;
		}

		.hero-cta {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 10px 20px;
			background-color: var(--color-primary);
			color: var(--color-on-primary);
			font-family: var(--font-heading);
			font-size: 14px;
			font-weight: 600;
			letter-spacing: 0.02em;
			border-radius: var(--radius-DEFAULT);
			text-decoration: none;
			white-space: nowrap;
			min-height: 44px;
			transition: all 200ms var(--ease-smooth);
			flex-shrink: 0;
		}

		.hero-cta:hover {
			filter: brightness(1.1);
		}

		.hero-title {
			font-size: 36px;
		}

		.stat-grid {
			gap: 20px;
		}

		.stat-card {
			padding: 24px;
			min-height: 180px;
		}

		.stat-value {
			font-size: 42px;
		}

		.stat-label {
			font-size: 14px;
		}
	}

	/* ═══ DESKTOP (1024px) ═══ */
	@media (min-width: 1024px) {
		.dashboard {
			padding: 0 0 48px;
		}

		.hero-section {
			padding: 36px 0 32px;
		}

		.hero-title {
			font-size: 40px;
		}

		.stat-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 24px;
		}

		.stat-card {
			padding: 28px;
			min-height: 200px;
			border-radius: var(--radius-xl);
		}

		.stat-card:hover {
			transform: translateY(-2px);
			box-shadow: var(--shadow-ambient-md);
		}

		.stat-value {
			font-size: 48px;
		}

		.stat-label {
			font-size: 15px;
		}

		.stat-icon {
			width: 48px;
			height: 48px;
		}

		.quick-actions-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 16px;
		}

		.quick-action-btn {
			padding: 20px 12px;
		}

		.quick-action-label {
			font-size: 13px;
		}

		.activity-item {
			padding: 18px 24px;
		}
	}
</style>
