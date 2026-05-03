/**
 * Shared application-level user type.
 * Mirrors the better-auth user shape + our custom `role` additional field.
 */
export type AppUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
	image?: string | null;
	role?: string | null;
};
