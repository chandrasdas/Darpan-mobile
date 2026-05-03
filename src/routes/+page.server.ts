import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Already logged in → go straight to dashboard
	if (locals.session) {
		redirect(302, '/dashboard');
	}
	// Not logged in → go to login
	redirect(302, '/login');
};
