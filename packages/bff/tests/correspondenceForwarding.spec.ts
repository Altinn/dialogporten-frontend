import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import config from '../src/config.ts';

vi.mock('axios', () => {
  const get = vi.fn();
  const post = vi.fn();
  const isAxiosError = (e: unknown): boolean => !!(e as { isAxiosError?: boolean })?.isAxiosError;
  return { default: { get, post, isAxiosError }, isAxiosError };
});

vi.mock('@altinn/dialogporten-node-logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const CORRESPONDENCE_ID = '01a0cf07-7569-7011-a8bb-9d56748b1e88';
const CORRESPONDENCE_URL = `${config.platformBaseURL}/correspondence/api/v1/correspondence/${CORRESPONDENCE_ID}`;
const FORWARD_TO = 'kari@example.com';
const FORWARDING_TEXT = 'Kan du se på denne?';

const contextWithToken = (accessToken = 'enduser-token') =>
  ({ session: { get: () => ({ access_token: accessToken }) } }) as never;

const contextWithoutToken = () => ({ session: { get: () => undefined } }) as never;

const axiosError = (status?: number, data: unknown = {}) =>
  Object.assign(new Error('request failed'), {
    isAxiosError: true,
    response: status ? { status, data } : undefined,
  });

const get = axios.get as unknown as Mock;
const post = axios.post as unknown as Mock;

const importService = async () => import('../src/graphql/correspondence/service.ts');

const invalidCorrespondenceIds = [
  '',
  'not-a-uuid',
  '../../profile/api/v1/users/current',
  `${CORRESPONDENCE_ID}/../../profile`,
  `${CORRESPONDENCE_ID}?x=1`,
  `urn:altinn:correspondence-id:${CORRESPONDENCE_ID}`,
];

describe('checkCorrespondenceForwarding', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('allows forwarding when the correspondence allows it', async () => {
    get.mockResolvedValueOnce({ data: { allowForwarding: true } });
    const { checkCorrespondenceForwarding } = await importService();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
      allowed: true,
    });
  });

  it('calls the check endpoint with the session token and without following redirects', async () => {
    get.mockResolvedValueOnce({ data: { allowForwarding: true } });
    const { checkCorrespondenceForwarding } = await importService();
    await checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken('the-user-token'));

    const [url, options] = get.mock.calls[0];
    expect(url).toBe(`${CORRESPONDENCE_URL}/forward/check`);
    expect(options.headers.Authorization).toBe('Bearer the-user-token');
    expect(options.maxRedirects).toBe(0);
  });

  it('does not allow forwarding when the correspondence disallows it', async () => {
    get.mockResolvedValueOnce({ data: { allowForwarding: false } });
    const { checkCorrespondenceForwarding } = await importService();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
      allowed: false,
    });
  });

  it.each([{}, { allowForwarding: 'true' }, 'true', null])(
    'does not allow forwarding for the unexpected response body %j',
    async (data) => {
      get.mockResolvedValueOnce({ data });
      const { checkCorrespondenceForwarding } = await importService();

      await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
        allowed: false,
      });
    },
  );

  it.each(invalidCorrespondenceIds)('rejects %j without calling Correspondence', async (correspondenceId) => {
    const { checkCorrespondenceForwarding } = await importService();

    await expect(checkCorrespondenceForwarding(correspondenceId, contextWithToken())).resolves.toEqual({
      allowed: false,
    });
    expect(get).not.toHaveBeenCalled();
  });

  it('does not call Correspondence without a session token', async () => {
    const { checkCorrespondenceForwarding } = await importService();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithoutToken())).resolves.toEqual({
      allowed: false,
    });
    expect(get).not.toHaveBeenCalled();
  });

  it.each([401, 403])('does not allow forwarding and warns once when the token is rejected with %i', async (status) => {
    get.mockRejectedValueOnce(axiosError(status));
    const { checkCorrespondenceForwarding } = await importService();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
      allowed: false,
    });
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith({ status, correspondenceId: CORRESPONDENCE_ID }, expect.any(String));
  });

  it.each([
    ['a 404', axiosError(404)],
    ['a 500', axiosError(500)],
    ['a redirect', axiosError(302)],
    ['a network error', axiosError()],
    ['a non-axios error', new Error('boom')],
  ])('does not allow forwarding and stays quiet on %s', async (_label, error) => {
    get.mockRejectedValueOnce(error);
    const { checkCorrespondenceForwarding } = await importService();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
      allowed: false,
    });
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('forwardCorrespondence', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  const args = (overrides: Record<string, unknown> = {}) => ({
    correspondenceId: CORRESPONDENCE_ID,
    dialogToken: 'the-dialog-token',
    forwardTo: FORWARD_TO,
    forwardingText: FORWARDING_TEXT,
    ...overrides,
  });

  it('posts the recipient and message to Correspondence with the dialog token', async () => {
    post.mockResolvedValueOnce({ data: '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b' });
    const { forwardCorrespondence } = await importService();

    await expect(forwardCorrespondence(args())).resolves.toEqual({ success: true, status: null, errorCode: null });

    const [url, body, options] = post.mock.calls[0];
    expect(url).toBe(`${CORRESPONDENCE_URL}/forward`);
    expect(body).toEqual({ forwardTo: FORWARD_TO, forwardingText: FORWARDING_TEXT });
    expect(options.headers.Authorization).toBe('Bearer the-dialog-token');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.maxRedirects).toBe(0);
  });

  it.each([undefined, null, ''])('leaves out the forwarding text when it is %j', async (forwardingText) => {
    post.mockResolvedValueOnce({ data: 'id' });
    const { forwardCorrespondence } = await importService();

    await forwardCorrespondence(args({ forwardingText }));

    expect(post.mock.calls[0][1]).toEqual({ forwardTo: FORWARD_TO });
  });

  it.each(invalidCorrespondenceIds)('rejects the correspondence id %j without calling Correspondence', async (id) => {
    const { forwardCorrespondence } = await importService();

    await expect(forwardCorrespondence(args({ correspondenceId: id }))).resolves.toEqual({
      success: false,
      status: null,
      errorCode: null,
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('does not call Correspondence without a dialog token', async () => {
    const { forwardCorrespondence } = await importService();

    await expect(forwardCorrespondence(args({ dialogToken: '' }))).resolves.toMatchObject({ success: false });
    expect(post).not.toHaveBeenCalled();
  });

  it.each([
    [{ errorCode: 1064 }, 1064],
    [{ errorCode: '1065' }, 1065],
  ])('returns the Correspondence error code from %j without logging', async (problem, errorCode) => {
    post.mockRejectedValueOnce(axiosError(400, problem));
    const { forwardCorrespondence } = await importService();

    await expect(forwardCorrespondence(args())).resolves.toEqual({ success: false, status: 400, errorCode });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns 401 without logging so the client can retry with a fresh dialog token', async () => {
    post.mockRejectedValueOnce(axiosError(401, ''));
    const { forwardCorrespondence } = await importService();

    await expect(forwardCorrespondence(args())).resolves.toEqual({ success: false, status: 401, errorCode: null });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([
    ['a 500', axiosError(500, 'oops'), 500],
    ['a network error', axiosError(), null],
    ['a non-axios error', new Error('boom'), null],
  ])('logs %s without the recipient, message or token', async (_label, error, status) => {
    post.mockRejectedValueOnce(error);
    const { forwardCorrespondence } = await importService();

    await expect(forwardCorrespondence(args())).resolves.toEqual({ success: false, status, errorCode: null });
    expect(logger.error).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify((logger.error as Mock).mock.calls[0]);
    expect(logged).not.toContain(FORWARD_TO);
    expect(logged).not.toContain(FORWARDING_TEXT);
    expect(logged).not.toContain('the-dialog-token');
  });
});
