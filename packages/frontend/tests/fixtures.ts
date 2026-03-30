// tests/fixtures.ts
import { test as base, expect } from '@playwright/test';

// Runs before any page scripts execute (before React mounts), ensuring
// BetaModal and onboarding hooks see dismissed state from their very first render.
// This prevents modals from showing regardless of whether ?mock=true is in the URL,
// and works correctly across SPA navigations and full page reloads in CI.
const dismissOnboardingScript = () => {
  localStorage.setItem('arbeidsflate:inbox-onboarding-displayed', 'true');
  localStorage.setItem('arbeidsflate:beta-modal-displayed', 'true');
  localStorage.setItem('arbeidsflate:profile-main-onboarding-completed', 'true');
  localStorage.setItem('arbeidsflate:profile-parties-onboarding-completed', 'true');
};

const test = base.extend<{
  isMobile: boolean;
}>({
  page: async ({ page }, use) => {
    await page.addInitScript(dismissOnboardingScript);
    await use(page);
  },
  // biome-ignore lint/correctness/noEmptyPattern: Unexpected empty object pattern.
  isMobile: async ({}, use, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    await use(isMobile);
  },
});

export { test, expect };
