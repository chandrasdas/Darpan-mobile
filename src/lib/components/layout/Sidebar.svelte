<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { navItems, isActive } from '$lib/config/navigation';
	import type { NavItem } from '$lib/config/navigation';
	import NavIcon from './NavIcon.svelte';
	import type { AppUser } from '$lib/types';

	let { sidebarOpen = $bindable(), user }: { sidebarOpen: boolean; user?: AppUser } = $props();
	let expandedMenus = $state<Record<string, boolean>>({});

	// Filter out adminOnly items for non-admin users
	const visibleNavItems = $derived<NavItem[]>(
		navItems.map((item) => ({
			...item,
			subItems: item.subItems?.filter((sub) => !sub.adminOnly || user?.role === 'admin')
		})).filter((item) => !item.adminOnly || user?.role === 'admin')
	);

	onMount(() => {
		for (const item of visibleNavItems) {
			if (item.subItems?.some(sub => isActive(sub.href, page.url.pathname))) {
				expandedMenus[item.label] = true;
			}
		}
	});

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

{#if sidebarOpen}
	<button class="sidebar-overlay" onclick={closeSidebar} aria-label="Close menu"></button>
{/if}

<aside class="sidebar" class:sidebar-open={sidebarOpen}>
	<div class="sidebar-brand">DARPAN</div>
	<div class="sidebar-inner">
		<span class="sidebar-section-label">MANAGEMENT</span>
		<nav class="sidebar-nav">
			{#each visibleNavItems as item (item.label)}
				{@const hasSubItems = item.subItems && item.subItems.length > 0}
				{@const active = item.href ? isActive(item.href, page.url.pathname) : (item.subItems?.some(sub => isActive(sub.href, page.url.pathname)) ?? false)}
				
				{#if hasSubItems}
					<button
						class="sidebar-link w-full text-left bg-transparent border-none focus:outline-none"
						class:sidebar-link-active={active}
						onclick={() => expandedMenus[item.label] = !expandedMenus[item.label]}
						aria-expanded={expandedMenus[item.label]}
					>
						<span class="sidebar-link-icon">
							<NavIcon iconName={item.icon} {active} />
						</span>
						<span class="sidebar-link-text flex-1">{item.label}</span>
						<span class="sidebar-chevron transition-transform duration-200" class:rotate-180={expandedMenus[item.label]}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
						</span>
					</button>
					{#if expandedMenus[item.label]}
						<div class="sidebar-subnav flex flex-col gap-1 pl-10 pr-4 pb-2">
							{#each item.subItems as sub (sub.label)}
								{@const subActive = isActive(sub.href, page.url.pathname)}
								<a
									href={sub.href === '#' ? '#' : resolve(sub.href as "/")}
									class="sidebar-sublink flex items-center gap-3 py-2 px-3 rounded-md text-[14px] transition-colors duration-200 {subActive ? 'text-[var(--color-on-secondary-container)] font-medium bg-[var(--color-secondary-container)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-high)]'}"
									onclick={(e) => {
										if (sub.href === '#') {
											e.preventDefault();
										} else {
											closeSidebar();
										}
									}}
								>
									<span class="sidebar-sublink-dot w-[5px] h-[5px] rounded-full {subActive ? 'bg-[var(--color-primary)]' : 'bg-current opacity-40'}"></span>
									<span class="sidebar-sublink-text">{sub.label}</span>
								</a>
							{/each}
						</div>
					{/if}
				{:else}
					<a
						href={item.href === '#' ? '#' : resolve(item.href as "/")}
						class="sidebar-link"
						class:sidebar-link-active={active}
						aria-current={active ? 'page' : undefined}
						onclick={(e) => {
							if (item.href === '#') {
								e.preventDefault();
							} else {
								closeSidebar();
							}
						}}
					>
						<span class="sidebar-link-icon">
							<NavIcon iconName={item.icon} {active} />
						</span>
						<span class="sidebar-link-text">{item.label}</span>
					</a>
				{/if}
			{/each}
		</nav>
	</div>
</aside>
