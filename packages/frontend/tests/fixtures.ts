// tests/fixtures.ts
import { test as base, expect } from '@playwright/test';

const test = base.extend<{
  isMobile: boolean;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Unexpected empty object pattern.
  isMobile: async ({}, use, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    await use(isMobile);
  },
});

export { test, expect };
