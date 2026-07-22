import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { isAuthorized, type UserRole } from '$lib/config/permissions';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const pathname = event.url.pathname;

	// Define public paths that bypass auth & role checks
	const publicPaths = [
		'/login',
		'/register',
		'/forgot-password',
		'/demo',
		'/api/auth',
		'/api/register',
		'/api/forgot-password'
	];
	const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

	if (!isPublic) {
		if (!event.locals.user) {
			if (
				pathname.includes('/api/') ||
				event.request.headers.get('accept') === 'application/json'
			) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			throw redirect(302, '/login');
		}

		const role = event.locals.user.role as UserRole;
		if (!isAuthorized(role, pathname)) {
			if (
				pathname.includes('/api/') ||
				event.request.headers.get('accept') === 'application/json'
			) {
				return new Response(JSON.stringify({ error: 'Forbidden' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			throw redirect(303, '/dashboard');
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
