export type NavSubItem = { label: string; href: string; adminOnly?: boolean };
export type NavItem = { label: string; href?: string; icon: string; subItems?: NavSubItem[]; adminOnly?: boolean };

export const navItems: NavItem[] = [
	{ label: 'Dashboard', href: '/dashboard', icon: 'home' },
	{ 
		label: 'Students', 
		icon: 'person',
		subItems: [
			{ label: 'Student List', href: '/students' },
			{ label: 'Add Student', href: '/students/add' },
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
			{ label: 'Add Staff', href: '/staff-entry' },
			{ label: 'Allowed Staff', href: '/admin/allowed-staff', adminOnly: true },
			{ label: 'Leave Management', href: '#' }
		]
	},
	{ 
		label: 'Examinations', 
		icon: 'assessment',
		subItems: [
			{ label: 'Exam Setup', href: '/admin/exam-setup' },
			{ label: 'Marks Entry', href: '/admin/marks-entry' }
		]
	},
	{ 
		label: 'Reports & Marksheets', 
		icon: 'reports',
		subItems: [
			{ label: 'Tabulation Sheet', href: '/admin/tabulation-sheet' },
			{ label: 'Generate Report', href: '/reports/generate' },
			{ label: 'Marksheet', href: '/admin/marksheet' },
			{ label: 'Class Result Analysis', href: '#' }
		]
	},
	{ 
		label: 'Finance', 
		icon: 'receipt_long',
		subItems: [
			{ label: 'Fee Collection', href: '/fees' },
			{ label: 'Fee Record', href: '/fees/record' },
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
