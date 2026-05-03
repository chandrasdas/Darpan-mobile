<script lang="ts">
	import './app-layout.css';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	let scrollY = $state(0);
	let headerShadow = $derived(scrollY > 8);
	let sidebarOpen = $state(false);
</script>

<svelte:window bind:scrollY />

<div class="app-shell">
	<Sidebar bind:sidebarOpen user={data.user} />
	<Header bind:sidebarOpen {headerShadow} user={data.user} />

	<!-- ── Main Content Area ── -->
	<main class="app-main">
		<div class="app-main-inner">
			{@render children()}
		</div>
	</main>

	<BottomNav />
</div>
