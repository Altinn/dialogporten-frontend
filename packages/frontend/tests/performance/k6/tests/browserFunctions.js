/**
 * Async function to select a side menu element on a page.
 * @param {object} page - The page object to interact with.
 * @param {string} locator - Locator for the menu element.
 * @param {object} trend - Trend metric to track the action duration.
 */
export async function selectSideMenuElement(page, locator, trend) {
  const startTime = new Date();
  const elems = page.getByTestId(locator);
  const count = await elems.count();

  for (let i = 0; i < count; i++) {
    const el = elems.nth(i);
    const visible = await el.isVisible();
    const enabled = await el.isEnabled();
    if (visible && enabled) {
      await el.click();
      // Wait for the page to load after clicking the menu element
      await waitForPageLoaded(page, 2);
      // Track the time taken for the action
      const endTime = new Date();
      trend.add(endTime - startTime);
      return;
    }
  }
}

/**
 * Async function to select the next page in the dialog list.
 * @param {object} page - The page object to interact with.
 * @param {object} trend - Trend metric to track the action duration.
 * @return {Promise<void>} - A promise that resolves when the next page is selected.
 */
export async function selectNextPage(page, trend) {
  let next_page = await page
    .waitForSelector('button[class="ds-button"]', { state: 'attached', timeout: 500 })
    .catch(() => false);
  let iterations = 0;
  while (next_page && iterations < 10) {
    const startTime = new Date();
    await Promise.all([next_page.click()]);

    // Wait for the page to load after clicking the next page button
    await waitForPageLoaded(page, 2);
    next_page = await page
      .waitForSelector('button[class="ds-button"]', { state: 'attached', timeout: 500 })
      .catch(() => false);
    const endTime = new Date();
    trend.add(endTime - startTime);
    iterations++;
  }
}

/**
 * Async function to select all enterprises in the dialog list.
 * @param {object} page - The page object to interact with.
 * @param {object} trend - Trend metric to track the action duration.
 * @return {Promise<void>} - A promise that resolves when all enterprises are selected.
 */
export async function selectAllEnterprises(page, trend) {
  const startTime = new Date();
  await page.locator('#toolbar-menu-root > button').click();
  await page.locator('#ALL').click();
  await waitForPageLoaded(page, 2);
  const endTime = new Date();
  trend.add(endTime - startTime);
}

/**
 * Async function to wait for the page to load.
 * @param {object} page - The page object to interact with.
 * @param {number} empties - Number of empty checks to perform (default is 1).
 * @return {Promise<void>} - A promise that resolves when the page is loaded.
 */
export async function waitForPageLoaded(page, empties = 1) {
  let busyItems = await page.$$('li [aria-busy="true"]');
  let noEmptys = 0;
  while (busyItems.length > 0 || noEmptys < empties) {
    await page.waitForTimeout(10); // Wait for 10 ms before checking again
    busyItems = await page.$$('li [aria-busy="true"]');
    if (busyItems.length === 0) {
      noEmptys++;
    }
  }
}
