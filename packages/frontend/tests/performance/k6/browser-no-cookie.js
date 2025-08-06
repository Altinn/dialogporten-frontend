import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { SharedArray } from 'k6/data';
import { randomIntBetween, randomItem } from './testimports.js';
import { afUrl } from './config.js';

const browser_vus = __ENV.BROWSER_VUS || 1;
const duration = __ENV.DURATION || '1m';


function readCsv(filename) {
  try {
    return papaparse.parse(open(filename), { header: true, skipEmptyLines: true }).data;
  } catch (error) {
    console.log(`Error reading CSV file: ${error}`);
    return [];
  }
}

const filenameEndusers = "testdata.csv";
export const endUsers = new SharedArray('endUsers', function () {
  return readCsv(filenameEndusers);
});

export const options = {
  scenarios: {
    browser: {
      executor: 'constant-vus',
      exec: 'browserTest',
      vus: browser_vus,
      duration: duration,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    //browser_http_req_duration: ['p(95)<100'],
    //browser_http_req_duration: ['max<200'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(75)', 'p(95)', 'count'],
};

// Define the trends for each page load
const loadInbox = new Trend('load_inbox', true);
const loadDrafts = new Trend('load_drafts', true);
const loadSent = new Trend('load_sent', true);
const loadSavedSearches = new Trend('load_saved_searches', true);
const loadArchive = new Trend('load_archive', true);
const loadBin = new Trend('load_bin', true);
const backToInbox = new Trend('load_inbox_from_menu', true);
const loadNextPage = new Trend('load_next_page', true);


export function setup() {
  var data = [];
  for (var endUser of endUsers) {
    data.push({
      pid: endUser.pid,
      cookie: null
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
  var testData = data[0]; //randomItem(data);


  const context = await browser.newContext();
  const page = await context.newPage();
  
  var startTime = new Date();
  try {
    // if cookie set, go stright to af
    if (testData.cookie) { 
      await context.addCookies([testData.cookie]);
      await page.goto(afUrl, { waitUntil: 'networkidle' });
    }
    // if no cookie, go to login page
    else {
      await page.goto(afUrl, { waitUntil: 'networkidle' });
      startTime = await login(page, testData);
    }

    // Check if we are on the right page
    const currentUrl = page.url();
    check(currentUrl, {
      currentUrl: (h) => h == afUrl,        
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

    // Set cookie so we don't have to login next time
    await addCookie(testData, context);
    
  } finally {
    await page.close();
  }
}


/**
 * Async function to handle the login process on a page.
 * @param {object} page - The page object to interact with.
 * @param {object} testData - Test data containing user information.
 */
async function login(page, testData) {
  var startTime = new Date();
  await Promise.all([
    page.locator('a[href="/authorize/testid1"]').click(),
    page.waitForNavigation({ waitUntil: 'networkidle' }),
  ]);

  await page.locator('input[name="pid"]').type(testData.pid);

  await Promise.all([
    page.locator('button[id="submit"]').click(),
    startTime = new Date(),
    page.waitForNavigation({ waitUntil: 'networkidle' }),
  ]);
  return startTime;
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

async function waitForPageLoaded(page, empties = 2) {
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

/**
 * Async function to add a cookie to the test data if not already present.
 * @param {object} testData - Test data containing user information.
 * @param {object} context - Browser context to access cookies.
 */
async function addCookie(testData, context) {
  if (!testData.cookie) {  
    let cookies = await context.cookies();
    for (var cookie of cookies) {
      if (cookie.name == 'arbeidsflate') {
        testData.cookie = cookie;
        break;
      }
    }
  }
}

/**
 * Function to determine whether to run the backend service based on a random percentage.
 * @returns {boolean} - True if the backend service should be run, false otherwise.
 */
function run_bff() {
  const randNumber = randomIntBetween(1, 100);
  if (randNumber <= bffPercentage) {
    return true;
  }
  return false;
}