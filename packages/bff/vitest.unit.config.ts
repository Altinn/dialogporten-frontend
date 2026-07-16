import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit',
    exclude: [...configDefaults.exclude, 'tests/integration/**'],
  },
});
