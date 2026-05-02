<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { mobileNavItems, isActive } from '$lib/config/navigation';
	import NavIcon from './NavIcon.svelte';
</script>

<nav class="bottom-nav">
	{#each mobileNavItems as item (item.label)}
		{@const active = isActive(item.href, page.url.pathname)}
		<a
			href={resolve(item.href as "/")}
			class="nav-item"
			class:nav-active={active}
			aria-current={active ? 'page' : undefined}
		>
			<div class="nav-icon-wrapper" class:nav-icon-active={active}>
				<NavIcon iconName={item.icon} {active} size={24} />
			</div>
			<span class="nav-label">{item.label.toUpperCase()}</span>
		</a>
	{/each}
</nav>
