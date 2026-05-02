<script lang="ts">
	import './app-layout.css';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';

	let { children } = $props();

	let scrollY = $state(0);
	let headerShadow = $derived(scrollY > 8);
	let sidebarOpen = $state(false);
</script>

<svelte:window bind:scrollY />

<div class="app-shell">
	<Sidebar bind:sidebarOpen />
	<Header bind:sidebarOpen {headerShadow} />

	<!-- ── Main Content Area ── -->
	<main class="app-main">
		<div class="app-main-inner">
			{@render children()}
		</div>
	</main>

	<BottomNav />
</div>
