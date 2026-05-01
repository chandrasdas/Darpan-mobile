<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	/* ── Navigation Items ── */
	const navItems = [
		{ label: 'Dashboard', mobileLabel: 'Home', href: '/dashboard', icon: 'home' },
		{ label: 'Faculties', mobileLabel: 'Staff', href: '/staff', icon: 'groups' },
		{ label: 'Students', mobileLabel: 'Students', href: '/students', icon: 'person' },
		{ label: 'Exams', mobileLabel: 'Exams', href: '/exams', icon: 'assessment' },
		{ label: 'Payments', mobileLabel: 'Fees', href: '/fees', icon: 'receipt_long' }
	];

	/* Mobile bottom nav shows only 4 items (skip Exams) */
	const mobileNavItems = navItems.filter((_, i) => i !== 3);

	let scrollY = $state(0);
	let headerShadow = $derived(scrollY > 8);
	let sidebarOpen = $state(false);

	function isActive(href: string, currentPath: string): boolean {
		if (href === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
		return currentPath.startsWith(href);
	}

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<svelte:window bind:scrollY />

<!-- ── App Shell ── -->
<div class="app-shell">
	<!-- ── Sidebar Overlay (tablet only) ── -->
	{#if sidebarOpen}
		<button class="sidebar-overlay" onclick={closeSidebar} aria-label="Close menu"></button>
	{/if}

	<!-- ── Sidebar ── -->
	<aside class="sidebar" class:sidebar-open={sidebarOpen}>
		<div class="sidebar-inner">
			<span class="sidebar-section-label">MANAGEMENT</span>
			<nav class="sidebar-nav">
				{#each navItems as item (item.href)}
					{@const active = isActive(item.href, page.url.pathname)}
					<a
						href={resolve(item.href as "/")}
						class="sidebar-link"
						class:sidebar-link-active={active}
						aria-current={active ? 'page' : undefined}
						onclick={closeSidebar}
					>
						<span class="sidebar-link-icon">
							{#if item.icon === 'home'}
								<svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={active ? '0' : '1.8'}>{#if active}<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>{:else}<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>{/if}</svg>
							{:else if item.icon === 'groups'}
								<svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} stroke-width="1.8">{#if active}<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>{:else}<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>{/if}</svg>
							{:else if item.icon === 'person'}
								<svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} stroke-width="1.8">{#if active}<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>{:else}<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>{/if}</svg>
							{:else if item.icon === 'assessment'}
								<svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} stroke-width="1.8">{#if active}<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>{:else}<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 17V10M13 17V7M17 17v-4"/>{/if}</svg>
							{:else if item.icon === 'receipt_long'}
								<svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} stroke-width="1.8">{#if active}<path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM19 19c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14zM9 7h6v2H9V7zm7 0h2v2h-2V7zm-7 4h6v2H9v-2zm7 0h2v2h-2v-2z"/>{:else}<path d="M9 5h6M9 9h6M9 13h4M4 2v18a2 2 0 002 2h12a2 2 0 002-2V2" stroke-linecap="round"/><rect x="4" y="2" width="16" height="20" rx="1"/>{/if}</svg>
							{/if}
						</span>
						<span class="sidebar-link-text">{item.label}</span>
					</a>
				{/each}
			</nav>
		</div>
	</aside>

	<!-- ── Top Header ── -->
	<header class="app-header" class:header-elevated={headerShadow}>
		<div class="header-inner">
			<div class="header-left">
				<button
					class="header-icon-btn hamburger-btn"
					aria-label="Open menu"
					onclick={() => (sidebarOpen = !sidebarOpen)}
				>
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="6" x2="21" y2="6" />
						<line x1="3" y1="12" x2="15" y2="12" />
						<line x1="3" y1="18" x2="18" y2="18" />
					</svg>
				</button>
				<span class="header-brand">DARPAN</span>
			</div>
			<div class="header-right">
				<button class="header-icon-btn" aria-label="Notifications">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
						<path d="M13.73 21a2 2 0 0 1-3.46 0" />
					</svg>
					<span class="notification-dot"></span>
				</button>
				<button class="avatar-btn" aria-label="Profile">
					<div class="avatar-placeholder">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
						</svg>
					</div>
				</button>
			</div>
		</div>
	</header>

	<!-- ── Main Content Area ── -->
	<main class="app-main">
		{@render children()}
	</main>

	<!-- ── Bottom Navigation (mobile only) ── -->
	<nav class="bottom-nav">
		{#each mobileNavItems as item (item.href)}
			{@const active = isActive(item.href, page.url.pathname)}
			<a
				href={resolve(item.href as "/")}
				class="nav-item"
				class:nav-active={active}
				aria-current={active ? 'page' : undefined}
			>
				<div class="nav-icon-wrapper" class:nav-icon-active={active}>
					{#if item.icon === 'home'}
						<svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={active ? '0' : '1.8'}>{#if active}<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>{:else}<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>{/if}</svg>
					{:else if item.icon === 'groups'}
						<svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} stroke-width="1.8">{#if active}<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>{:else}<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>{/if}</svg>
					{:else if item.icon === 'person'}
						<svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} stroke-width="1.8">{#if active}<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>{:else}<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>{/if}</svg>
					{:else if item.icon === 'receipt_long'}
						<svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} stroke-width="1.8">{#if active}<path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM19 19c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14zM9 7h6v2H9V7zm7 0h2v2h-2V7zm-7 4h6v2H9v-2zm7 0h2v2h-2v-2z"/>{:else}<path d="M9 5h6M9 9h6M9 13h4M4 2v18a2 2 0 002 2h12a2 2 0 002-2V2" stroke-linecap="round"/><rect x="4" y="2" width="16" height="20" rx="1"/>{/if}</svg>
					{/if}
				</div>
				<span class="nav-label">{item.mobileLabel.toUpperCase()}</span>
			</a>
		{/each}
	</nav>
</div>

<style>
	/* ═══════════════════════════════════════════
	   APP SHELL — Mobile-first responsive layout
	   Breakpoints: md (768px) = tablet, lg (1024px) = desktop
	   ═══════════════════════════════════════════ */

	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		background-color: var(--color-surface);
	}

	/* ── Sidebar ── */
	.sidebar {
		display: none; /* hidden on mobile */
	}

	.sidebar-overlay {
		display: none;
	}

	/* ── Header ── */
	.app-header {
		position: sticky;
		top: 0;
		z-index: 40;
		background-color: var(--color-surface);
		border-bottom: 1px solid transparent;
		transition: all 250ms var(--ease-smooth);
	}

	.header-elevated {
		border-bottom-color: var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-sm);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		max-width: 600px;
		margin: 0 auto;
		width: 100%;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.header-brand {
		font-family: var(--font-heading);
		font-size: 18px;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: var(--color-on-surface);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-icon-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius-DEFAULT);
		border: none;
		background: transparent;
		color: var(--color-on-surface);
		cursor: pointer;
		transition: background 200ms var(--ease-smooth);
	}

	.header-icon-btn:hover {
		background-color: var(--color-surface-high);
	}

	.notification-dot {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 8px;
		height: 8px;
		background-color: var(--color-error);
		border-radius: var(--radius-full);
		border: 2px solid var(--color-surface);
	}

	.avatar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		border: 2px solid var(--color-outline-variant);
		background: var(--color-surface-high);
		color: var(--color-on-surface-variant);
		cursor: pointer;
		overflow: hidden;
		transition: border-color 200ms var(--ease-smooth);
	}

	.avatar-btn:hover {
		border-color: var(--color-primary);
	}

	.avatar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ── Main Content ── */
	.app-main {
		flex: 1;
		max-width: 600px;
		margin: 0 auto;
		width: 100%;
		padding-bottom: 88px;
	}

	/* ── Bottom Navigation (mobile) ── */
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: space-around;
		height: 72px;
		background-color: var(--color-surface-lowest);
		border-top: 1px solid var(--color-outline-variant);
		padding: 0 8px;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-width: 64px;
		padding: 8px 12px;
		text-decoration: none;
		color: var(--color-on-surface-variant);
		transition: color 200ms var(--ease-smooth);
	}

	.nav-active {
		color: var(--color-on-surface);
	}

	.nav-icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 32px;
		border-radius: var(--radius-full);
		transition: background-color 250ms var(--ease-smooth);
	}

	.nav-icon-active {
		background-color: var(--color-surface-high);
	}

	.nav-label {
		font-family: var(--font-heading);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
	}

	/* ── Sidebar link styles (used at md+) ── */
	.sidebar-section-label {
		font-family: var(--font-heading);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--color-outline);
		padding: 0 16px;
		margin-bottom: 8px;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sidebar-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 16px;
		border-radius: var(--radius-DEFAULT);
		text-decoration: none;
		color: var(--color-on-surface-variant);
		font-family: var(--font-body);
		font-size: 15px;
		font-weight: 400;
		transition: all 200ms var(--ease-smooth);
		min-height: 44px;
	}

	.sidebar-link:hover {
		background-color: var(--color-surface-high);
		color: var(--color-on-surface);
	}

	.sidebar-link-active {
		background-color: var(--color-secondary-container);
		color: var(--color-on-secondary-container);
		font-weight: 500;
	}

	.sidebar-link-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.sidebar-link-text {
		white-space: nowrap;
	}

	.sidebar-inner {
		display: flex;
		flex-direction: column;
		padding: 24px 12px;
		gap: 4px;
	}

	/* ═══════════════════════════════════════════
	   TABLET — md (768px)
	   Overlay sidebar, bottom nav hidden
	   ═══════════════════════════════════════════ */
	@media (min-width: 768px) {
		.app-shell {
			flex-direction: column;
		}

		.header-inner {
			max-width: 100%;
			padding: 12px 32px;
		}

		.app-main {
			max-width: 960px;
			padding-bottom: 32px;
		}

		.bottom-nav {
			display: none;
		}

		/* Sidebar as overlay on tablet */
		.sidebar {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			z-index: 50;
			width: 240px;
			height: 100dvh;
			background-color: var(--color-surface-lowest);
			border-right: 1px solid var(--color-outline-variant);
			transform: translateX(-100%);
			transition: transform 300ms var(--ease-smooth);
		}

		.sidebar-open {
			transform: translateX(0);
		}

		.sidebar-overlay {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 45;
			background: rgba(0, 0, 0, 0.3);
			border: none;
			cursor: default;
		}
	}

	/* Tablet overlay is conditionally visible via {#if sidebarOpen} in markup */

	/* ═══════════════════════════════════════════
	   DESKTOP — lg (1024px)
	   Persistent sidebar, no bottom nav
	   ═══════════════════════════════════════════ */
	@media (min-width: 1024px) {
		.app-shell {
			flex-direction: row;
			flex-wrap: wrap;
		}

		/* Persistent sidebar */
		.sidebar {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			z-index: 30;
			width: 220px;
			height: 100dvh;
			background-color: var(--color-surface-lowest);
			border-right: 1px solid var(--color-outline-variant);
			transform: none;
			padding-top: 68px; /* below header */
		}

		.sidebar-overlay {
			display: none !important;
		}

		.hamburger-btn {
			display: none;
		}

		.app-header {
			position: sticky;
			z-index: 40;
			width: 100%;
		}

		.header-inner {
			max-width: 100%;
			padding: 12px 40px 12px 32px;
		}

		.app-main {
			margin-left: 220px;
			max-width: none;
			width: calc(100% - 220px);
			padding: 0 40px 48px;
		}

		.bottom-nav {
			display: none;
		}
	}

	/* ═══════════════════════════════════════════
	   WIDE DESKTOP — xl (1280px)
	   Wider sidebar, more breathing room
	   ═══════════════════════════════════════════ */
	@media (min-width: 1280px) {
		.sidebar {
			width: 260px;
		}

		.app-main {
			margin-left: 260px;
			width: calc(100% - 260px);
			padding: 0 56px 48px;
			max-width: 1100px;
		}
	}
</style>
