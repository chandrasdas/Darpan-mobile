import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		watch: {
			ignored: ['**/sqlite.db', '**/sqlite.db-journal', '**/sqlite.db-shm', '**/sqlite.db-wal']
		}
	},
	ssr: {
		external: ['@libsql/client', 'libsql', 'drizzle-orm']
	}
});
