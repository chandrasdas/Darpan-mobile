export type UserRole = 'admin' | 'teacher' | 'staff';

// Whitelisted routes under /admin for other roles.
// Any route under /admin NOT in this list is strictly admin-only.
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
	'/admin/marks-entry': ['admin', 'teacher'],
	'/admin/attendance-entry': ['admin', 'teacher']
};

/**
 * Checks if a user role is authorized to access a given pathname.
 * Performs a prefix-aware search (e.g. /admin/marks-entry/edit fits /admin/marks-entry).
 */
export function isAuthorized(role: UserRole | undefined | null, pathname: string): boolean {
	if (!role) return false;
	if (role === 'admin') return true; // Admins bypass all routing checks

	// Normalize trailing slashes
	const cleanPath =
		pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

	// Check if path is under the /admin tree
	if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
		// Look for an explicit permission mapping
		const matchedKey = Object.keys(ROUTE_PERMISSIONS).find(
			(key) => cleanPath === key || cleanPath.startsWith(key + '/')
		);

		if (matchedKey) {
			return ROUTE_PERMISSIONS[matchedKey].includes(role);
		}

		// Fail-secure: default to false for any unmapped route under /admin
		return false;
	}

	// Routes outside /admin are accessible to all authenticated roles
	return true;
}
