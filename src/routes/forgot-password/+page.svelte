<script lang="ts">
	import { resolve } from '$app/paths';

	let step = $state(1); // 1: Email, 2: OTP, 3: Reset Password
	let email = $state('');
	let otp = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let token = $state(''); // Stores the Better-Auth compatible token returned from OTP verify
	
	let loading = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	async function handleSendEmail(e: Event) {
		e.preventDefault();
		errorMsg = '';
		loading = true;
		
		try {
			const res = await fetch('/api/forgot-password/otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'send', email })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');
			
			step = 2;
			successMsg = 'An OTP has been sent to your email address.';
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	async function handleVerifyOTP(e: Event) {
		e.preventDefault();
		errorMsg = '';
		successMsg = '';
		loading = true;
		
		try {
			const res = await fetch('/api/forgot-password/otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'verify', email, otp })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to verify OTP.');
			
			token = data.verifiedToken; // Set the internal auth token temporarily
			step = 3; 
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	async function handleResetPassword(e: Event) {
		e.preventDefault();
		errorMsg = '';
		
		if (newPassword !== confirmPassword) {
			errorMsg = 'Passwords do not match.';
			return;
		}
		if (newPassword.length < 8) {
			errorMsg = 'Password must be at least 8 characters long.';
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/forgot-password/reset', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, newPassword })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
			
			successMsg = 'Your password has been successfully reset! Redirecting to login...';
			step = 4; // Final success state
			setTimeout(() => {
				window.location.href = resolve('/login' as "/");
			}, 3000);
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<div class="auth-header">
			<h1 class="auth-title">Forgot Password</h1>
			<p class="auth-subtitle">
				{#if step === 1}
					Enter your email to receive a secure 6-digit OTP code.
				{:else if step === 2}
					Check your email. We've sent a 6-digit verification code to {email}.
				{:else if step === 3}
					Create a new, strong password.
				{:else if step === 4}
					<span class="color-success">Password Reset Complete.</span>
				{/if}
			</p>
		</div>

		<div class="auth-card">
			{#if errorMsg}
				<div class="auth-error mb-4">
					{errorMsg}
				</div>
			{/if}

			{#if successMsg && step !== 4}
				<div class="auth-success mb-4">
					{successMsg}
				</div>
			{/if}

			{#if step === 1}
				<form onsubmit={handleSendEmail} class="auth-form">
					<div class="input-group">
						<label for="email" class="input-label">Email Address</label>
						<input
							id="email"
							type="email"
							autocomplete="email"
							bind:value={email}
							required
							placeholder="you@example.com"
							class="input-field"
						/>
					</div>

					<button
						type="submit"
						disabled={loading || !email}
						class="submit-btn"
					>
						{#if loading}
							<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Sending...
						{:else}
							Get Verification Code
						{/if}
					</button>
				</form>
			{:else if step === 2}
				<form onsubmit={handleVerifyOTP} class="auth-form">
					<div class="input-group">
						<label for="otp" class="input-label">6-Digit Verification Code</label>
						<input
							id="otp"
							type="text"
							inputmode="numeric"
							maxlength="6"
							pattern="[0-9]*"
							bind:value={otp}
							required
							placeholder="------"
							class="input-field text-center tracking-widest text-2xl"
							style="letter-spacing: 0.5em;"
						/>
					</div>

					<div class="flex-col-gap">
						<button
							type="submit"
							disabled={loading || otp.length !== 6}
							class="submit-btn"
						>
							{#if loading}
								<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Verifying...
							{:else}
								Verify Code
							{/if}
						</button>
						<button 
							type="button" 
							onclick={handleSendEmail} 
							disabled={loading}
							class="text-sm font-medium color-outline hover:color-primary mt-2"
						>
							Resend Code
						</button>
					</div>
				</form>
			{:else if step === 3}
				<form onsubmit={handleResetPassword} class="auth-form">
					<div class="input-group">
						<label for="new-password" class="input-label">New Password</label>
						<input
							id="new-password"
							type="password"
							bind:value={newPassword}
							required
							placeholder="••••••••"
							class="input-field"
						/>
					</div>

					<div class="input-group">
						<label for="confirm-password" class="input-label">Confirm Password</label>
						<input
							id="confirm-password"
							type="password"
							bind:value={confirmPassword}
							required
							placeholder="••••••••"
							class="input-field"
						/>
					</div>

					<button
						type="submit"
						disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
						class="submit-btn"
					>
						{#if loading}
							<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Saving...
						{:else}
							Save Password
						{/if}
					</button>
				</form>
			{:else if step === 4}
				<div class="flex-col-center">
					<div class="success-icon-wrapper">
						<svg class="success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 class="auth-title mt-4">Password Updated</h3>
					<p class="auth-subtitle">{successMsg}</p>
				</div>
			{/if}
		</div>

		<p class="auth-footer">
			Remembered your password?
			<a href={resolve('/login' as "/")} class="signup-link">Log in</a>
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

	.auth-success {
		border-radius: var(--radius-lg);
		background-color: color-mix(in srgb, var(--color-status-success-text) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-status-success-text) 20%, transparent);
		padding: 16px;
		font-size: 14px;
		color: var(--color-status-success-text);
	}

	.mb-4 {
		margin-bottom: 16px;
	}

	.mt-2 {
		margin-top: 8px;
	}

	.mt-4 {
		margin-top: 16px;
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

	.color-success {
		color: var(--color-status-success-text);
	}

	.flex-col-gap {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.flex-col-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 24px 0;
	}

	.success-icon-wrapper {
		display: flex;
		height: 64px;
		width: 64px;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		background-color: color-mix(in srgb, var(--color-status-success-text) 15%, transparent);
		color: var(--color-status-success-text);
		box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-status-success-text) 10%, transparent);
	}

	.success-icon {
		height: 32px;
		width: 32px;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
