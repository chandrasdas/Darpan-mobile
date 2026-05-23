<script lang="ts">
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const student = $derived(data.student);
	const enrollment = $derived(data.enrollment);

	// Reactive editable fields for address, session, conduct, and date of issue
	let village = $state('Kshempur');
	let postOffice = $state('Chorolmoni');
	let district = $state('Malda');
	// svelte-ignore state_referenced_locally
	let sessionYear = $state(enrollment?.sessionYear?.toString() || '2026');
	let conduct = $state('satisfactory');
	let character = $state('good');
	let dateOfIssue = $state(new Date().toISOString().split('T')[0]);

	// Helpers
	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			// YYYY-MM-DD -> DD.MM.YYYY
			return `${parts[2]}.${parts[1]}.${parts[0]}`;
		}
		return dateStr;
	}

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Bonafide Certificate | {student.name}</title>
</svelte:head>

<div class="page-container" in:fade={{ duration: 400 }}>
	<!-- Action/Config Area (Hidden during print) -->
	<div class="config-panel no-print">
		<div class="panel-header">
			<a href={resolve('/students' as '/')} class="back-link">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
				</svg>
				<span>Back to Registry</span>
			</a>
			<button onclick={handlePrint} class="print-btn">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="6 9 6 2 18 2 18 9" /><path
						d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
					/><rect x="6" y="14" width="12" height="8" />
				</svg>
				<span>Print Certificate</span>
			</button>
		</div>

		<div class="panel-body">
			<h2 class="panel-title">Certificate Customization</h2>
			<p class="panel-subtitle">
				Fill in the fields below to update the certificate content in real time.
			</p>

			<div class="input-grid">
				<div class="input-group">
					<label for="village">Village / Locality</label>
					<input
						type="text"
						id="village"
						bind:value={village}
						placeholder="e.g. Kshempur"
						class="form-input"
					/>
				</div>

				<div class="input-group">
					<label for="postOffice">Post Office (P.O.)</label>
					<input
						type="text"
						id="postOffice"
						bind:value={postOffice}
						placeholder="e.g. Chorolmoni"
						class="form-input"
					/>
				</div>

				<div class="input-group">
					<label for="district">District</label>
					<input
						type="text"
						id="district"
						bind:value={district}
						placeholder="e.g. Malda"
						class="form-input"
					/>
				</div>

				<div class="input-group">
					<label for="sessionYear">Academic Session</label>
					<input
						type="text"
						id="sessionYear"
						bind:value={sessionYear}
						placeholder="e.g. 2026"
						class="form-input"
					/>
				</div>

				<div class="input-group">
					<label for="conduct">Student Conduct</label>
					<select id="conduct" bind:value={conduct} class="form-select">
						<option value="satisfactory">Satisfactory</option>
						<option value="good">Good</option>
						<option value="very good">Very Good</option>
						<option value="excellent">Excellent</option>
						<option value="outstanding">Outstanding</option>
					</select>
				</div>

				<div class="input-group">
					<label for="character">Moral Character</label>
					<select id="character" bind:value={character} class="form-select">
						<option value="good">Good</option>
						<option value="excellent">Excellent</option>
						<option value="exemplary">Exemplary</option>
					</select>
				</div>

				<div class="input-group full-width">
					<label for="dateOfIssue">Date of Issue</label>
					<input type="date" id="dateOfIssue" bind:value={dateOfIssue} class="form-input" />
				</div>
			</div>
		</div>
	</div>

	<!-- Printable Certificate Wrapper -->
	<div class="certificate-wrapper relative">
		<!-- Watermark (Rotated and faded in background) -->
		<div
			class="watermark-container pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
		>
			<img
				src={resolve('/emblem.jpg' as '/')}
				alt="Watermark"
				class="watermark-img opacity-5 select-none"
			/>
		</div>

		<!-- Certificate Content -->
		<div class="certificate-content relative z-10">
			<!-- Header -->
			<div class="certificate-header">
				<div class="header-main-flex">
					<img src={resolve('/emblem.jpg' as '/')} alt="RKM Logo" class="school-logo-img" />
					<div class="vertical-separator"></div>
					<div class="school-info-details">
						<h1 class="school-name">RAMAKRISHNA MISSION VIVEKANANDA VIDYAMANDIR</h1>
						<p class="school-address">PO & DT : MALDA &bull; PIN : 732 101 &bull; WEST BENGAL</p>
						<p class="school-phone">Phone No. : 03512 - 252850</p>
						<p class="school-web-email">
							website : www.rkmvvmmalda.org &bull; e-mail : rkmvvmmalda@gmail.com
						</p>
						<p class="school-index">
							School Index No. : Secondary : R1-091 &bull; Higher Secondary : 111082
						</p>
					</div>
				</div>
				<div class="title-badge-wrapper">
					<span class="title-badge">BONAFIDE CERTIFICATE</span>
				</div>
			</div>

			<!-- Certificate Number / Date -->
			<div
				class="certificate-meta mt-6 flex justify-between border-b border-dotted border-slate-400 pb-2"
			>
				<div class="meta-item">
					<span class="meta-label">Certificate No:</span>
					<span class="meta-value font-bold text-slate-800">BC/{sessionYear}/{student.sid}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Date:</span>
					<span class="meta-value font-bold text-slate-800">{formatDate(dateOfIssue)}</span>
				</div>
			</div>

			<!-- Main Body Text -->
			<div class="certificate-body mt-10">
				<div class="body-title">TO WHOM IT MAY CONCERN</div>

				<p class="body-text">
					This is to certify that <span class="highlight">{student.name}</span>, S/o
					<span class="highlight">{student.fname}</span>, resident of Vill –
					<span class="highlight">{village || '________'}</span>, P.O. –
					<span class="highlight">{postOffice || '________'}</span>, Dist. –
					<span class="highlight">{district || '________'}</span>, is a bonafide student of Class –
					<span class="highlight">{enrollment?.className || '________'}</span>, Sec. –
					<span class="highlight">{enrollment?.sectionLetter || '________'}</span>, Roll No. –
					<span class="highlight">{enrollment?.rollNo || '________'}</span>
					of this institution for the academic session <span class="highlight">{sessionYear}</span>.
					His date of birth, as recorded in the admission register of the school, is
					<span class="highlight">{formatDate(student.dob)}</span>. His Banglar Shiksha Portal ID is
					<span class="highlight">{student.portalId}</span>.
				</p>

				<p class="body-text mt-6">
					During his time at the school, his conduct has always been
					<span class="highlight">{conduct}</span>. To the best of my knowledge, he bears a
					<span class="highlight">{character}</span> moral character.
				</p>

				<p class="body-text mt-6">I wish him every success in life.</p>
			</div>

			<!-- Footer signatures -->
			<div class="certificate-footer mt-24 flex items-end justify-between pt-8">
				<div class="signature-line flex flex-col items-center">
					<div class="sig-space"></div>
					<span class="sig-label">Prepared By (Office Assistant)</span>
				</div>
				<div class="signature-line flex flex-col items-center">
					<div class="sig-space"></div>
					<span class="sig-label font-bold">Headmaster / Principal</span>
					<span class="sig-sublabel">(with Official Seal)</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 24px;
		align-items: center;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	@media (min-width: 1024px) {
		.page-container {
			flex-direction: row;
			align-items: flex-start;
		}
	}

	/* Config Panel Styles */
	.config-panel {
		width: 100%;
		background-color: var(--color-surface-lowest);
		padding: 20px;
		border-radius: var(--radius-2xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
	}

	@media (min-width: 1024px) {
		.config-panel {
			width: 360px;
			position: sticky;
			top: 24px;
			flex-shrink: 0;
		}
	}

	.panel-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
		border-bottom: 1px solid var(--color-outline-variant);
		padding-bottom: 16px;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		font-weight: 500;
		color: var(--color-on-surface-variant);
		font-size: 14px;
		min-height: 44px;
	}

	.back-link:hover {
		color: var(--color-primary);
	}

	.print-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		padding: 10px 18px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
		transition: opacity 150ms ease;
		width: 100%;
	}

	.print-btn:hover {
		opacity: 0.9;
	}

	.panel-title {
		font-family: var(--font-heading);
		font-size: 18px;
		font-weight: 600;
		color: var(--color-on-surface);
		margin: 0 0 4px 0;
	}

	.panel-subtitle {
		font-size: 13px;
		color: var(--color-on-surface-variant);
		margin: 0 0 16px 0;
		line-height: 1.4;
	}

	.input-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
	}

	@media (min-width: 640px) and (max-width: 1023px) {
		.input-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.input-group.full-width {
		grid-column: 1 / -1;
	}

	.input-group label {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-on-surface-variant);
	}

	.form-input,
	.form-select {
		border-radius: var(--radius-md);
		border: 1px solid var(--color-outline);
		background-color: var(--color-surface);
		padding: 10px 12px;
		font-size: 14px;
		color: var(--color-on-surface);
		transition: all 200ms ease;
		min-height: 44px;
		width: 100%;
	}

	.form-input:focus,
	.form-select:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	/* Certificate layout */
	.certificate-wrapper {
		width: 100%;
		max-width: 800px;
		background-color: white;
		border: 6px double #1e3a8a;
		padding: 48px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		font-family: Georgia, 'Times New Roman', serif;
		color: #1e293b;
		flex-grow: 1;
	}

	.watermark-container {
		z-index: 1;
	}

	.watermark-img {
		width: 300px;
		height: 300px;
		object-fit: contain;
		opacity: 0.04;
		transform: rotate(-15deg);
	}

	/* Header styles */
	.certificate-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		border-bottom: 2px solid #1e3a8a;
		padding-bottom: 16px;
	}

	.header-main-flex {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 24px;
		width: 100%;
	}

	.school-logo-img {
		width: 75px;
		height: 85px;
		object-fit: contain;
	}

	.vertical-separator {
		width: 2px;
		height: 85px;
		background-color: #1e3a8a;
	}

	.school-info-details {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		gap: 2px;
	}

	.school-name {
		font-size: 15px;
		font-weight: 800;
		color: #1e3a8a;
		letter-spacing: 0.01em;
		margin: 0;
		line-height: 1.2;
	}

	@media (min-width: 640px) {
		.school-name {
			font-size: 19px;
		}
	}

	.school-address {
		font-size: 10px;
		margin: 0;
		font-weight: 600;
		color: #1e293b;
	}

	@media (min-width: 640px) {
		.school-address {
			font-size: 11.5px;
		}
	}

	.school-phone,
	.school-web-email,
	.school-index {
		font-size: 9.5px;
		margin: 0;
		color: #475569;
		line-height: 1.3;
	}

	@media (min-width: 640px) {
		.school-phone,
		.school-web-email,
		.school-index {
			font-size: 10.5px;
		}
	}

	.title-badge-wrapper {
		margin-top: 12px;
	}

	.title-badge {
		font-family: sans-serif;
		font-size: 15px;
		font-weight: bold;
		letter-spacing: 0.1em;
		background-color: #0f172a;
		color: white;
		padding: 4px 18px;
		border-radius: var(--radius-sm);
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}

	/* Metadata row (BC No, Date) */
	.certificate-meta {
		font-size: 14px;
	}

	.meta-label {
		font-weight: 600;
		color: #475569;
	}

	.meta-value {
		margin-left: 4px;
	}

	/* Body Text styles */
	.body-title {
		text-align: center;
		font-weight: bold;
		font-size: 16px;
		letter-spacing: 0.05em;
		margin-bottom: 24px;
		text-decoration: underline;
		color: #0f172a;
	}

	.body-text {
		font-size: 15px;
		line-height: 1.8;
		text-align: justify;
		text-justify: inter-word;
		margin: 0;
		color: #334155;
	}

	.highlight {
		font-weight: bold;
		color: #0f172a;
		border-bottom: 1px dotted #94a3b8;
		padding: 0 4px;
	}

	/* Signatures */
	.sig-space {
		height: 60px;
	}

	.sig-label {
		font-size: 13px;
		color: #334155;
		border-top: 1px solid #cbd5e1;
		padding-top: 6px;
		min-width: 180px;
		text-align: center;
	}

	.sig-sublabel {
		font-size: 11px;
		color: #64748b;
		margin-top: 2px;
	}

	/* PRINT CSS */
	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
		}

		.page-container {
			padding: 0;
			background-color: white;
			display: block;
		}

		.no-print {
			display: none !important;
		}

		.certificate-wrapper {
			box-shadow: none !important;
			border: 4px double #000000 !important;
			margin: 0 !important;
			max-width: 100% !important;
			padding: 20px !important;
		}

		.school-name {
			color: #000000 !important;
		}

		.vertical-separator {
			background-color: #000000 !important;
		}

		.title-badge {
			background-color: #000000 !important;
			color: #ffffff !important;
			border: 1px solid #000000 !important;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		.highlight {
			color: #000000 !important;
			border-bottom-color: #000000 !important;
		}

		.watermark-img {
			opacity: 0.04 !important;
		}

		@page {
			size: A4 portrait;
			margin: 15mm;
		}
	}
</style>
