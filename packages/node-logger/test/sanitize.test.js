import assert from 'node:assert/strict';
import { test } from 'node:test';
import pino from 'pino';
import { sanitize, sanitizeOptions, sanitizeRecord, scrubString } from '../dist/sanitize.js';

const fakeJwt = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJl';
const fakeRefreshToken = 'fake-refresh-token-value';
const fakeClientSecret = 'fake-client-secret-value';
const fakeBasic = Buffer.from(`client:${fakeClientSecret}`).toString('base64');
const fakePid = '01010112345';
const secrets = [fakeJwt, fakeRefreshToken, fakeClientSecret, fakeBasic, fakePid];

const createLogger = (bindings) => {
  const lines = [];
  const logger = pino({ level: 'trace', ...sanitizeOptions }, { write: (line) => lines.push(line) });
  return { logger: bindings ? logger.child(sanitizeRecord(bindings)) : logger, lines };
};

const assertNoSecrets = (output) => {
  for (const secret of secrets) {
    assert.ok(!output.includes(secret), `output leaked ${secret}: ${output}`);
  }
};

const createAxiosError = () => {
  const config = {
    method: 'post',
    baseURL: 'https://idp.example',
    url: `/token?id_token_hint=${fakeJwt}`,
    headers: { Authorization: `Basic ${fakeBasic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    data: `grant_type=refresh_token&refresh_token=${fakeRefreshToken}&client_secret=${fakeClientSecret}`,
  };
  const request = { _header: `POST /token HTTP/1.1\r\nAuthorization: Basic ${fakeBasic}\r\n` };
  const response = {
    status: 401,
    data: { error: 'invalid_grant', access_token: fakeJwt, pid: fakePid },
    headers: { 'set-cookie': [`session=${fakeRefreshToken}`] },
    config,
    request,
  };
  request.res = response;
  const error = new Error('Request failed with status code 401');
  error.name = 'AxiosError';
  return Object.assign(error, { isAxiosError: true, code: 'ERR_BAD_REQUEST', config, request, response });
};

const createQueryFailedError = () => {
  class QueryFailedError extends Error {}
  const error = new QueryFailedError('duplicate key value violates unique constraint "profile_pkey"');
  return Object.assign(error, {
    query: 'INSERT INTO "profile"("pid") VALUES ($1)',
    parameters: [fakePid],
    driverError: { code: '23505', detail: `Key (pid)=(${fakePid}) already exists.` },
  });
};

test('axios errors are reduced to an allowlist', () => {
  const { logger, lines } = createLogger();
  logger.error(createAxiosError(), 'Unable to refresh token');

  assertNoSecrets(lines[0]);
  const { err, msg } = JSON.parse(lines[0]);
  assert.equal(msg, 'Unable to refresh token');
  assert.deepEqual(Object.keys(err).sort(), ['code', 'message', 'method', 'stack', 'status', 'type', 'url']);
  assert.equal(err.message, 'Request failed with status code 401');
  assert.equal(err.code, 'ERR_BAD_REQUEST');
  assert.equal(err.method, 'POST');
  assert.equal(err.url, 'https://idp.example/token');
  assert.equal(err.status, 401);
});

test('database errors do not expose query parameters', () => {
  const { logger, lines } = createLogger();
  logger.error({ err: createQueryFailedError() }, 'Failed to add favorite party:');

  assertNoSecrets(lines[0]);
  const { err } = JSON.parse(lines[0]);
  assert.equal(err.type, 'QueryFailedError');
  assert.equal(err.code, '23505');
  assert.equal(err.parameters, undefined);
  assert.equal(err.query, undefined);
});

test('errors are sanitized under any key and through causes', () => {
  const { logger, lines } = createLogger();
  const wrapped = new Error(`Lookup failed for ${fakePid}`, { cause: createAxiosError() });
  logger.warn({ error: createAxiosError(), nested: { failure: wrapped } }, 'Upstream failed');

  assertNoSecrets(lines[0]);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.error.url, 'https://idp.example/token');
  assert.equal(parsed.nested.failure.message, 'Lookup failed for [REDACTED]');
  assert.equal(parsed.nested.failure.cause.status, 401);
});

test('the implicit message from an error is scrubbed', () => {
  const { logger, lines } = createLogger();
  logger.error(new Error(`No profile for ${fakePid}`));
  logger.error({ err: new Error(`Bearer ${fakeJwt} rejected`) });

  assertNoSecrets(lines.join(''));
  assert.equal(JSON.parse(lines[0]).msg, 'No profile for [REDACTED]');
  assert.equal(JSON.parse(lines[1]).msg, 'Bearer [REDACTED] rejected');
});

test('sensitive keys are redacted at any depth', () => {
  const { logger, lines } = createLogger();
  logger.info(
    {
      status: 400,
      data: {
        session: { token: { access_token: fakeJwt }, refresh_token: fakeRefreshToken },
        headers: { Authorization: `Bearer ${fakeJwt}`, 'Set-Cookie': fakeRefreshToken },
        user: [{ pid: fakePid, client_secret: fakeClientSecret, name: 'Test' }],
      },
    },
    'Upstream body',
  );

  assertNoSecrets(lines[0]);
  const { status, data } = JSON.parse(lines[0]);
  assert.equal(status, 400);
  assert.equal(data.session.token, '[REDACTED]');
  assert.equal(data.user[0].pid, '[REDACTED]');
  assert.equal(data.user[0].name, 'Test');
});

test('messages, format arguments and bindings are scrubbed', () => {
  const { logger, lines } = createLogger({ party: `urn:altinn:person:identifier-no:${fakePid}` });
  logger.error(`Error handling request GET /api/cb?code=${fakeRefreshToken}&state=${fakeClientSecret}`);
  logger.info('Token %s for %o', fakeJwt, { pid: fakePid });

  assertNoSecrets(lines.join(''));
  const first = JSON.parse(lines[0]);
  assert.equal(first.msg, 'Error handling request GET /api/cb?code=[REDACTED]&state=[REDACTED]');
  assert.equal(first.party, 'urn:altinn:person:identifier-no:[REDACTED]');
  assert.equal(first.pid, process.pid);
});

test('ordinary values pass through unchanged', () => {
  const date = new Date('2026-01-01T00:00:00.000Z');
  const value = {
    partyId: 51234567,
    orgnr: '991825827',
    traceId: '0af7651916cd43dd8448eb211c80319c',
    id: '019a2b3c-4d5e-7f60-8123-456789012345',
    epochMs: 1767225600000,
    phone: '+4799999999',
    date,
    list: [1, 'two', null, true],
  };

  assert.deepEqual(sanitize(value), { ...value, date: date.toISOString() });
  assert.equal(scrubString('Request failed with status code 500'), 'Request failed with status code 500');
  assert.equal(
    scrubString('Party 51234567 already exists in group favorites'),
    'Party 51234567 already exists in group favorites',
  );
});

test('circular and very deep structures do not throw', () => {
  const circular = { name: 'loop' };
  circular.self = circular;
  let deep = { leaf: true };
  for (let i = 0; i < 50; i++) {
    deep = { deep };
  }

  assert.deepEqual(sanitize(circular), { name: 'loop', self: '[Circular]' });
  assert.ok(JSON.stringify(sanitize(deep)).includes('[Truncated]'));
});
