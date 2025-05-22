import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { openAf, selectMenuElements, isAuthenticated, getNextpage } from './bff.js'; 
import { queryLabels, isAuthenticatedLabel } from './queries.js';
const bffPercentage = (__ENV.bffPercentage ??  90);

export const options = {
  scenarios: {
    browser: {
      executor: 'shared-iterations',
      exec: 'browserTest',
      vus: __ENV.VUS || 1,
      iterations: __ENV.ITERATIONS || 1,
      maxDuration: __ENV.MAX_DURATION || '10m',
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
for (var label of queryLabels) {
  options.thresholds[`http_req_duration{name:${label}}`] = [];
  options.thresholds[`http_req_failed{name:${label}}`] = [];
}

export function setup() {
  // This function runs once before the test starts
  // Only use a few users for now
  var data = [
    {
      pid: '14886498226',
      cookie: null
    },
    {
      pid: '10865299538',
      cookie: null
    },
  ]
  return data;
}

// Define the trends for each page load
const loadInbox = new Trend('load_inbox', true);
const loadDrafts = new Trend('load_drafts', true);
const loadSent = new Trend('load_sent', true);
const loadSavedSearches = new Trend('load_saved_searches', true);
const loadArchive = new Trend('load_archive', true);
const loadBin = new Trend('load_bin', true);
const backToInbox = new Trend('load_inbox_from_menu', true);

/**
 * Main function for the browser test.
 * Executes the test scenario based on the provided data.
 * @param {object} data - Test data for the scenario.
 */
export async function browserTest(data) {
  var testData = data[__VU % data.length]; // ensure that no vus use the same data

  // If cookie and inside pffPercentage, run bff
  if (testData.cookie && run_bff()) {
    const parties = openAf(testData);
    selectMenuElements(testData.cookie, parties);
    isAuthenticated(testData.cookie, isAuthenticatedLabel);
    getNextpage(testData.cookie, parties);
    return;
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // if cookie set, go stright to af
    if (testData.cookie) {   
      await context.addCookies([testData.cookie]);
      var startTime = new Date();
      await page.goto('http://af.yt.altinn.cloud', { waitUntil: 'networkidle' });
      var endTime = new Date();
      loadInbox.add(endTime - startTime);
    }
    // if no cookie, go to login page
    else {
      await page.goto('http://af.yt.altinn.cloud', { waitUntil: 'networkidle' });
      await login(page, testData);

    }

    // Check if we are on the right page
    const currentUrl = page.url();
    check(currentUrl, {
      currentUrl: (h) => h == 'https://af.yt.altinn.cloud/',
    });

    // press every menu item, return to inbox
    await selectSideMenuElement(page, 'a[href="/drafts"]', loadDrafts);
    await selectSideMenuElement(page, 'a[href="/sent"]', loadSent);
    await selectSideMenuElement(page, 'a[href="/saved-searches"]', loadSavedSearches);
    await selectSideMenuElement(page, 'a[href="/archive"]', loadArchive);
    await selectSideMenuElement(page, 'a[href="/bin"]', loadBin);
    await selectSideMenuElement(page, 'aside a[href="/"]', backToInbox);

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
  await Promise.all([
    page.locator('a[href="/authorize/testid1"]').click(),
    page.waitForNavigation({ waitUntil: 'networkidle' }),
  ]);

  await page.locator('input[name="pid"]').type(testData.pid);

  await Promise.all([
    page.locator('button[id="submit"]').click(),
    page.waitForNavigation({ waitUntil: 'networkidle' }),
  ]);
}

/**
 * Async function to select a side menu element on a page.
 * @param {object} page - The page object to interact with.
 * @param {string} locator - Locator for the menu element.
 * @param {object} trend - Trend metric to track the action duration.
 */
async function selectSideMenuElement(page, locator, trend) {
  var startTime = new Date();
  await Promise.all([
    page.locator(locator).click(),
    page.waitForNavigation({ waitUntil: 'networkidle' }),
  ]);
  var endTime = new Date();
  trend.add(endTime - startTime);
  await page.waitForTimeout(15);
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
        console.log('Cookie: ' + cookie.name + '=' + cookie.value);
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
  console.log('Random number: ' + randNumber);
  if (randNumber <= bffPercentage) {
    return true;
  }
  return false;
}