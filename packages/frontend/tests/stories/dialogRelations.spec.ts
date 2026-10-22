import { expect, type Page, test } from '@playwright/test';
import {
  groupingId,
  groupingSubunit,
  groupingTitle,
  knownGroupingPositions,
  MAIN_DIALOG_ID,
  MAIN_DIALOG_TITLE,
  QUARTERLY_COUNT,
  quarterlyId,
  quarterlyTitle,
  RELATED_DIALOG_TITLE,
} from '../../src/mocks/data/stories/dialog-relations/dialogs';
import { MAIN_UNIT_URN } from '../../src/mocks/data/stories/dialog-relations/parties';
import { baseQueryParams, baseURL } from '../';

const PLAYWRIGHT_ID = 'dialog-relations';
const PAGE_SIZE = 25;

const dialogUrl = (id: string, party?: string) =>
  `${baseURL}/inbox/${id}/${baseQueryParams}&playwrightId=${PLAYWRIGHT_ID}${party ? `&party=${encodeURIComponent(party)}` : ''}`;
const inboxUrl = (party: string) =>
  `${baseURL}/${baseQueryParams}&playwrightId=${PLAYWRIGHT_ID}&party=${encodeURIComponent(party)}`;

const relatedSection = (page: Page) => page.getByTestId('related-dialogs');
const childList = (page: Page) => page.getByTestId('child-dialogs');
const relatedList = (page: Page) => page.getByTestId('related-dialogs-list');
const partOfLink = (page: Page, title: string) => page.getByRole('link', { name: `Del av: ${title}` });
const partyParam = (page: Page) => new URL(page.url()).searchParams.get('party');

/* Collects the relation types requested through the dialogRelations query, to tell when it was fetched */
const trackRelationRequests = (page: Page) => {
  const requests: { dialogId: string; type?: string }[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST' || !request.url().includes('/api/graphql')) return;
    const body = request.postDataJSON() as {
      operationName?: string;
      variables?: { dialogId: string; input?: { type?: string } };
    } | null;
    if (body?.operationName === 'dialogRelations' && body.variables) {
      requests.push({ dialogId: body.variables.dialogId, type: body.variables.input?.type });
    }
  });
  return requests;
};

test.describe('Dialog relations', () => {
  test.use({ viewport: { width: 1280, height: 500 } });

  test('loads the related dialogs section only once it scrolls into view, and pages through children', async ({
    page,
  }) => {
    /* Low enough for the section to stay below the fold (and its preload margin) while the main content loads */
    await page.setViewportSize({ width: 1280, height: 400 });
    const requests = trackRelationRequests(page);
    await page.goto(dialogUrl(MAIN_DIALOG_ID));
    await expect(page.getByRole('heading', { name: MAIN_DIALOG_TITLE })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Info i markdown' })).toBeVisible();

    // The section is below the fold and has not been fetched
    await expect(relatedSection(page)).toHaveAttribute('data-state', 'pending');
    expect(requests.filter((r) => r.dialogId === MAIN_DIALOG_ID && r.type === 'CHILD')).toHaveLength(0);

    await relatedSection(page).scrollIntoViewIfNeeded();
    await expect(relatedSection(page)).toHaveAttribute('data-state', 'loaded');

    // First page: 25 relations, of which the inaccessible ones (positions 4 and 14) are left out
    const firstPage = knownGroupingPositions.filter((n) => n < PAGE_SIZE);
    const links = childList(page).getByRole('link');
    await expect(childList(page).getByRole('heading', { name: 'Underliggende dialoger' })).toBeVisible();
    await expect(links).toHaveCount(firstPage.length);
    await expect(links.first()).toContainText(groupingTitle(0));
    await expect(links.last()).toContainText(groupingTitle(firstPage[firstPage.length - 1]));

    // Second page on demand
    await childList(page).getByRole('button', { name: 'Vis flere' }).click();
    await expect(links).toHaveCount(knownGroupingPositions.length);
    await expect(links.last()).toContainText(groupingTitle(knownGroupingPositions[knownGroupingPositions.length - 1]));
    await expect(childList(page).getByRole('button', { name: 'Vis flere' })).toHaveCount(0);

    // Related (non-hierarchical) dialogs are listed separately
    await expect(relatedList(page).getByRole('heading', { name: 'Relaterte dialoger' })).toBeVisible();
    await expect(relatedList(page).getByRole('link', { name: RELATED_DIALOG_TITLE })).toBeVisible();
  });

  test('shows the number of children of a child that has children of its own', async ({ page }) => {
    await page.goto(dialogUrl(MAIN_DIALOG_ID));
    await relatedSection(page).scrollIntoViewIfNeeded();

    const firstChild = childList(page)
      .getByRole('listitem')
      .filter({ hasText: groupingTitle(0) });
    await firstChild.scrollIntoViewIfNeeded();
    await expect(firstChild.getByTestId('relations-count')).toHaveText(`${QUARTERLY_COUNT} underliggende dialoger`);

    // A child without children of its own shows no count
    const secondChild = childList(page)
      .getByRole('listitem')
      .filter({ hasText: groupingTitle(1) });
    await secondChild.scrollIntoViewIfNeeded();
    await expect(secondChild).toBeVisible();
    await expect(secondChild.getByTestId('relations-count')).toHaveCount(0);
  });

  test('a child and a grandchild link to their parent', async ({ page }) => {
    await page.goto(dialogUrl(quarterlyId(0)));
    await expect(page.getByRole('heading', { name: quarterlyTitle(0) })).toBeVisible();
    await expect(page.getByTestId('related-dialogs')).toBeAttached();

    await partOfLink(page, groupingTitle(0)).click();
    await expect(page.getByRole('heading', { name: groupingTitle(0) })).toBeVisible();

    // The grouping dialog has both a parent and children
    await relatedSection(page).scrollIntoViewIfNeeded();
    await expect(childList(page).getByRole('link')).toHaveCount(QUARTERLY_COUNT);

    await partOfLink(page, MAIN_DIALOG_TITLE).click();
    await expect(page.getByRole('heading', { name: MAIN_DIALOG_TITLE })).toBeVisible();
    await expect(page.getByTestId('parent-dialog-link')).toHaveCount(0);
  });

  test('related dialog links switch to the party that owns the linked dialog', async ({ page }) => {
    await page.goto(dialogUrl(MAIN_DIALOG_ID, MAIN_UNIT_URN));
    await relatedSection(page).scrollIntoViewIfNeeded();

    // The first child belongs to a subunit, not to the main unit the main dialog is viewed as
    await childList(page)
      .getByRole('link', { name: groupingTitle(0) })
      .click();
    await expect(page.getByRole('heading', { name: groupingTitle(0) })).toBeVisible();
    await expect.poll(() => partyParam(page)).toBe(groupingSubunit(0).urn);
    await expect(page.getByRole('button', { name: new RegExp(groupingSubunit(0).name, 'i') }).first()).toBeVisible();

    // And back to the main unit through the "part of" link
    await partOfLink(page, MAIN_DIALOG_TITLE).click();
    await expect(page.getByRole('heading', { name: MAIN_DIALOG_TITLE })).toBeVisible();
    await expect.poll(() => partyParam(page)).toBe(MAIN_UNIT_URN);
  });

  test('the back link returns to the previous dialog with its own party', async ({ page }) => {
    await page.goto(dialogUrl(MAIN_DIALOG_ID, MAIN_UNIT_URN));
    await relatedSection(page).scrollIntoViewIfNeeded();
    await childList(page)
      .getByRole('link', { name: groupingTitle(0) })
      .click();
    await expect.poll(() => partyParam(page)).toBe(groupingSubunit(0).urn);

    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page.getByRole('heading', { name: MAIN_DIALOG_TITLE })).toBeVisible();
    await expect.poll(() => partyParam(page)).toBe(MAIN_UNIT_URN);

    // The main dialog's own back link still leads to the inbox, for the main unit
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    await expect.poll(() => partyParam(page)).toBe(MAIN_UNIT_URN);
  });

  test('the inbox shows the number of children once an item scrolls into view', async ({ page }) => {
    const requests = trackRelationRequests(page);
    await page.goto(inboxUrl(MAIN_UNIT_URN));

    const mainItem = page.getByRole('listitem').filter({ has: page.getByRole('link', { name: MAIN_DIALOG_TITLE }) });
    const knownChildCount = knownGroupingPositions.length;
    await expect(mainItem.getByTestId('relations-count')).toHaveText(`${knownChildCount} underliggende dialoger`);

    // The first grouping dialog is the oldest dialog, listed last and far below the fold
    const groupingItem = page.getByRole('listitem').filter({ has: page.getByRole('link', { name: groupingTitle(0) }) });
    await expect(groupingItem).toBeAttached();
    await expect(groupingItem.getByTestId('relations-count')).toHaveCount(0);
    expect(requests.some((r) => r.dialogId === groupingId(0))).toBe(false);

    await groupingItem.scrollIntoViewIfNeeded();
    await expect(groupingItem.getByTestId('relations-count')).toHaveText(`${QUARTERLY_COUNT} underliggende dialoger`);
    expect(requests.filter((r) => r.dialogId === groupingId(0))).toEqual([{ dialogId: groupingId(0), type: 'CHILD' }]);
  });
});
