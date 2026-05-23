<script lang="ts">
	let { class: className = 'h-5 w-5 text-white' } = $props<{ class?: string }>();
</script>

<svg
	class={className}
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<!-- Outer Frame -->
	<ellipse cx="12" cy="12" rx="9" ry="11" stroke-width="2" />

	<!-- Inner Bevel/Glass Edge -->
	<ellipse cx="12" cy="12" rx="7" ry="9" stroke-width="1" stroke-opacity="0.4" />

	<!-- Primary Reflection Line (Larger, central) -->
	<line x1="9" y1="14" x2="15" y2="8" stroke-width="1.5" stroke-opacity="0.6" />

	<!-- Secondary Reflection Line (Smaller, closer to the main line) -->
	<line x1="8" y1="12" x2="11" y2="9" stroke-width="1.5" stroke-opacity="0.6" />
</svg>
