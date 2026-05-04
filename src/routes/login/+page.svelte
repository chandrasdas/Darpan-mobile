<script lang="ts">
	import { onMount } from 'svelte';
	import { authClient } from '$lib/auth-client';
	import { resolve } from '$app/paths';
	import { fade, slide } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import LogoIcon from '$lib/components/LogoIcon.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	let isDarkMode = $state(false);

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

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		const { error: loginError } = await authClient.signIn.email({
			email,
			password
		});

		loading = false;

		if (loginError) {
			if (loginError.status === 500) {
				error = 'Database connection error or internal server error. Please try again later.';
			} else {
				error = loginError.message || 'Invalid email or password.';
			}
		} else {
			window.location.href = resolve('/dashboard' as "/");
		}
	}
</script>

<svelte:head>
	<title>Login | {APP_NAME}</title>
</svelte:head>

<div class="auth-page">
	<div class="theme-switcher" in:fade={{ duration: 600, delay: 200 }}>
		<div class="theme-toggle-pills">
			<button type="button" class="pill-btn" class:active={!isDarkMode} onclick={() => setManualTheme(false)} aria-label="Light mode">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
			</button>
			<button type="button" class="pill-btn" class:active={isDarkMode} onclick={() => setManualTheme(true)} aria-label="Dark mode">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
			</button>
		</div>
	</div>

	<div class="auth-container" in:fade={{ duration: 600, delay: 100 }}>
		<div class="auth-header">
			<div class="auth-logo-wrapper">
				<LogoIcon class="size-11 text-on-secondary-container" />
			</div>
			<h1 class="auth-title">Darpan</h1>
			<p class="auth-subtitle">A mirror reflecting the excellence of Vidyamandir</p>
		</div>

		<div class="auth-card">
			<form onsubmit={handleLogin} class="auth-form">
				{#if error}
					<div in:slide class="auth-error">
						{error}
					</div>
				{/if}

				<div class="input-group">
					<label for="email" class="input-label">Email Address</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						placeholder="name@example.com"
						class="input-field"
					/>
				</div>

				<div class="input-group">
					<div class="input-header">
						<label for="password" class="input-label">Password</label>
						<a href={resolve('/forgot-password' as "/")} class="forgot-link">Forgot password?</a>
					</div>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						placeholder="••••••••"
						class="input-field"
					/>
				</div>

				<button type="submit" disabled={loading} class="submit-btn">
					{#if loading}
						<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
						Signing in...
					{:else}
						Sign In
						<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                        </svg>
					{/if}
				</button>
			</form>
		</div>

		<p class="auth-footer">
			Don't have an account?
			<a href={resolve('/register' as "/")} class="signup-link">Sign up here</a>
		</p>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		min-height: 100vh;
		align-items: center;
		justify-content: center;
		background-color: var(--color-surface);
		color: var(--color-on-surface);
		position: relative;
		font-family: var(--font-sans, system-ui, sans-serif);
	}

	.theme-switcher {
		position: absolute;
		top: 24px;
		right: 24px;
		display: flex;
		align-items: center;
		gap: 16px;
		background-color: var(--color-surface-lowest);
		padding: 8px 16px;
		border-radius: 100px;
		box-shadow: var(--shadow-ambient-sm);
		border: 1px solid var(--color-outline-variant);
		z-index: 20;
	}

	.theme-toggle-pills {
		display: flex;
		background-color: var(--color-surface-container);
		border-radius: 100px;
		padding: 2px;
		gap: 2px;
	}

	.pill-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 100px;
		border: none;
		background: transparent;
		color: var(--color-on-surface-variant);
		cursor: pointer;
		transition: all 200ms ease;
	}

	.pill-btn.active {
		background-color: var(--color-primary);
		color: var(--color-on-primary);
		box-shadow: var(--shadow-ambient-sm);
	}

	@media (max-width: 600px) {
		.theme-switcher {
			top: 16px;
			right: 16px;
			padding: 6px 12px;
			gap: 12px;
		}
	}

	.auth-container {
		position: relative;
		z-index: 10;
		width: 100%;
		max-width: 440px;
		padding: 32px;
	}

	.auth-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.auth-logo-wrapper {
		margin: 0 auto 24px;
		display: flex;
		height: 70px;
		width: 70px;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-xl);
		background-color: var(--color-secondary-container);
		box-shadow: 0 10px 25px -5px color-mix(in srgb, var(--color-secondary-container) 40%, transparent);
	}



	.auth-title {
		font-family: var(--font-heading);
		font-size: 30px;
		font-weight: 700;
		color: var(--color-on-surface);
		margin: 0 0 8px 0;
		letter-spacing: -0.02em;
	}

	.auth-subtitle {
		font-family: var(--font-body);
		font-size: 14px;
		color: var(--color-on-surface-variant);
		margin: 0;
	}

	.auth-card {
		background-color: var(--color-surface-lowest);
		border-radius: var(--radius-2xl);
		padding: 32px;
		box-shadow: var(--shadow-ambient-md);
		border: 1px solid var(--color-outline-variant);
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.auth-error {
		border-radius: var(--radius-lg);
		background-color: color-mix(in srgb, var(--color-error) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
		padding: 16px;
		font-size: 14px;
		color: var(--color-error);
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.input-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.input-label {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-on-surface-variant);
	}

	.forgot-link {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
		transition: color 200ms ease;
	}

	.forgot-link:hover {
		color: var(--color-secondary);
	}

	.input-field {
		width: 100%;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 12px 16px;
		font-size: 14px;
		color: var(--color-on-surface);
		transition: all 200ms ease;
	}
    
    .input-field::placeholder {
        color: var(--color-outline);
    }

	.input-field:focus {
		border-color: var(--color-primary);
		background-color: var(--color-surface-lowest);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.submit-btn {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border-radius: var(--radius-lg);
		background-color: var(--color-secondary);
		padding: 12px 16px;
		font-size: 14px;
		font-weight: 600;
		color: var(--color-on-secondary);
		border: none;
		cursor: pointer;
		margin-top: 8px;
		transition: all 200ms ease;
	}

	.submit-btn:hover:not(:disabled) {
		background-color: color-mix(in srgb, var(--color-secondary) 85%, var(--color-on-surface));
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		height: 16px;
		width: 16px;
		animation: spin 1s linear infinite;
	}

	.btn-icon {
		height: 16px;
		width: 16px;
		transition: transform 200ms ease;
	}

	.submit-btn:hover:not(:disabled) .btn-icon {
		transform: translateX(4px);
	}

	.auth-footer {
		margin-top: 32px;
		text-align: center;
		font-size: 14px;
		color: var(--color-on-surface-variant);
	}

	.signup-link {
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
		transition: color 200ms ease;
	}

	.signup-link:hover {
		color: var(--color-secondary);
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
