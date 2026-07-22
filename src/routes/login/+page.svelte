<script lang="ts">
	import { onMount } from 'svelte';
	import { authClient } from '$lib/auth-client';
	import { resolve } from '$app/paths';
	import { fade, slide } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import LogoIcon from '$lib/components/LogoIcon.svelte';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
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
			window.location.href = resolve('/dashboard' as '/');
		}
	}
</script>

<svelte:head>
	<title>Login | {APP_NAME}</title>
</svelte:head>

<div class="auth-page">
	<div class="theme-switcher" in:fade={{ duration: 600, delay: 200 }}>
		<button
			type="button"
			class="theme-slide-toggle"
			class:dark={isDarkMode}
			onclick={() => setManualTheme(!isDarkMode)}
			aria-label="Toggle dark mode"
		>
			<span class="slide-thumb">
				{#if isDarkMode}
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg
					>
				{:else}
					<svg
						width="14"
						height="14"
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
				{/if}
			</span>
		</button>
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
						<a href={resolve('/forgot-password' as '/')} class="forgot-link">Forgot password?</a>
					</div>
					<div class="password-wrapper">
						<input
							type={showPassword ? 'text' : 'password'}
							id="password"
							bind:value={password}
							required
							placeholder="••••••••"
							class="input-field"
						/>
						<button
							type="button"
							class="toggle-password-btn"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							tabindex="-1"
						>
							{#if showPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
									<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
									<path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
									<line x1="2" y1="2" x2="22" y2="22" />
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<button type="submit" disabled={loading} class="submit-btn">
					{#if loading}
						<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Signing in...
					{:else}
						Sign In
						<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					{/if}
				</button>
			</form>
		</div>

		<p class="auth-footer">
			Don't have an account?
			<a href={resolve('/register' as '/')} class="signup-link">Sign up here</a>
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

	.theme-slide-toggle {
		position: relative;
		display: flex;
		align-items: center;
		width: 56px;
		height: 32px;
		background-color: var(--color-surface-container);
		border-radius: 100px;
		border: 1px solid var(--color-outline-variant);
		cursor: pointer;
		padding: 2px;
		transition:
			background-color 300ms ease,
			border-color 300ms ease;
	}

	.theme-slide-toggle.dark {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.slide-thumb {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		background-color: var(--color-surface-lowest);
		border-radius: 50%;
		box-shadow:
			var(--shadow-ambient-md),
			0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid var(--color-outline);
		color: var(--color-on-surface);
		transition:
			transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
			border-color 300ms ease;
		transform: translateX(0);
	}

	.theme-slide-toggle.dark .slide-thumb {
		transform: translateX(24px);
		color: var(--color-primary);
		border-color: transparent;
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
		box-shadow: 0 10px 25px -5px
			color-mix(in srgb, var(--color-secondary-container) 40%, transparent);
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

	.password-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.password-wrapper .input-field {
		padding-right: 44px;
	}

	.toggle-password-btn {
		position: absolute;
		right: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: transparent;
		border: none;
		border-radius: var(--radius-md, 8px);
		color: var(--color-on-surface-variant);
		cursor: pointer;
		transition: color 200ms ease, background-color 200ms ease;
	}

	.toggle-password-btn:hover {
		color: var(--color-on-surface);
		background-color: color-mix(in srgb, var(--color-on-surface) 8%, transparent);
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
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
