<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

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

	/* ── Profile Menu & Theme State ── */
	let profileMenuOpen = $state(false);
	let useSystemTheme = $state(true);
	let isDarkMode = $state(false);

	function updateThemeClass() {
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function handleSystemThemeChange(e: MediaQueryListEvent) {
		if (useSystemTheme) {
			isDarkMode = e.matches;
			updateThemeClass();
		}
	}

	function toggleSystemTheme() {
		useSystemTheme = !useSystemTheme;
		if (useSystemTheme) {
			localStorage.removeItem('theme');
			isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
			updateThemeClass();
		} else {
			localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		}
	}

	function toggleManualTheme() {
		if (useSystemTheme) return;
		isDarkMode = !isDarkMode;
		localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		updateThemeClass();
	}

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			useSystemTheme = false;
			isDarkMode = savedTheme === 'dark';
		} else {
			useSystemTheme = true;
			isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', handleSystemThemeChange);

		return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
	});
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
		<div class="sidebar-brand">DARPAN</div>
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
				<div class="profile-menu-container">
					<button class="avatar-btn" aria-label="Profile" onclick={() => profileMenuOpen = !profileMenuOpen}>
						<div class="avatar-placeholder">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
							</svg>
						</div>
					</button>

					{#if profileMenuOpen}
						<button class="dropdown-backdrop" onclick={() => profileMenuOpen = false} aria-label="Close menu"></button>
						<div class="profile-dropdown shadow-ambient-md">
							<div class="dropdown-header">
								<div class="dropdown-title">Administrator</div>
								<div class="dropdown-subtitle">admin@darpan.edu</div>
							</div>
							<div class="dropdown-divider"></div>
							<button class="dropdown-item" onclick={() => profileMenuOpen = false}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
								<span>Profile</span>
							</button>
							<button class="dropdown-item" onclick={() => profileMenuOpen = false}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
								<span>Edit Designation</span>
							</button>
							<div class="dropdown-divider"></div>
							<div class="dropdown-section">
								<div class="dropdown-section-title">Theme</div>
								<label class="dropdown-checkbox">
									<input type="checkbox" checked={useSystemTheme} onchange={toggleSystemTheme} />
									<span>Use system's theme</span>
								</label>
								<div class="theme-toggle-group" class:disabled={useSystemTheme}>
									<button class="theme-btn" class:active={!isDarkMode} onclick={() => { if (!useSystemTheme) toggleManualTheme(); }} aria-label="Light mode">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
										<span>Light</span>
									</button>
									<button class="theme-btn" class:active={isDarkMode} onclick={() => { if (!useSystemTheme) toggleManualTheme(); }} aria-label="Dark mode">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
										<span>Dark</span>
									</button>
								</div>
							</div>
							<div class="dropdown-divider"></div>
							<button class="dropdown-item text-error" onclick={() => profileMenuOpen = false}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
								<span>Logout</span>
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- ── Main Content Area ── -->
	<main class="app-main">
		<div class="app-main-inner">
			{@render children()}
		</div>
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

	/* ── Profile Dropdown ── */
	.profile-menu-container {
		position: relative;
	}

	.profile-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 260px;
		background-color: var(--color-surface-lowest);
		border: 1px solid var(--color-outline-variant);
		border-radius: var(--radius-lg);
		z-index: 60;
		overflow: hidden;
	}

	.dropdown-backdrop {
		position: fixed;
		inset: 0;
		z-index: 55;
		background: transparent;
		border: none;
		cursor: default;
		width: 100%;
		height: 100%;
	}

	.dropdown-header {
		padding: 16px;
		background-color: var(--color-surface-low);
	}

	.dropdown-title {
		font-family: var(--font-heading);
		font-size: 16px;
		font-weight: 700;
		color: var(--color-on-surface);
	}

	.dropdown-subtitle {
		font-family: var(--font-body);
		font-size: 13px;
		color: var(--color-on-surface-variant);
		margin-top: 2px;
	}

	.dropdown-divider {
		height: 1px;
		background-color: var(--color-outline-variant);
		opacity: 0.5;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 16px;
		background: transparent;
		border: none;
		color: var(--color-on-surface);
		font-family: var(--font-body);
		font-size: 14px;
		cursor: pointer;
		text-align: left;
		transition: background-color 200ms var(--ease-smooth);
	}

	.dropdown-item:hover {
		background-color: var(--color-surface-high);
	}

	.dropdown-item.text-error {
		color: var(--color-error);
	}

	.dropdown-item.text-error:hover {
		background-color: var(--color-error-container);
		color: var(--color-on-error-container);
	}

	.dropdown-section {
		padding: 12px 16px;
	}

	.dropdown-section-title {
		font-family: var(--font-heading);
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-outline);
		margin-bottom: 12px;
	}

	.dropdown-checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-body);
		font-size: 14px;
		color: var(--color-on-surface);
		cursor: pointer;
		margin-bottom: 12px;
	}

	.dropdown-checkbox input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--color-primary);
		cursor: pointer;
	}

	.theme-toggle-group {
		display: flex;
		background-color: var(--color-surface-container);
		border-radius: var(--radius-DEFAULT);
		padding: 4px;
		gap: 4px;
	}

	.theme-toggle-group.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.theme-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-on-surface-variant);
		font-family: var(--font-body);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 200ms var(--ease-smooth);
	}

	.theme-btn.active {
		background-color: var(--color-surface-lowest);
		color: var(--color-on-surface);
		box-shadow: var(--shadow-ambient-sm);
	}

	/* ── Main Content ── */
	.app-main {
		flex: 1;
		width: 100%;
		padding-bottom: 88px;
	}

	.app-main-inner {
		max-width: 600px;
		margin: 0 auto;
		width: 100%;
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

	.sidebar-brand {
		font-family: var(--font-heading);
		font-size: 18px;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: var(--color-on-surface);
		padding: 24px 28px 4px;
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
			padding-bottom: 32px;
		}

		.app-main-inner {
			max-width: 960px;
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
			align-content: flex-start;
		}

		/* Persistent sidebar */
		.sidebar {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			z-index: 50;
			width: 220px;
			height: 100dvh;
			background-color: var(--color-surface-lowest);
			border-right: 1px solid var(--color-outline-variant);
			transform: none;
			padding-top: 0;
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
			width: calc(100% - 220px);
			margin-left: 220px;
		}

		.header-brand {
			display: none;
		}

		.header-inner {
			max-width: 100%;
			padding: 12px 40px 12px 32px;
		}

		.app-main {
			margin-left: 220px;
			width: calc(100% - 220px);
			padding: 0 40px 48px;
		}

		.app-main-inner {
			max-width: none;
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

		.app-header {
			width: calc(100% - 260px);
			margin-left: 260px;
		}

		.app-main {
			margin-left: 260px;
			width: calc(100% - 260px);
			padding: 0 56px 48px;
		}

		.app-main-inner {
			max-width: 1440px;
		}
	}
</style>
