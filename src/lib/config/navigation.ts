export type NavSubItem = { label: string; href: string };
export type NavItem = { label: string; href?: string; icon: string; subItems?: NavSubItem[] };

export const navItems: NavItem[] = [
	{ label: 'Dashboard', href: '/dashboard', icon: 'home' },
	{ 
		label: 'Students', 
		icon: 'person',
		subItems: [
			{ label: 'Student List', href: '/students' },
			{ label: 'Student Details', href: '#' },
			{ label: 'Attendance', href: '#' },
			{ label: 'Promotion', href: '#' }
		]
	},
	{ 
		label: 'Faculties', 
		icon: 'groups',
		subItems: [
			{ label: 'Faculty List', href: '/staff' },
			{ label: 'Leave Management', href: '#' }
		]
	},
	{ 
		label: 'Examinations', 
		icon: 'assessment',
		subItems: [
			{ label: 'Exam Setup', href: '#' },
			{ label: 'Marks Entry', href: '#' }
		]
	},
	{ 
		label: 'Reports & Marksheets', 
		icon: 'reports',
		subItems: [
			{ label: 'Generate Marksheets', href: '/reports' },
			{ label: 'Student Report Cards', href: '#' },
			{ label: 'Class Result Analysis', href: '#' }
		]
	},
	{ 
		label: 'Finance', 
		icon: 'receipt_long',
		subItems: [
			{ label: 'Fee Collection', href: '/fees' },
			{ label: 'Invoices & Receipts', href: '#' },
			{ label: 'Expenses', href: '#' }
		]
	},
	{ 
		label: 'Administration', 
		icon: 'settings',
		subItems: [
			{ label: 'Settings', href: '#' },
			{ label: 'Roles & Permissions', href: '#' },
			{ label: 'Academic Years', href: '#' }
		]
	}
];

export const mobileNavItems = [
	{ label: 'Home', href: '/dashboard', icon: 'home' },
	{ label: 'Students', href: '/students', icon: 'person' },
	{ label: 'Staff', href: '/staff', icon: 'groups' },
	{ label: 'Fees', href: '/fees', icon: 'receipt_long' }
];

export function isActive(href: string, currentPath: string): boolean {
	if (href === '#') return false;
	if (href === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
	return currentPath === href || currentPath.startsWith(href + '/');
}
