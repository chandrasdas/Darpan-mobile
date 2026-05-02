<script lang="ts">
	import { onMount } from 'svelte';

	let { sidebarOpen = $bindable(), headerShadow }: { sidebarOpen: boolean; headerShadow: boolean } = $props();

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
							<div class="dropdown-title">John Doe</div>
							<div class="dropdown-subtitle">john.doe@darpan.edu</div>
							<div class="dropdown-role-badge">Role: Admin</div>
						</div>
						<div class="dropdown-divider"></div>
						<button class="dropdown-item" onclick={() => profileMenuOpen = false}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
							<span>View Profile</span>
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
