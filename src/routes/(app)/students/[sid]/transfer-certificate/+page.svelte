<script lang="ts">
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const student = $derived(data.student);
	const enrollment = $derived(data.enrollment);

	// Helper to format date in a readable text format (e.g. "April 12, 2026")
	function formatDateReadable(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		const parts = dateStr.split('-');
		if (parts.length !== 3) return dateStr;
		const year = parseInt(parts[0]);
		const month = parseInt(parts[1]) - 1;
		const day = parseInt(parts[2]);
		const dateObj = new Date(year, month, day);
		return dateObj.toLocaleDateString('en-IN', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	// Helper to convert date to formal words (for Indian Transfer Certificate format)
	function dateToWords(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		const parts = dateStr.split('-');
		if (parts.length !== 3) return dateStr;
		const year = parseInt(parts[0]);
		const month = parseInt(parts[1]) - 1; // 0-indexed
		const day = parseInt(parts[2]);
		
		const months = [
			"JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
			"JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
		];
		
		const ones = ["", "FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH", "NINTH", "TENTH",
					  "ELEVENTH", "TWELFTH", "THIRTEENTH", "FOURTEENTH", "FIFTEENTH", "SIXTEENTH", "SEVENTEENTH", "EIGHTEENTH", "NINETEENTH"];
		const tens = ["", "", "TWENTY", "THIRTY"];
		
		let dayWord = '';
		if (day < 20) {
			dayWord = ones[day];
		} else {
			const rem = day % 10;
			dayWord = tens[Math.floor(day / 10)] + (rem > 0 ? "-" + ones[rem] : "");
		}
		if (day === 20) dayWord = "TWENTIETH";
		if (day === 30) dayWord = "THIRTIETH";
		if (day === 31) dayWord = "THIRTY-FIRST";
		if (day === 21) dayWord = "TWENTY-FIRST";
		if (day === 22) dayWord = "TWENTY-SECOND";
		if (day === 23) dayWord = "TWENTY-THIRD";
		if (day === 24) dayWord = "TWENTY-FOURTH";
		if (day === 25) dayWord = "TWENTY-FIFTH";
		if (day === 26) dayWord = "TWENTY-SIXTH";
		if (day === 27) dayWord = "TWENTY-SEVENTH";
		if (day === 28) dayWord = "TWENTY-EIGHTH";
		if (day === 29) dayWord = "TWENTY-NINTH";

		const monthWord = months[month] || '';
		
		function numberToWords(num: number): string {
			const onesArr = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
							 "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
			const tensArr = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
			
			if (num === 2000) return "TWO THOUSAND";
			if (num >= 2000 && num < 2100) {
				const offset = num - 2000;
				if (offset < 20) return "TWO THOUSAND AND " + onesArr[offset];
				return "TWO THOUSAND AND " + tensArr[Math.floor(offset / 10)] + (offset % 10 > 0 ? " " + onesArr[offset % 10] : "");
			}
			if (num >= 1900 && num < 2000) {
				const secondPart = num - 1900;
				let secWord = '';
				if (secondPart < 20) secWord = onesArr[secondPart];
				else secWord = tensArr[Math.floor(secondPart / 10)] + (secondPart % 10 > 0 ? "-" + onesArr[secondPart % 10] : "");
				return "NINETEEN HUNDRED " + secWord;
			}
			return num.toString();
		}
		
		return `${dayWord} DAY OF ${monthWord} ${numberToWords(year)}`;
	}

	function handlePrint() {
		window.print();
	}
</script>

<div class="print-page-shell" in:fade={{ duration: 400 }}>
	<!-- Action Bar (Hidden during print) -->
	<div class="action-bar no-print">
		<a href={resolve('/students/transferred' as "/")} class="back-link">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
			<span>Back to Registry</span>
		</a>
		<button onclick={handlePrint} class="print-btn">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
			<span>Print Certificate</span>
		</button>
	</div>

	<!-- Printable Certificate Wrapper -->
	<div class="certificate-wrapper relative">
		<!-- Watermark (Rotated and faded in background) -->
		<div class="watermark-container absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
			<img src={resolve('/emblem.jpg' as "/")} alt="Watermark" class="watermark-img opacity-5 select-none" />
		</div>

		<!-- Certificate Content -->
		<div class="certificate-content relative z-10">
			<!-- Header -->
			<div class="certificate-header">
				<div class="header-main-flex">
					<img src={resolve('/emblem.jpg' as "/")} alt="RKM Logo" class="school-logo-img" />
					<div class="vertical-separator"></div>
					<div class="school-info-details">
						<h1 class="school-name">RAMAKRISHNA MISSION VIVEKANANDA VIDYAMANDIR</h1>
						<p class="school-address">PO & DT : MALDA &bull; PIN : 732 101 &bull; WEST BENGAL</p>
						<p class="school-phone">Phone No. : 03512 - 252850</p>
						<p class="school-web-email">website : www.rkmvvmmalda.org &bull; e-mail : rkmvvmmalda@gmail.com</p>
						<p class="school-index">School Index No. : Secondary : R1-091 &bull; Higher Secondary : 111082</p>
					</div>
				</div>
				<div class="title-badge-wrapper">
					<span class="title-badge">TRANSFER CERTIFICATE</span>
				</div>
			</div>

			<!-- Metadata row (TC No, Admission No) -->
			<div class="certificate-meta flex justify-between border-b border-dotted border-slate-400 pb-2 mt-6">
				<div class="meta-item">
					<span class="meta-label font-semibold">T.C. Serial No:</span>
					<span class="meta-value font-bold text-slate-800">TC/2026/{student.sid}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label font-semibold">Admission/Portal ID:</span>
					<span class="meta-value font-bold text-slate-800">{student.portalId}</span>
				</div>
			</div>

			<!-- Main Certificate Fields -->
			<div class="certificate-fields mt-6 flex flex-col gap-4">
				<div class="field-row">
					<span class="field-number">1.</span>
					<span class="field-label">Name of Pupil:</span>
					<span class="field-value font-bold">{student.name}</span>
				</div>

				<div class="field-row">
					<span class="field-number">2.</span>
					<span class="field-label">Father's / Guardian's Name:</span>
					<span class="field-value">{student.fname}</span>
				</div>

				<div class="field-row">
					<span class="field-number">3.</span>
					<span class="field-label">Nationality:</span>
					<span class="field-value">Indian</span>
				</div>

				<div class="field-row flex justify-between gap-4">
					<div class="field-row flex-1">
						<span class="field-number">4.</span>
						<span class="field-label">Caste (SC/ST/OBC/GEN):</span>
						<span class="field-value">{student.caste || 'General'}</span>
					</div>
					<div class="field-row flex-1">
						<span class="field-number">5.</span>
						<span class="field-label">PEN Number:</span>
						<span class="field-value font-mono font-bold text-xs">{student.penNo || 'N/A'}</span>
					</div>
				</div>

				<div class="field-row">
					<span class="field-number">6.</span>
					<span class="field-label">Date of first admission in the School:</span>
					<span class="field-value">
						{student.createdAt ? formatDateReadable(new Date(student.createdAt).toISOString().split('T')[0]) : 'N/A'}
					</span>
				</div>

				<div class="field-row">
					<span class="field-number">7.</span>
					<span class="field-label">Date of Birth (in figures):</span>
					<span class="field-value font-semibold">{student.dob}</span>
				</div>
				<div class="field-row leading-lines-words pl-6">
					<span class="field-label">(in words):</span>
					<span class="field-value text-xs font-semibold">{dateToWords(student.dob)}</span>
				</div>

				<div class="field-row flex justify-between gap-4">
					<div class="field-row flex-1">
						<span class="field-number">8.</span>
						<span class="field-label">Class in which pupil last studied:</span>
						<span class="field-value font-bold">Class {enrollment?.className || '-'}</span>
					</div>
					<div class="field-row flex-1">
						<span class="field-number">9.</span>
						<span class="field-label">Roll Number:</span>
						<span class="field-value font-bold">{enrollment?.rollNo || '-'}</span>
					</div>
				</div>

				<div class="field-row">
					<span class="field-number">10.</span>
					<span class="field-label">School / Board Annual Examination last taken with result:</span>
					<span class="field-value">Annual Examination {enrollment?.sessionYear || '2026'}</span>
				</div>

				<div class="field-row flex justify-between gap-4">
					<div class="field-row flex-1">
						<span class="field-number">11.</span>
						<span class="field-label">Whether qualified for promotion to higher class:</span>
						<span class="field-value">Yes / Refer to Marksheet</span>
					</div>
				</div>

				<div class="field-row flex justify-between gap-4">
					<div class="field-row flex-1">
						<span class="field-number">12.</span>
						<span class="field-label">Dues paid up to:</span>
						<span class="field-value font-semibold">Paid (Transfer Date: {student.transferDate})</span>
					</div>
				</div>

				<div class="field-row flex justify-between gap-4">
					<div class="field-row flex-1">
						<span class="field-number">13.</span>
						<span class="field-label">Date of application for Certificate:</span>
						<span class="field-value">{student.transferDate ? formatDateReadable(student.transferDate) : 'N/A'}</span>
					</div>
					<div class="field-row flex-1">
						<span class="field-number">14.</span>
						<span class="field-label">Date of issue of Certificate:</span>
						<span class="field-value font-semibold">{student.transferDate ? formatDateReadable(student.transferDate) : 'N/A'}</span>
					</div>
				</div>

				<div class="field-row">
					<span class="field-number">15.</span>
					<span class="field-label">Reason for leaving the School:</span>
					<span class="field-value font-semibold">On Parent's Request</span>
				</div>

				<div class="field-row">
					<span class="field-number">16.</span>
					<span class="field-label">General Conduct / Character:</span>
					<span class="field-value font-bold">Good</span>
				</div>
			</div>

			<!-- Footer signatures -->
			<div class="certificate-footer flex justify-between items-end mt-20 pt-8 border-t border-slate-200">
				<div class="signature-line flex flex-col items-center">
					<div class="sig-space"></div>
					<span class="sig-label">Signature of Class Teacher</span>
				</div>
				<div class="signature-line flex flex-col items-center">
					<div class="sig-space"></div>
					<span class="sig-label">Checked By (Office Assistant)</span>
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
	.print-page-shell {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 24px;
		background-color: var(--color-surface);
		align-items: center;
	}

	.action-bar {
		display: flex;
		justify-content: space-between;
		width: 100%;
		max-width: 800px;
		background-color: var(--color-surface-lowest);
		padding: 12px 20px;
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-outline-variant);
		box-shadow: var(--shadow-ambient-md);
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
	}

	.print-btn:hover {
		opacity: 0.9;
	}

	/* Certificate layout */
	.certificate-wrapper {
		width: 100%;
		max-width: 800px;
		background-color: white;
		border: 6px double #1e3a8a;
		padding: 40px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		font-family: Georgia, 'Times New Roman', serif;
		color: #1e293b;
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

	.school-phone, .school-web-email, .school-index {
		font-size: 9.5px;
		margin: 0;
		color: #475569;
		line-height: 1.3;
	}

	@media (min-width: 640px) {
		.school-phone, .school-web-email, .school-index {
			font-size: 10.5px;
		}
	}

	.title-badge-wrapper {
		margin-top: 12px;
	}

	.title-badge {
		font-family: var(--font-heading);
		font-size: 16px;
		font-weight: bold;
		letter-spacing: 0.1em;
		background-color: #1e3a8a;
		color: white;
		padding: 4px 18px;
		border-radius: var(--radius-sm);
	}

	/* Fields rendering */
	.field-row {
		display: flex;
		align-items: flex-end;
		width: 100%;
		font-size: 14px;
		line-height: 1.6;
	}

	.field-number {
		width: 24px;
		flex-shrink: 0;
		font-weight: bold;
	}

	.field-label {
		flex-shrink: 0;
		padding-right: 8px;
	}

	.field-value {
		flex-grow: 1;
		border-bottom: 1px dotted #64748b;
		padding-left: 8px;
		padding-bottom: 2px;
		color: #0f172a;
	}

	.leading-lines-words {
		width: 100%;
	}

	/* Signatures */
	.sig-space {
		height: 50px;
	}

	.sig-label {
		font-size: 12px;
		color: #334155;
	}

	.sig-sublabel {
		font-size: 10px;
		color: #64748b;
	}

	/* PRINT CSS */
	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
		}

		.print-page-shell {
			padding: 0;
			background-color: white;
		}

		.no-print {
			display: none !important;
		}

		.certificate-wrapper {
			box-shadow: none !important;
			border: 4px double #000 !important;
			margin: 0 !important;
			max-width: 100% !important;
			padding: 10px !important;
		}

		.watermark-img {
			opacity: 0.04 !important;
		}

		@page {
			size: A4 portrait;
			margin: 10mm;
		}
	}
</style>
