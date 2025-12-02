import axios, { isAxiosError } from 'axios';
import http from 'node:http';
import https from 'node:https';
import config from './config.ts';

// Create custom HTTP agent with increased socket limits
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: config.httpClient.maxSockets,
  maxFreeSockets: config.httpClient.maxFreeSockets,
  timeout: config.httpClient.timeout,
});

// Create custom HTTPS agent with increased socket limits
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: config.httpClient.maxSockets,
  maxFreeSockets: config.httpClient.maxFreeSockets,
  timeout: config.httpClient.timeout,
});

// Create configured axios instance with custom agents
const httpClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: config.httpClient.requestTimeout,
});

// Export isAxiosError utility function
export { isAxiosError };
export default httpClient;

