import type { AppUser } from '$lib/types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: AppUser;
			session?: {
				id: string;
				userId: string;
				expiresAt: Date;
				token: string;
				createdAt: Date;
				updatedAt: Date;
				ipAddress?: string | null;
				userAgent?: string | null;
			};
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
