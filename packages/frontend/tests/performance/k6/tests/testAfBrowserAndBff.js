/*
 * This is a test script for performance testing the Altinn Frontend using k6 and browser automation.
 * Usage:
 * k6 run browser.js -e BROWSER_VUS=1 -e BFF_VUS=10 -e DURATION=1m -e ENVIRONMENT=yt
 *  BROWSER_VUS: Number of virtual users for browser tests.
 *  BFF_VUS: Number of virtual users for backend-for-frontend (BFF) tests.
 *  DURATION: Duration of the test run.
 *  ENVIRONMENT: Environment to test against (e.g., yt, at, tt).
 * */
import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomItem } from '../helpers/testimports.js';
import { getCookie } from '../helpers/getCookie.js';
import { afUrl } from '../helpers/config.js';
import { readCsv } from '../testData/readCsv.js';
import { getOptions } from '../helpers/options.js';
import { selectSideMenuElement, selectNextPage } from './browserFunctions.js';
export { bffTest } from './bffFunctions.js'; 

const env = __ENV.ENVIRONMENT || 'yt';

const filenameEndusers = import.meta.resolve(`../testData/usersWithDialogs-${env}.csv`);
export const endUsers = new SharedArray('endUsers', function () {
  return readCsv(filenameEndusers);
});

export const options = getOptions();

// Define the trends for each page load
const loadInbox = new Trend('load_inbox', true);
const loadDrafts = new Trend('load_drafts', true);
const loadSent = new Trend('load_sent', true);
const loadSavedSearches = new Trend('load_saved_searches', true);
const loadArchive = new Trend('load_archive', true);
const loadBin = new Trend('load_bin', true);
const backToInbox = new Trend('load_inbox_from_menu', true);
const loadNextPage = new Trend('load_next_page', true);


/**
 * The setup function initializes the test data by generating cookies for each end user.
 * It retrieves the token for each end user and creates a cookie object.
 * @returns {Array} - An array of objects containing the PID and cookie for each end user.
 **/
export async function setup() {
  var data = [];
  for (var endUser of endUsers) {
    var cookie = getCookie(endUser.pid);
    data.push({
      pid: endUser.pid,
      cookie: cookie
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
  var testData = randomItem(data); //data[__ITER % data.length]; //randomItem(data);
  console.log(`Running browser test for PID: ${testData.pid}, iteration: ${__ITER}, ix: ${__ITER % data.length}`);
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await context.addCookies([testData.cookie]);
    var startTime = new Date();
    await page.goto(afUrl, { waitUntil: 'networkidle' });

    // Check if we are on the right page
    const currentUrl = page.url();
    check(currentUrl, {
      currentUrl: (h) => h == afUrl,
    });
     // Wait for 60 seconds to simulate user interaction
    
    var endTime = new Date();
    loadInbox.add(endTime - startTime);

    // press every menu item, return to inbox
    await selectSideMenuElement(page, 'a[href="/drafts"]', loadDrafts);
    await selectSideMenuElement(page, 'a[href="/sent"]', loadSent);
    await selectSideMenuElement(page, 'a[href="/saved-searches"]', loadSavedSearches);
    await selectSideMenuElement(page, 'a[href="/archive"]', loadArchive);
    await selectSideMenuElement(page, 'a[href="/bin"]', loadBin);
    await selectSideMenuElement(page, 'aside a[href="/"]', backToInbox);
    await selectNextPage(page, loadNextPage);
  } finally {
    await page.close();
  }
}

