export type UserRole = 'admin' | 'teacher' | 'staff';

// Explicit role access mappings.
// If a route/prefix is defined here, only users with those roles can access it.
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
	'/exams/marks-entry': ['admin', 'teacher'],
	'/attendance/entry': ['admin', 'teacher'],
	'/staff/entry': ['admin', 'teacher', 'staff']
};

// Admin-only routes/prefixes.
// If a route/prefix starts with any of these, it is strictly admin-only unless mapped in ROUTE_PERMISSIONS.
const ADMIN_ONLY_PREFIXES = [
	'/exams/setup',
	'/exams/import',
	'/exams/tabulation',
	'/exams/marksheet',
	'/exams/reports',
	'/attendance/setup',
	'/staff/allowed'
];

/**
 * Checks if a user role is authorized to access a given pathname.
 * Performs a prefix-aware search (e.g. /exams/marks-entry/edit fits /exams/marks-entry).
 */
export function isAuthorized(role: UserRole | undefined | null, pathname: string): boolean {
	if (!role) return false;
	if (role === 'admin') return true; // Admins bypass all routing checks

	// Normalize trailing slashes
	const cleanPath =
		pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

	// 1. Look for an explicit permission mapping first
	const matchedKey = Object.keys(ROUTE_PERMISSIONS).find(
		(key) => cleanPath === key || cleanPath.startsWith(key + '/')
	);

	if (matchedKey) {
		return ROUTE_PERMISSIONS[matchedKey].includes(role);
	}

	// 2. Check if it is an admin-only area
	const isAdminOnly = ADMIN_ONLY_PREFIXES.some(
		(prefix) => cleanPath === prefix || cleanPath.startsWith(prefix + '/')
	);

	if (isAdminOnly) {
		return false; // Fail-secure for non-admin users
	}

	// 3. All other authenticated pages are accessible by default
	return true;
}
