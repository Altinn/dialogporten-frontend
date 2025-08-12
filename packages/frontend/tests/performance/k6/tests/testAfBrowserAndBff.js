/*
 * This is a test script for performance testing arebeidsflate using k6 and browser automation.
 * Usage (run from CLI):
 * k6 run testAfBrowserAndBff.js -e BROWSER_VUS=1 -e BFF_VUS=10 -e DURATION=1m -e ENVIRONMENT=yt
 *  BROWSER_VUS: Number of virtual users for browser tests.
 *  BFF_VUS: Number of virtual users for backend-for-frontend (BFF) tests.
 *  DURATION: Duration of the test run.
 *  ENVIRONMENT: Environment to test against (e.g., yt, at, tt).
 *
 * In addition, the ENVIRONMENT variables for token generation must be set:
 *   - TOKEN_GENERATOR_USERNAME
 *   - TOKEN_GENERATOR_PASSWORD
 * */
import { check } from 'k6';
import { browser } from 'k6/browser';
import { SharedArray } from 'k6/data';
import { Trend } from 'k6/metrics';
import { afUrl } from '../helpers/config.js';
import { getCookie } from '../helpers/getCookie.js';
import { getOptions } from '../helpers/options.js';
import { isAuthenticatedLabel } from '../helpers/queries.js';
import { randomItem } from '../helpers/testimports.js';
import { readCsv } from '../testData/readCsv.js';
import {
  getDialogsForAllEnterprises,
  getNextpage,
  isAuthenticated,
  openAf,
  selectMenuElements,
} from '../tests/bffFunctions.js';
import { selectAllEnterprises, selectNextPage, selectSideMenuElement } from './browserFunctions.js';

const env = __ENV.ENVIRONMENT || 'yt';

const filenameEndusers = import.meta.resolve(`../testData/usersWithDialogs-${env}.csv`);
export const endUsers = new SharedArray('endUsers', () => readCsv(filenameEndusers));

export const options = getOptions();

// Define the trends for each page load
const openAF = new Trend('open_af', true);
const loadDrafts = new Trend('load_drafts', true);
const loadSent = new Trend('load_sent', true);
const loadSavedSearches = new Trend('load_saved_searches', true);
const loadArchive = new Trend('load_archive', true);
const loadBin = new Trend('load_bin', true);
const backToInbox = new Trend('load_inbox_from_menu', true);
const loadNextPage = new Trend('load_next_page', true);
const loadAllEnterprises = new Trend('load_all_enterprises', true);

/**
 * The setup function initializes the test data by generating cookies for each end user.
 * It retrieves the token for each end user and creates a cookie object.
 * @returns {Array} - An array of objects containing the PID and cookie for each end user.
 **/
export async function setup() {
  const data = [];
  let cookie;
  for (const endUser of endUsers) {
    cookie = getCookie(endUser.pid);
    data.push({
      pid: endUser.pid,
      cookie: cookie,
    });
  }
  return data;
}

/**
 * Main function for the browser test.
 * Executes the test scenario based on the provided data.
 * @param {object} data - Test data for the scenario.
 */
export async function browserTest(data) {
  const testData = randomItem(data);
  const context = await browser.newContext();
  const page = await context.newPage();
  let startTime;
  let endTime;

  try {
    await context.addCookies([testData.cookie]);
    startTime = new Date();
    await page.goto(afUrl, { waitUntil: 'networkidle' });

    // Check if we are on the right page
    const currentUrl = page.url();
    check(currentUrl, {
      currentUrl: (h) => h === afUrl,
    });

    endTime = new Date();
    openAF.add(endTime - startTime);

    // press every menu item, return to inbox
    await selectSideMenuElement(page, 'a[href="/drafts"]', loadDrafts);
    await selectSideMenuElement(page, 'a[href="/sent"]', loadSent);
    await selectSideMenuElement(page, 'a[href="/saved-searches"]', loadSavedSearches);
    await selectSideMenuElement(page, 'a[href="/archive"]', loadArchive);
    await selectSideMenuElement(page, 'a[href="/bin"]', loadBin);
    await selectSideMenuElement(page, 'aside a[href="/"]', backToInbox);
    await selectNextPage(page, loadNextPage);
    await selectAllEnterprises(page, loadAllEnterprises);
  } finally {
    await page.close();
  }
}

/**
 * This function does the bff-calls used when selecting menu elements
 * @param {Object} testData - The test data containing cookie and pid.
 * @returns {Array} - An array containing user party information.
 */
export function bffTest(data) {
  const testData = randomItem(data);
  const [parties, allParties] = openAf(testData.pid, testData.cookie);
  selectMenuElements(testData.cookie, parties);
  isAuthenticated(testData.cookie, isAuthenticatedLabel);
  getNextpage(testData.cookie, parties);
  getDialogsForAllEnterprises(testData.cookie, allParties);
}
