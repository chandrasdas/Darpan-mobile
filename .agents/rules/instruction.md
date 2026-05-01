---
trigger: always_on
---

# Project Overview & Stack

You are an expert developer working on Darpan, a high-performance school management system.

- Framework: SvelteKit (Node adapter)
- Frontend: Svelte 5 (Strictly use Rune syntax: $state, $derived, $props, etc.)
- Styling: Tailwind CSS v4
- Auth: Better-Auth (better-auth)
- Database: Drizzle ORM with libSQL (local)
- Package Manager: pnpm (Never use npm or yarn)
- OS Environment: Windows (Ensure all shell commands are PowerShell/CMD compatible)

# Core Development Rules

## SvelteKit Navigation & Pathing

- Constraint: Prevent `svelte/no-navigation-without-resolve` errors.
- Requirement: Never use hardcoded strings for internal `href` attributes.

**Syntax:**

```svelte
<script>
	import { resolve } from '$app/paths'; // Ensure this utility exists or use the 'base' import
</script>

<a href={resolve('/dashboard')}>Go to Dashboard</a>
```

## Mobile-First Design (Tailwind CSS v4)

- Philosophy: Design for the smallest screen first.
- Use responsive modifiers (`md:`, `lg:`, etc.) only to scale up for desktop.
- Touch targets: Ensure buttons and interactive elements have a minimum height/width of 44px for mobile usability.
- Navigation: Prioritize bottom-bar navigation or collapsible "hamburger" menus for mobile views.

## Svelte 5 / Runes Best Practices

- Use `$props()` for component inputs.
- Use `$state()` for reactive variables instead of `let`.
- Prefer `$derived()` over `$state()` for computed values to maintain a single source of truth.

## Package Management

- Use `pnpm add <package>` for installs.
- Use `pnpm <script>` for running project scripts.

## SvelteKit `resolve` with Dynamic Paths

- **Constraint:** Passing dynamic strings (e.g. `item.href`) to `$app/paths` `resolve()` causes strict routing TypeScript errors. Workarounds like `as any` or `as never` fail ESLint or cause signature mismatches.
- **Requirement:** Type-cast the dynamic string to `"/"` to safely satisfy both SvelteKit's route checker and ESLint.

**Syntax:**

```svelte
<!-- ✅ Correct -->
<a href={resolve(item.href as "/")}>Go to Dashboard</a>
```

## Svelte `{#each}` Keying

- **Constraint:** Unkeyed `{#each}` loops cause "Each block should have a key" compiler errors and lead to inefficient DOM rendering.
- **Requirement:** Always append a unique key to `{#each}` loops. Use a unique property if available, otherwise use the array index `(i)`.

**Syntax:**

```svelte
<!-- ❌ Incorrect -->
{#each list as item}

<!-- ✅ Correct -->
{#each list as item (item.id)}
{#each list as item, i (i)}
```
