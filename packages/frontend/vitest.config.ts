import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  define: process.env.VITEST ? {} : { global: 'window' },
  test: {
    server: {
      deps: {
        inline: [/react-router-dom/, /@altinn\/altinn-components/],
      },
    },
    exclude: ['node_modules', 'tests'], // tests for Playwright
    environment: 'jsdom',
    pool: 'threads',
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
