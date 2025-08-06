import http from 'k6/http';
import { 
    partiesQuery, 
    organizationsQuery,
    savedSearchesQuery,
    profileQuery,
    getAllDialogsForCountQuery,
    getAllDialogsForPartyQuery
} from './queries.js';
import { describe, expect } from './testimports.js';
import { afUrl } from './config.js';

const baseUrl = afUrl + 'api';

/**
 * This function does the same bff-calls that af does freom the browser
 * @param {Object} testData - The test data containing cookie and pid.
 * @returns {Array} - An array containing user party information.
 */
export function openAf(pid, cookie) {
    var parties = getParties(cookie);
    getOrganizations(cookie);
    getSavedSearches(cookie);
    //getProfile(cookie);
    getAllDialogsForCount(cookie, parties);
    getAllDialogsForParty(cookie, parties);
    const userParty = parties.filter((el) => el.includes(pid));
    getAllDialogsForParty(cookie, [userParty[0]], 100, true);
    getAllDialogsForCount(cookie, [userParty[0]]);
    getAllDialogsForParty(cookie, [userParty[0]], 100);
    return userParty;
}

/**
 * This function does the bff-calls used when selecting menu elements
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} parties - An array of party URIs.
 */
export function selectMenuElements(cookie, parties) {
    getMenuElements(cookie, parties[0], "DRAFT");
    getMenuElements(cookie, parties[0], "SENT");
    getMenuElements(cookie, parties[0], "ARCHIVE");
    getMenuElements(cookie, parties[0], "BIN");
    getAllDialogsForParty(cookie, [parties[0]], 100, true);
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
        'Accept': 'application/json',
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
        console.log('isAuthenticated request failed: ' + resp.status);
    }
    return resp
}

/**
 * This function calls the getAllDialogsForParty endpoint with a continuation token to get the next page of dialogs.
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} parties - An array of party URIs.
 * @return {Object} - The response object from the request.
 * @throws {Error} - If the request fails. 
 */
export function getNextpage(cookie, parties) {
    var dialogs = getAllDialogsForParty(cookie, [parties[0]], 100, true, null);
    var iterations = 0;
    while (dialogs.data && dialogs.data.searchDialogs.hasNextPage && iterations < 10) {
        var continuationToken = dialogs.data.searchDialogs.continuationToken;
        dialogs = getAllDialogsForParty(cookie, [parties[0]], 100, true, continuationToken);
        iterations++;
    }
}

/**
 * This function retrieves the parties for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @return {Array} - An array of party URIs.
 */
function getParties(cookie) {
    var resp = graphql(cookie, partiesQuery);
    if (resp.status !== 200) {
        console.log('GraphQL request failed: ' + resp.status);
        return
    }
    const data = resp.json();
    var parties = [];
    for (var party of data.data.parties) {
        parties.push(party.party);
        for (var subParty of party.subParties) {
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
    var resp = graphql(cookie, organizationsQuery);
    if (resp.status !== 200) {
        console.log('GraphQL request failed: ' + resp.status);
        return
    }
    const data = resp.json();
    var orgs = [];
    for (var org of data.data.organizations) {
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
    var resp = graphql(cookie, savedSearchesQuery);
    if (resp.status !== 200) {
        console.log('GraphQL request failed: ' + resp.status);
        return
    }
    const data = resp.json();
    var searches = [];
    for (var search of data.data.savedSearches) {
        searches.push(search.id);
    }
    return searches;
}

/**
 * This function retrieves the profile information for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @return {Array} - An array containing user ID and UUID.
 */
function getProfile(cookie) {
    var resp = graphql(cookie, profileQuery);
    if (resp.status !== 200) {
        console.log('GraphQL request failed: ' + resp.status);
        return
    }
    const data = resp.json();
    var profile = [];   
    profile.push(data.data.profile.user.userId);
    profile.push(data.data.profile.user.userUuid);
    return profile;
}

/**
 * This function retrieves the count of all dialogs for the user.
 * @param {Object} cookie - The cookie object containing name and value.
 * @param {Array} parties - An array of party URIs.
 * @return {Object} - The response object from the request.
 */
function getAllDialogsForCount(cookie, parties) {
    var payload = JSON.parse(JSON.stringify(getAllDialogsForCountQuery));
    for (var party of parties) {
        payload.variables.partyURIs.push(party);
    }
    var resp = graphql(cookie, payload);
    if (resp.status !== 200) {
        console.log('GraphQL request failed: ' + resp.status);
        return
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
function getAllDialogsForParty(cookie, parties, count, extraParams = false, continuationToken = null) {
    var payload = JSON.parse(JSON.stringify(getAllDialogsForPartyQuery));
    for (var party of parties) {
        payload.variables.partyURIs.push(party);
    }
    payload.variables.limit = count;
    if (extraParams) {
        payload.variables.status = ["IN_PROGRESS","REQUIRES_ATTENTION","COMPLETED"];
        payload.variables.label = ["DEFAULT"];
    }
    var queryLabel = payload.operationName;
    if (continuationToken) {
        payload.variables.continuationToken = continuationToken;
        queryLabel = queryLabel + " nextPage";
    }

    var resp = graphql(cookie, payload, queryLabel);
    if (resp.status !== 200) {  
        console.log('GraphQL request failed: ' + resp.status);
        return
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
    var payload = JSON.parse(JSON.stringify(getAllDialogsForPartyQuery));
    payload.variables.partyURIs.push(party);
    payload.variables.limit = 100;
    if (menuElement === "ARCHIVE" || menuElement === "BIN") {
        payload.variables.label = [menuElement];
    }
    else {
        payload.variables.status = [menuElement];
        payload.variables.label = ["DEFAULT"];
    }
    var queryLabel = payload.operationName + " " + menuElement;
    var resp = graphql(cookie, payload, queryLabel);
    if (resp.status !== 200) {
        console.log('GraphQL request failed: ' + resp.status);
        return
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
    var queryLabel = query.operationName;
    if (label) {
        queryLabel = label;
    }
    const params = {
        headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
        expect(r.status, "response status").to.equal(200);
        expect(r, 'response').to.have.validJsonBody(); 
    });   
    return r;
}
