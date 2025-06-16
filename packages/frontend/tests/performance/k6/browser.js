import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { openAf, selectMenuElements, isAuthenticated, getNextpage } from './bff.js'; 
import { queryLabels, isAuthenticatedLabel } from './queries.js';
import { getPersonalToken, randomItem } from './testimports.js';
import { getCookie } from './cookieGenk6.js';

const numberOfEndUsers = __ENV.NUMBER_OF_ENDUSERS || 30;

function getOptions() {
  const browser_vus = __ENV.BROWSER_VUS || 1;
  const bff_vus = __ENV.BFF_VUS || 1;
  const duration = __ENV.DURATION || '1m';
  const options = {
    scenarios: {},
    thresholds: {
    checks: ['rate==1.0']
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(75)', 'p(95)', 'count'],
  }
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
  if (bff_vus > 0) {
    options.scenarios.bff = {
      executor: 'constant-vus',
      exec: 'bffTest',
      vus: bff_vus,
      duration: duration,
    };
    for (var label of queryLabels) {
      options.thresholds[`http_req_duration{name:${label}}`] = [];
      options.thresholds[`http_req_failed{name:${label}}`] = [];
    }
  }
  return options;
}

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

function getTokens(numberOfTokens = 1) {
  const tokenParams = {
      scopes: "digdir:dialogporten.noconsent openid altinn:portal/enduser",
      bulkCount: numberOfTokens
  }
  const tokens = getPersonalToken(tokenParams);
  return JSON.parse(tokens);
}

export async function setup() {
  const tokens = getTokens(numberOfEndUsers);
  const keys = Object.keys(tokens);
  let data = []
  for (var key of keys) {
      let cookie = await getCookie(tokens[key]);
      data.push({
          cookie: cookie,
          pid: key
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

  const context = await browser.newContext();
  const page = await context.newPage();
  var startTime = new Date();

  try {
    await context.addCookies([testData.cookie]);
    await page.goto('http://af.yt.altinn.cloud', { waitUntil: 'networkidle' });

    // Check if we are on the right page
    const currentUrl = page.url();
    check(currentUrl, {
      currentUrl: (h) => h == 'https://af.yt.altinn.cloud/',
    });

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