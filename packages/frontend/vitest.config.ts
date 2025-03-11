import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  define: process.env.VITEST ? {} : { global: 'window' },
  test: {
    deps: {
      optimizer: {
        web: {
          include: ['react-router-dom'],
          enabled: true,
        },
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
