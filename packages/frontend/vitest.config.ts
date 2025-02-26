import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    server: {
      deps: {
        inline: ['react-router'],
      },
    },
    exclude: ['node_modules', 'tests'], // tests for Playwright
    environment: 'jsdom',
    pool: 'vmThreads',
    sequence: {
      setupFiles: 'list',
    },
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
});
