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
import { openAf, selectMenuElements, isAuthenticated, getNextpage } from './bff.js'; 
import { queryLabels, isAuthenticatedLabel } from './queries.js';
import { getPersonalToken, randomItem } from './testimports.js';
import { getCookie } from './getCookie.js';
import { afUrl } from './config.js';
import { readCsv } from './readTestdata.js';

const environment = __ENV.ENVIRONMENT || 'yt';

const tokenGeneratorEnv = (() => {
  switch (environment) {
      case 'at':
          return 'at23';
      case 'tt':
          return 'tt02';
      case 'yt':
          return 'yt01';
      default:
          return 'yt01';
  }
}) ();

const filenameEndusers = "usersWithDialogs.csv";
export const endUsers = new SharedArray('endUsers', function () {
  return readCsv(filenameEndusers);
});

/*
 * Options for the k6 test script.
*/
export const options = (() => {
  // Set default values for environment variables
  const browser_vus = __ENV.BROWSER_VUS || 1;
  const bff_vus = __ENV.BFF_VUS || 1;
  const duration = __ENV.DURATION || '1m';
  const breakpoint = __ENV.BREAKPOINT || false;
  const abort_on_fail = __ENV.ABORT_ON_FAIL || false;
  
  // Options placeholder
  const options = {
    scenarios: {},
    thresholds: {
    checks: ['rate==1.0']
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(75)', 'p(95)', 'count'],
  }

  // Set browser scenario if browser_vus is greater than 0
  if (browser_vus > 0) {
    options.scenarios.browser = {
      executor: 'constant-vus',
      exec: 'browserTest',
      vus: browser_vus,
      duration: duration,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    };
  }

  // Set BFF scenario if bff_vus is greater than 0
  if (bff_vus > 0) {
    options.scenarios.bff = {
      exec: 'bffTest',
    };

    // Set executor and stages based on breakpoint
    if (breakpoint) {
      options.scenarios.bff.executor = 'ramping-vus',
      options.scenarios.bff.stages = [
        {
          duration: duration,
          target: bff_vus,
        },
      ]
      for (var label of queryLabels) {
        options.thresholds[[`http_req_duration{name:${label}}`]] = [{ threshold: "max<5000", abortOnFail: abort_on_fail }];
        options.thresholds[[`http_req_failed{name:${label}}`]] = [{ threshold: 'rate<=0.0', abortOnFail: abort_on_fail }];
      }
    } 
    // If breakpoint is false, use constant-vus executor
    else {
      options.scenarios.bff.executor = 'constant-vus';
      options.scenarios.bff.vus = bff_vus;
      options.scenarios.bff.duration = duration;
      for (var label of queryLabels) {
        options.thresholds[`http_req_duration{name:${label}}`] = [];
        options.thresholds[`http_req_failed{name:${label}}`] = [];
      }
    }
  }
  return options;
}) ();

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
 * Function to get a personal token for a given PID.
 * @param {string} pid - The personal identification number (PID) of the user.
 * @return {string} - The generated personal token.
 **/
function getToken(pid) {
  const tokenParams = {
    scopes: "digdir:dialogporten.noconsent openid altinn:portal/enduser",
    pid: pid,
    env: tokenGeneratorEnv
  }
  const token = getPersonalToken(tokenParams);
  return token
}

/**
 * The setup function initializes the test data by generating cookies for each end user.
 * It retrieves the token for each end user and creates a cookie object.
 * @returns {Array} - An array of objects containing the PID and cookie for each end user.
 **/
export async function setup() {
  var data = [];
  for (var endUser of endUsers) {
    var token = getToken(endUser.pid);
    var cookie = getCookie(token);
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
  var testData = randomItem(data);
  console.log(`Running browser test for PID: ${testData.pid}`);
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

export function bffTest(data) {
  var testData = randomItem(data);
  const parties = openAf(testData.pid, testData.cookie);
  selectMenuElements(testData.cookie, parties);
  isAuthenticated(testData.cookie, isAuthenticatedLabel);
  getNextpage(testData.cookie, parties);
}


/**
 * Async function to select a side menu element on a page.
 * @param {object} page - The page object to interact with.
 * @param {string} locator - Locator for the menu element.
 * @param {object} trend - Trend metric to track the action duration.
 */
async function selectSideMenuElement(page, locator, trend) {
  var menuElement = await page.waitForSelector(locator, { timeout: 2000 }).catch(() => false);
  var startTime = new Date();
  await Promise.all([
    menuElement.click(),
  ]);

  // Wait for the page to load after clicking the menu element
  await waitForPageLoaded(page);
  // Track the time taken for the action
  var endTime = new Date();
  trend.add(endTime - startTime);
}

/**
 * Async function to wait for the page to load.
 * @param {object} page - The page object to interact with.
 * @param {number} empties - Number of empty checks to perform (default is 1).
 * @return {Promise<void>} - A promise that resolves when the page is loaded.
 */
async function waitForPageLoaded(page, empties = 1) {
  var busyItems = await page.$$('li [aria-busy="true"]');
  var noEmptys = 0;
  while ( busyItems.length > 0 || noEmptys < empties) {
    await page.waitForTimeout(10); // Wait for 10 ms before checking again
    busyItems = await page.$$('li [aria-busy="true"]');
    if (busyItems.length == 0) {
      noEmptys++;
    }
  }
}

/**
 * Async function to select the next page in the dialog list.
 * @param {object} page - The page object to interact with.
 * @param {object} trend - Trend metric to track the action duration.
 * @return {Promise<void>} - A promise that resolves when the next page is selected.
 */
async function selectNextPage(page, trend) {
  var next_page = await page.waitForSelector('button[class="ds-button"]', { state: 'attached', timeout: 500 }).catch(() => false);
  var iterations = 0;
  while (next_page && iterations < 10) {
    var startTime = new Date();
    await Promise.all([
      next_page.click(),
    ]);
   
    // Wait for the page to load after clicking the next page button
    await waitForPageLoaded(page, 2);
    next_page = await page.waitForSelector('button[class="ds-button"]', { state: 'attached', timeout: 500 }).catch(() => false);
    var endTime = new Date();
    trend.add(endTime - startTime);
    iterations++;
  }
}