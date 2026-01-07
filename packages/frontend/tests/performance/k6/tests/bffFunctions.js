import http from 'k6/http';
import { afUrl } from '../helpers/config.js';
import {
  getAllDialogsForCountQuery,
  getAllDialogsForPartyQuery,
  getAltinn2messages,
  organizationsQuery,
  partiesQuery,
  profileQuery,
  savedSearchesQuery,
} from '../helpers/queries.js';
import { describe, expect, randomItem } from '../helpers/testimports.js';
const baseUrl = afUrl + 'api';

/**
 * This function does the same bff-calls that af does freom the browser
 * @param {Object} testData - The test data containing cookie and pid.
 * @returns {Array} - An array containing user party information.
 */
export function openAf(pid, cookie) {
  const parties = getParties(cookie, pid);
  const userParty = `urn:altinn:person:identifier-no:${pid}`;
  getOrganizations(cookie);
  getSavedSearches(cookie);
  getProfile(cookie);
  getAltinn2Messages(cookie, pid);
  getAllDialogsForParties(cookie, [userParty], 100, true);
  //getAllDialogsForCount(cookie, [userParty[0]]);
  return [userParty, parties];
}

/**
 * This function does the bff-calls used when selecting menu elements
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} parties - An array of party URIs.
 */
export function selectMenuElements(
  cookie,
  parties,
  pressSentBff,
  pressDraftsBff,
  pressArchiveBff,
  pressBinBff,
  pressInboxBff,
) {
  let time1 = new Date();
  getMenuElements(cookie, parties[0], 'DRAFT');
  let time2 = new Date();
  pressDraftsBff.add(time2 - time1);
  getMenuElements(cookie, parties[0], 'SENT');
  time1 = new Date();
  pressSentBff.add(time1 - time2);
  getMenuElements(cookie, parties[0], 'ARCHIVE');
  time2 = new Date();
  pressArchiveBff.add(time2 - time1);
  getMenuElements(cookie, parties[0], 'BIN');
  time1 = new Date();
  pressBinBff.add(time1 - time2);
  getAllDialogsForParties(cookie, [parties[0]], 100, true);
  time2 = new Date();
  pressInboxBff.add(time2 - time1);
}

/**
 * This function retrieves all dialogs for all enterprises the user is a part of,
 * if there are between 2 and 20 enterprises.
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} parties - An array of party URIs.
 */
export function getDialogsForAllEnterprises(cookie, parties, selectAllEnterprisesBff, selectAnotherPartyBff) {
  const enterprises = parties.filter((el) => el.includes('organization'));
  if (enterprises.length > 1 && enterprises.length <= 20) {
    const startTime = new Date();
    getAllDialogsForParties(cookie, enterprises, 100, true);
    const endTime = new Date();
    selectAllEnterprisesBff.add(endTime - startTime);
  } else if (parties.length > 0) {
    const party = randomItem(parties);
    const startTime = new Date();
    getAllDialogsForParties(cookie, [party], 100, true);
    const endTime = new Date();
    selectAnotherPartyBff.add(endTime - startTime);
  }
}

export const texts = [
  'påkrevd',
  'rapportering',
  'sammendrag',
  'Utvidet Status',
  'ingen HTML-støtte',
  'et eller annet',
  'Skjema',
  'Skjema for rapportering av et eller annet',
  'Maks 200 tegn',
  'liste'
];
export function doSearches(cookie, party) {
  const payload = JSON.parse(JSON.stringify(getAllDialogsForPartyQuery));
  payload.variables.partyURIs.push(party);
  payload.variables.limit = 100;
  payload.variables.search = randomItem(texts);
  //console.log(JSON.stringify(payload, null, 2));
  
  // Always single party for menu elements
  const queryLabel = payload.operationNameSingleParty + ' FTS';
  const resp = graphql(cookie, payload, queryLabel);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
  return resp.json();
}

/**
 * This function calls the isAuthenticated endpoint. Called twice pr minute from browser
 *  @param {Object} cookie - The cookie object containing name and value.
 * @param {string} label - The label for the request.
 * @return {Object} - The response object from the request.
 */
export function isAuthenticated(cookie, label) {
  const url = baseUrl + '/isAuthenticated';
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: { name: label },
  };
  if (cookie.name && cookie.value) {
    params.headers.Cookie = cookie.name + '=' + cookie.value;
  } else {
    params.headers.Cookie = cookie;
  }
  const resp = http.get(url, params);
  if (resp.status !== 200) {
    console.info('isAuthenticated request failed: ' + resp.status);
  }
  return resp;
}

/**
 * This function calls the getAllDialogsForParty endpoint with a continuation token to get the next page of dialogs.
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} parties - An array of party URIs.
 * @return {Object} - The response object from the request.
 * @throws {Error} - If the request fails.
 */
export function getNextpage(cookie, parties) {
  let dialogs = getAllDialogsForParties(cookie, [parties[0]], 100, true, null);
  let iterations = 0;
  while (dialogs.data?.searchDialogs.hasNextPage && iterations < 10) {
    const continuationToken = dialogs.data.searchDialogs.continuationToken;
    dialogs = getAllDialogsForParties(cookie, [parties[0]], 100, true, continuationToken);
    iterations++;
  }
}

/**
 * This function retrieves the parties for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @return {Array} - An array of party URIs.
 */
function getParties(cookie, pid) {
  const resp = graphql(cookie, partiesQuery);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
  const data = resp.json();
  if (!data.data || !data.data.parties) {
    console.info(`No parties found in response data for ${pid}`);
    return [];
  }
  const parties = [];
  for (const party of data.data.parties) {
    if (party.isDeleted) continue;
    parties.push(party.party);
    for (const subParty of party.subParties) {
      if (subParty.isDeleted) continue;
      parties.push(subParty.party);
    }
  }
  return parties;
}

/**
 * This function retrieves the organizations for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @return {Array} - An array of organization IDs.
 */
function getOrganizations(cookie) {
  const resp = graphql(cookie, organizationsQuery);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
  const data = resp.json();
  const orgs = [];
  for (const org of data.data.organizations) {
    orgs.push(org.id);
  }
  return orgs;
}

/**
 * This function retrieves the saved searches for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @return {Array} - An array of saved search IDs.
 */
function getSavedSearches(cookie) {
  const resp = graphql(cookie, savedSearchesQuery);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
  const data = resp.json();
  const searches = [];
  if (data.data?.savedSearches) {
    for (const search of data.data.savedSearches) {
      searches.push(search.id);
    }
  }
  return searches;
}

/**
 * This function retrieves the profile information for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @return {Array} - An array containing user ID and UUID.
 */
function getProfile(cookie) {
  const resp = graphql(cookie, profileQuery);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
}

/**
 * This function retrieves the count of all dialogs for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} parties - An array of party URIs.
 * @return {Object} - The response object from the request.
 */
function getAllDialogsForCount(cookie, parties) {
  const payload = JSON.parse(JSON.stringify(getAllDialogsForCountQuery));
  for (const party of parties) {
    payload.variables.partyURIs.push(party);
  }
  let queryLabel = payload.operationName + ' all parties';
  if (parties.length === 1) {
    queryLabel = payload.operationName + ' single party';
  }
  const resp = graphql(cookie, payload, queryLabel);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
  return resp.json();
}

/**
 * This function retrieves all dialogs for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} parties - An array of party URIs.
 * @param {number} count - The number of dialogs to retrieve.
 * @param {boolean} extraParams - Whether to include extra parameters in the request.
 * @param {string} continuationToken - The continuation token for pagination.
 * @return {Object} - The response object from the request.
 */
function getAllDialogsForParties(cookie, parties, count, extraParams = false, continuationToken = null) {
  const payload = JSON.parse(JSON.stringify(getAllDialogsForPartyQuery));
  for (const party of parties) {
    payload.variables.partyURIs.push(party);
  }
  payload.variables.limit = count;
  let queryLabel = payload.operationNameSingleParty;
  if (parties.length > 1) {
    queryLabel = payload.operationNameMultipleParties;
  }

  if (continuationToken) {
    payload.variables.continuationToken = continuationToken;
    queryLabel = queryLabel + ' nextPage';
  }

  if (extraParams) {
    payload.variables.status = ['NOT_APPLICABLE', 'IN_PROGRESS', 'AWAITING', 'REQUIRES_ATTENTION', 'COMPLETED'];
    payload.variables.label = ['DEFAULT'];
    queryLabel = queryLabel + ' with extraParams';
  }

  const resp = graphql(cookie, payload, queryLabel);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
  return resp.json();
}

/**
 * This function retrieves messages from altinn2.
 * @param {Object} cookie - The cookie object containing name and value.
 * @return {Array} - altinn2 messages
 */
function getAltinn2Messages(cookie, pid) {
  const payload = JSON.parse(JSON.stringify(getAltinn2messages));
  payload.variables.selectedAccountIdentifier = pid;

  const resp = graphql(cookie, payload);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
  return resp.json();
}

/**
 * This function retrieves menu elements for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} party - An array of party URIs.
 * @param {string} menuElement - The menu element to retrieve.
 * @return {Object} - The response object from the request.
 */
function getMenuElements(cookie, party, menuElement) {
  const payload = JSON.parse(JSON.stringify(getAllDialogsForPartyQuery));
  payload.variables.partyURIs.push(party);
  payload.variables.limit = 100;
  if (menuElement === 'ARCHIVE' || menuElement === 'BIN') {
    payload.variables.label = [menuElement];
  } else if (menuElement === 'SENT') {
    payload.variables.label = ['DEFAULT', 'SENT'];
  } else {
    payload.variables.status = [menuElement];
    payload.variables.label = ['DEFAULT'];
  }
  // Always single party for menu elements
  const queryLabel = payload.operationNameSingleParty + ' ' + menuElement;
  const resp = graphql(cookie, payload, queryLabel);
  if (resp.status !== 200) {
    console.info('GraphQL request failed: ' + resp.status);
    return;
  }
  return resp.json();
}

/**
 * This function performs a GraphQL request to the specified URL.
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Object} query - The GraphQL query to execute.
 * @param {string} label - The label for the request.
 * @return {Object} - The response object from the request.
 */
function graphql(cookie, query, label = null) {
  const url = baseUrl + '/graphql';
  const payload = JSON.stringify(query);
  let queryLabel = query.operationName;
  if (label) {
    queryLabel = label;
  }
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: { name: queryLabel },
  };

  if (cookie.name && cookie.value) {
    params.headers.Cookie = cookie.name + '=' + cookie.value;
  } else {
    params.headers.Cookie = cookie;
  }
  let r = null;
  describe('graphQL request', () => {
    r = http.post(url, payload, params);
    expect(r.status, 'response status').to.equal(200);
    expect(r, 'response').to.have.validJsonBody();
  });
  return r;
}
