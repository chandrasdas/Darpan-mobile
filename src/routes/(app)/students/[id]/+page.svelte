<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { APP_NAME } from '$lib/config';
    import { resolve } from '$app/paths';

    let { data } = $props();
    let student = $derived(data.student);
    let enrollment = $derived(data.enrollment);

    // Format DOB for display
    let formattedDob = $derived(student.dob); 
    let isTransferred = $derived(student.transferDate !== null);
</script>

<svelte:head>
    <title>{student.name} | {APP_NAME}</title>
</svelte:head>

<div class="page-shell" in:fade={{ duration: 400 }}>
    
    <!-- Breadcrumb / Back Navigation -->
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
            <li>
                <a href={resolve('/students' as "/")} class="breadcrumb-link">
                    <svg class="breadcrumb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span class="breadcrumb-text">Back to Students</span>
                </a>
            </li>
        </ol>
    </nav>

    <!-- Profile Header Card -->
    <div class="profile-header-card" in:fly={{ y: 20, duration: 500, delay: 100 }}>
        <div class="profile-header-content">
            <!-- Profile Image Placeholder -->
            <div class="profile-image-container">
                <div class="profile-image-glow"></div>
                <div class="profile-image-wrapper">
                    <svg class="profile-icon" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                {#if isTransferred}
                    <span class="status-badge-icon transferred-badge" title="Transferred">
                        <span class="status-badge-dot"></span>
                    </span>
                {:else}
                    <span class="status-badge-icon active-badge" title="Active"></span>
                {/if}
            </div>

            <!-- Profile Primary Info -->
            <div class="profile-primary-info">
                <div class="profile-title-group">
                    <h1 class="profile-name">{student.name}</h1>
                    <span class="portal-id-badge">
                        Portal ID: {student.portalId}
                    </span>
                </div>
                <p class="profile-fname">{student.fname} <span class="fname-label">(Father's Name)</span></p>

                <div class="enrollment-info">
                    {#if enrollment}
                        <div class="enrollment-tag">
                            <span class="enrollment-label">Class:</span>
                            <span class="enrollment-value">{enrollment.className}</span>
                        </div>
                        <div class="enrollment-tag">
                            <span class="enrollment-label">Section:</span>
                            <span class="enrollment-value">{enrollment.sectionLetter}</span>
                        </div>
                        <div class="enrollment-tag">
                            <span class="enrollment-label">Roll No:</span>
                            <span class="enrollment-value">{enrollment.rollNo}</span>
                        </div>
                    {:else}
                        <div class="enrollment-tag empty-enrollment">
                            No current session enrollment
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Details Grid -->
    <div class="details-grid" in:fly={{ y: 20, duration: 500, delay: 200 }}>
        
        <!-- Personal Details -->
        <div class="details-card">
            <h2 class="card-title">
                <svg class="card-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Details
            </h2>
            <dl class="details-list">
                <div class="details-item">
                    <dt class="details-label">Date of Birth</dt>
                    <dd class="details-value">{formattedDob}</dd>
                </div>
                <div class="details-item">
                    <dt class="details-label">Caste</dt>
                    <dd class="details-value">{student.caste}</dd>
                </div>
                <div class="details-item">
                    <dt class="details-label">Guardian Contact</dt>
                    <dd class="details-value">{student.guardianNo}</dd>
                </div>
                <div class="details-item">
                    <dt class="details-label">Message Contact</dt>
                    <dd class="details-value">{student.messageNo}</dd>
                </div>
                <div class="details-item">
                    <dt class="details-label">PEN Number</dt>
                    <dd class="details-value">{student.penNo || 'N/A'}</dd>
                </div>
                <div class="details-item">
                    <dt class="details-label">Status</dt>
                    <dd class="details-value">
                        {#if isTransferred}
                            <span class="status-text transferred-text">Transferred on {student.transferDate}</span>
                        {:else}
                            <span class="status-text active-text">Active</span>
                        {/if}
                    </dd>
                </div>
            </dl>
        </div>

        <!-- Academic History Placeholder -->
        <div class="details-card flex-col-card">
            <h2 class="card-title">
                <svg class="card-title-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Academic Context
            </h2>
            
            <div class="placeholder-area">
                <svg class="placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="placeholder-text">
                    Academic performance and historical records will be displayed here in future updates.
                </p>
            </div>
        </div>

    </div>

</div>

<style>
	.page-shell {
		padding: 0 20px 32px;
		display: flex;
		flex-direction: column;
		gap: 24px;
        padding-top: 24px;
	}

    .breadcrumb-nav {
        margin-bottom: 8px;
    }

    .breadcrumb-list {
        display: flex;
        align-items: center;
        gap: 16px;
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .breadcrumb-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--color-on-surface-variant);
        text-decoration: none;
        transition: color 200ms ease;
    }

    .breadcrumb-link:hover {
        color: var(--color-on-surface);
    }

    .breadcrumb-icon {
        height: 20px;
        width: 20px;
        flex-shrink: 0;
    }

    .breadcrumb-text {
        font-size: 14px;
        font-weight: 500;
    }

    .profile-header-card {
        background-color: var(--color-surface-lowest);
		border-radius: var(--radius-2xl);
		padding: 32px;
		box-shadow: var(--shadow-ambient-md);
		border: 1px solid var(--color-outline-variant);
        overflow: hidden;
        position: relative;
    }

    .profile-header-content {
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32px;
    }

    @media (min-width: 768px) {
        .profile-header-content {
            flex-direction: row;
            align-items: flex-start;
        }
    }

    .profile-image-container {
        position: relative;
        flex-shrink: 0;
    }

    .profile-image-glow {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: linear-gradient(to top right, var(--color-primary), var(--color-secondary));
        filter: blur(8px);
        opacity: 0.5;
    }

    .profile-image-wrapper {
        position: relative;
        height: 128px;
        width: 128px;
        border-radius: 50%;
        border: 4px solid var(--color-surface);
        background-color: var(--color-surface-highest);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-shadow: var(--shadow-ambient-sm);
    }

    .profile-icon {
        height: 80px;
        width: 80px;
        color: var(--color-outline);
    }

    .status-badge-icon {
        position: absolute;
        bottom: 0;
        right: 0;
        display: flex;
        height: 24px;
        width: 24px;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        box-shadow: 0 0 0 2px var(--color-surface);
    }

    .transferred-badge {
        background-color: var(--color-error);
    }

    .active-badge {
        background-color: var(--color-status-success-text);
    }

    .status-badge-dot {
        height: 10px;
        width: 10px;
        border-radius: 50%;
        background-color: var(--color-surface);
    }

    .profile-primary-info {
        flex: 1;
        text-align: center;
    }

    @media (min-width: 768px) {
        .profile-primary-info {
            text-align: left;
        }
    }

    .profile-title-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-bottom: 8px;
    }

    @media (min-width: 768px) {
        .profile-title-group {
            flex-direction: row;
        }
    }

    .profile-name {
        font-family: var(--font-heading);
        font-size: 30px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--color-on-surface);
        margin: 0;
    }

    .portal-id-badge {
        display: inline-flex;
        align-items: center;
        border-radius: var(--radius-full);
        background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
        padding: 4px 12px;
        font-size: 12px;
        font-weight: 600;
        color: var(--color-primary);
        border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
    }

    .profile-fname {
        font-size: 18px;
        color: var(--color-on-surface-variant);
        margin-top: 0;
        margin-bottom: 16px;
    }

    .fname-label {
        font-size: 14px;
        color: var(--color-outline);
    }

    .enrollment-info {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
    }

    @media (min-width: 768px) {
        .enrollment-info {
            justify-content: flex-start;
        }
    }

    .enrollment-tag {
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: var(--radius-lg);
        background-color: var(--color-surface);
        padding: 8px 16px;
        border: 1px solid var(--color-outline-variant);
    }

    .enrollment-label {
        font-size: 14px;
        color: var(--color-on-surface-variant);
    }

    .enrollment-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-on-surface);
    }

    .empty-enrollment {
        background-color: color-mix(in srgb, var(--color-secondary) 10%, transparent);
        border-color: color-mix(in srgb, var(--color-secondary) 20%, transparent);
        color: var(--color-secondary);
        font-size: 14px;
    }

    .details-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 32px;
    }

    @media (min-width: 768px) {
        .details-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .details-card {
        background-color: var(--color-surface-lowest);
		border-radius: var(--radius-2xl);
		padding: 24px;
		border: 1px solid var(--color-outline-variant);
        height: 100%;
    }

    .flex-col-card {
        display: flex;
        flex-direction: column;
    }

    .card-title {
        font-family: var(--font-heading);
        font-size: 20px;
        font-weight: 600;
        color: var(--color-on-surface);
        margin-top: 0;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .card-title-icon {
        height: 20px;
        width: 20px;
        color: var(--color-primary);
    }

    .details-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px 16px;
        margin: 0;
    }

    @media (min-width: 640px) {
        .details-list {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .details-item {
        display: flex;
        flex-direction: column;
    }

    .details-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-on-surface-variant);
    }

    .details-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-on-surface);
        margin: 4px 0 0 0;
    }

    .status-text {
        font-weight: 500;
    }

    .transferred-text {
        color: var(--color-error);
    }

    .active-text {
        color: var(--color-status-success-text);
    }

    .placeholder-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 192px;
        border-radius: var(--radius-xl);
        border: 1px dashed var(--color-outline);
        background-color: var(--color-surface);
        padding: 24px;
        text-align: center;
    }

    .placeholder-icon {
        height: 40px;
        width: 40px;
        color: var(--color-outline);
        margin-bottom: 12px;
    }

    .placeholder-text {
        font-size: 14px;
        color: var(--color-on-surface-variant);
        margin: 0;
    }
</style>
