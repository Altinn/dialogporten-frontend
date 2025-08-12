/**
 * This module provides functionality to generate a session cookie for the Altinn arbeidsflate (AF) using a personal token.
 * It includes functions to get a personal token based on a PID and to initialize a session with that token.
 */
import http from 'k6/http';
import { afUrl } from './config.js';
import { getPersonalToken } from './token.js';

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
})();

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
 * Function to initialize a session with the given token.
 * @param {F} token 
 * @returns sessionId
 */
function getSessionId(token) {
  const url = new URL(`${afUrl}/api/init-session`);
  const body = JSON.stringify({
    token: token,
  });
  const params = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'systembruker-k6',
    },
  }
  const resp = http.post(url.toString(), body, params);
  if (resp.status !== 200) {
    console.log(resp.status_text);
    return null; // Handle error appropriately
  }
  const sessionId = resp.json().cookie.split('=')[1]; // Assuming the session ID is the first part of the response body 
  return sessionId // Replace with actual logic to get session ID
}

/**
 * Function to get a cookie object for the given PID.
 * @param {string} pid - The personal identification number (PID) of the user.
 * @return {Object} - The cookie object containing name, value, domain, path, httpOnly, secure, sameSite, and url.
 * **/
export function getCookie(pid) {
  var token = getToken(pid);
  const cookie = {
    name: "arbeidsflate",
    value: getSessionId(token),
    domain: afUrl.replace(/https?:\/\//, '').replace(/http?:\/\//, '').replace(/\/$/, ''), // Remove protocol and trailing slash
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "",
    url: ""
  }
  return cookie;
}