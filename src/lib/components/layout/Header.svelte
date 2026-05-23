<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';
	import type { AppUser } from '$lib/types';

	let {
		sidebarOpen = $bindable(),
		headerShadow,
		user
	}: {
		sidebarOpen: boolean;
		headerShadow: boolean;
		user?: AppUser;
	} = $props();

	/* ── Profile Menu & Theme State ── */
	let profileMenuOpen = $state(false);
	let isDarkMode = $state(false);
	let loggingOut = $state(false);

	// Derive display values from user
	const userName = $derived(user?.name ?? 'User');
	const userEmail = $derived(user?.email ?? '');
	const userRole = $derived(
		user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Staff'
	);
	const userInitials = $derived(
		userName
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((w: string) => w[0].toUpperCase())
			.join('')
	);

	function updateThemeClass() {
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function setManualTheme(dark: boolean) {
		isDarkMode = dark;
		localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		updateThemeClass();
	}

	async function handleLogout() {
		loggingOut = true;
		await authClient.signOut();
		goto(resolve('/login' as '/'));
	}

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			isDarkMode = savedTheme === 'dark';
		} else {
			isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
			localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		}
		updateThemeClass();
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
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="12" x2="15" y2="12" />
					<line x1="3" y1="18" x2="18" y2="18" />
				</svg>
			</button>
			<span class="header-brand">DARPAN</span>
		</div>
		<div class="header-right">
			<button class="header-icon-btn" aria-label="Notifications">
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
					<path d="M13.73 21a2 2 0 0 1-3.46 0" />
				</svg>
				<span class="notification-dot"></span>
			</button>
			<button
				class="header-icon-btn"
				onclick={() => setManualTheme(!isDarkMode)}
				aria-label="Toggle theme"
			>
				{#if isDarkMode}
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line
							x1="12"
							y1="21"
							x2="12"
							y2="23"
						/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line
							x1="18.36"
							y1="18.36"
							x2="19.78"
							y2="19.78"
						/><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line
							x1="4.22"
							y1="19.78"
							x2="5.64"
							y2="18.36"
						/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg
					>
				{:else}
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg
					>
				{/if}
			</button>
			<div class="profile-menu-container">
				<button
					class="avatar-btn"
					aria-label="Profile"
					onclick={() => (profileMenuOpen = !profileMenuOpen)}
				>
					<div class="avatar-placeholder avatar-initials">
						{userInitials}
					</div>
				</button>

				{#if profileMenuOpen}
					<button
						class="dropdown-backdrop"
						onclick={() => (profileMenuOpen = false)}
						aria-label="Close menu"
					></button>
					<div class="profile-dropdown shadow-ambient-md">
						<div class="dropdown-header">
							<div class="dropdown-title">{userName}</div>
							<div class="dropdown-subtitle">{userEmail}</div>
							<div class="dropdown-role-badge">Role: {userRole}</div>
						</div>
						<div class="dropdown-divider"></div>
						<button class="dropdown-item" onclick={() => (profileMenuOpen = false)}>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle
									cx="12"
									cy="7"
									r="4"
								></circle></svg
							>
							<span>View Profile</span>
						</button>
						<button class="dropdown-item text-error" onclick={handleLogout} disabled={loggingOut}>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline
									points="16 17 21 12 16 7"
								></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg
							>
							<span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>
