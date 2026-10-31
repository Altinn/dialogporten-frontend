import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { baseQueryParams, baseURL } from '../index';

const WCAG_TAGS_CONFIG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const VIOLATION_FILTERS = ['critical', 'serious'];
const KNOWN_ALTINN_COMPONENTS_A11Y_ISSUES = ['svg-img-alt'];

const expectNoViolations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
  const relevantViolations = violations
    .filter(({ impact }) => VIOLATION_FILTERS.includes(impact ?? ''))
    .filter(({ id }) => !KNOWN_ALTINN_COMPONENTS_A11Y_ISSUES.includes(id));
  expect(relevantViolations).toEqual([]);
};

test.describe('Axe test', () => {
  test('should not have any automatically detectable accessibility issues for the dialog builder and preview', async ({
    page,
  }) => {
    await page.goto(`${baseURL}/dialog-builder${baseQueryParams}`);
    await page.getByRole('button', { name: 'Fyll med eksempeldata' }).click();
    await expect(page.getByText('Dialogen er gyldig')).toBeVisible();
    await expectNoViolations(page);

    await page.getByRole('button', { name: 'Forhåndsvis' }).click();
    await expect(page.getByRole('heading', { name: 'Test-søknad om digitalisering' })).toBeVisible();
    await expectNoViolations(page);
  });
});
