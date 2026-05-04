<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { resolve } from '$app/paths';
	import { fade, slide } from 'svelte/transition';
	import { APP_NAME } from '$lib/config';
	import LogoIcon from '$lib/components/LogoIcon.svelte';

	let step = $state(1); // 1 = Email, 2 = OTP, 3 = Password
	let email = $state('');
	let otp = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSendOTP(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/register/otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'send', email })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Failed to send verification code.';
			} else {
				if (data.name) {
					name = data.name;
				}
				step = 2;
			}
		} catch {
			error = 'Network error. Please try again later.';
		} finally {
			loading = false;
		}
	}

	async function handleVerifyOTP(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/register/otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'verify', email, otp })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Invalid verification code.';
			} else {
				step = 3;
			}
		} catch {
			error = 'Network error. Please try again later.';
		} finally {
			loading = false;
		}
	}

	async function handleFinalRegister(e: Event) {
		e.preventDefault();
		
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}
		
		loading = true;
		error = '';

		const { error: registerError } = await authClient.signUp.email({
			email,
			password,
			name
		});

		loading = false;

		if (registerError) {
			if (registerError.status === 500) {
				error = 'Internal server error. Please try again later.';
			} else {
				error = registerError.message || 'An error occurred during registration.';
			}
		} else {
			window.location.href = resolve('/dashboard' as "/");
		}
	}
</script>

<svelte:head>
	<title>Register | {APP_NAME}</title>
</svelte:head>

<div class="auth-page">
	<a href={resolve('/' as "/")} class="back-link">
		<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
		</svg>
		Back
	</a>

	<div class="auth-container" in:fade={{ duration: 600, delay: 100 }}>
		<div class="auth-header">
			<div class="auth-logo-wrapper">
				<LogoIcon class="auth-logo" />
			</div>
			<h1 class="auth-title">
				{#if step === 1}
					Create an account
				{:else if step === 2}
					Verify your email
				{:else}
					Set your password
				{/if}
			</h1>
			<p class="auth-subtitle">
				{#if step === 1}
					Staff registration is an invite-only process.
				{:else if step === 2}
					We've sent a 6-digit code to {email}
				{:else}
					Almost done! Choose a secure password.
				{/if}
			</p>
		</div>

		<div class="auth-card">
			<form onsubmit={step === 1 ? handleSendOTP : step === 2 ? handleVerifyOTP : handleFinalRegister} class="auth-form">
				{#if error}
					<div in:slide class="auth-error">
						{error}
					</div>
				{/if}

				{#if step === 1}
					<div class="input-group" in:fade>
						<label for="email" class="input-label">School Email Address</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							required
							placeholder="name@school.edu"
							class="input-field"
						/>
					</div>
				{/if}

				{#if step === 2}
					<div class="input-group" in:fade>
						<label for="otp" class="input-label">6-Digit Verification Code</label>
						<input
							type="text"
							id="otp"
							bind:value={otp}
							required
							maxlength="6"
							placeholder="123456"
							class="input-field text-center tracking-widest text-2xl"
							style="letter-spacing: 0.5em;"
						/>
					</div>
				{/if}

				{#if step === 3}
					<div class="input-group" in:fade>
						<label for="password" class="input-label">Password</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							required
							placeholder="••••••••"
							class="input-field"
						/>
					</div>
					
					<div class="input-group" in:fade>
						<label for="confirmPassword" class="input-label">Confirm Password</label>
						<input
							type="password"
							id="confirmPassword"
							bind:value={confirmPassword}
							required
							placeholder="••••••••"
							class="input-field"
						/>
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading || (step === 2 && otp.length !== 6)}
					class="submit-btn"
				>
					{#if loading}
						<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
						Processing...
					{:else}
						{#if step === 1}
							Send Verification Code
						{:else if step === 2}
							Verify Code
						{:else}
							Complete Registration
						{/if}
						<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                        </svg>
					{/if}
				</button>
				
				{#if step > 1 && !loading}
					<button 
						type="button" 
						onclick={() => step = step - 1}
						class="text-sm font-medium color-outline hover:color-primary mt-2"
					>
						Go Back
					</button>
				{/if}
			</form>
		</div>

		{#if step === 1}
			<p class="auth-footer">
				Already have an account?
				<a href={resolve('/login' as "/")} class="signup-link">Sign in here</a>
			</p>
		{/if}
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

	.back-link {
		position: absolute;
		top: 24px;
		left: 24px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 500;
		color: var(--color-on-surface-variant);
		text-decoration: none;
		transition: color 200ms ease;
	}

	.back-link:hover {
		color: var(--color-on-surface);
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
		height: 56px;
		width: 56px;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-xl);
		background-color: var(--color-primary);
		box-shadow: 0 10px 25px -5px color-mix(in srgb, var(--color-primary) 40%, transparent);
	}

	:global(.auth-logo) {
		height: 28px;
		width: 28px;
		color: var(--color-on-primary);
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


	.input-label {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-on-surface-variant);
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
		background-color: var(--color-primary);
		padding: 12px 16px;
		font-size: 14px;
		font-weight: 600;
		color: var(--color-on-primary);
		border: none;
		cursor: pointer;
		margin-top: 8px;
		transition: all 200ms ease;
	}

	.submit-btn:hover:not(:disabled) {
		background-color: var(--color-primary-fixed-dim);
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

	.color-outline {
		color: var(--color-outline);
	}

	.hover\:color-primary:hover {
		color: var(--color-primary);
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
