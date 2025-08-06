import http from 'k6/http';
import { afUrl } from './config.js';

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

export function getCookie(token) {
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