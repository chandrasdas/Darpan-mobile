import { error, redirect } from '@sveltejs/kit';
import type { ROLES } from '$lib/server/db/schema';

type Role = (typeof ROLES)[number];

/**
 * Ensures the user is authenticated.
 * Redirects to /login if not.
 * Returns the typed user (never undefined).
 */
export function requireAuth(locals: App.Locals) {
	if (!locals.user || !locals.session) {
		redirect(302, '/login');
	}
	return locals.user;
}

/**
 * Ensures the user has one of the specified roles.
 * Throws 403 if the user's role is not in the allowed list.
 * Returns the typed user (never undefined).
 */
export function requireRole(locals: App.Locals, ...roles: Role[]) {
	const user = requireAuth(locals);
	if (!roles.includes(user.role as Role)) {
		error(403, 'You do not have permission to perform this action');
	}
	return user;
}

import { getRequestEvent } from '$app/server';

/**
 * Helper to retrieve event.locals inside remote queries using AsyncLocalStorage.
 */
export function getLocals(): App.Locals {
	const event = getRequestEvent();
	if (!event) {
		error(500, 'auth-utils: getLocals called outside request context');
	}
	return event.locals;
}

/**
 * Ensures the remote function caller is authenticated.
 */
export function requireAuthRemote() {
	return requireAuth(getLocals());
}

/**
 * Ensures the remote function caller has one of the specified roles.
 */
export function requireRoleRemote(...roles: Role[]) {
	return requireRole(getLocals(), ...roles);
}
