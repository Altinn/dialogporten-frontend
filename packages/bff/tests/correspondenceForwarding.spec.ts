import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import config from '../src/config.ts';

vi.mock('axios', () => {
  const get = vi.fn();
  const isAxiosError = (e: unknown): boolean => !!(e as { isAxiosError?: boolean })?.isAxiosError;
  return { default: { get, isAxiosError }, isAxiosError };
});

vi.mock('@altinn/dialogporten-node-logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const CORRESPONDENCE_ID = '01a0cf07-7569-7011-a8bb-9d56748b1e88';
const CORRESPONDENCE_URL = `${config.platformBaseURL}/correspondence/api/v1/correspondence/${CORRESPONDENCE_ID}`;

const contextWithToken = (accessToken = 'enduser-token') =>
  ({ session: { get: () => ({ access_token: accessToken }) } }) as never;

const contextWithoutToken = () => ({ session: { get: () => undefined } }) as never;

const axiosError = (status?: number) =>
  Object.assign(new Error('request failed'), {
    isAxiosError: true,
    response: status ? { status, data: {} } : undefined,
  });

const get = axios.get as unknown as Mock;

const importSut = async () => (await import('../src/graphql/correspondence/service.ts')).checkCorrespondenceForwarding;

describe('checkCorrespondenceForwarding', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('allows forwarding and returns the forward endpoint when the correspondence allows it', async () => {
    get.mockResolvedValueOnce({ data: { allowForwarding: true } });
    const checkCorrespondenceForwarding = await importSut();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
      allowed: true,
      forwardUrl: `${CORRESPONDENCE_URL}/forward`,
    });
  });

  it('calls the check endpoint with the session token and without following redirects', async () => {
    get.mockResolvedValueOnce({ data: { allowForwarding: true } });
    const checkCorrespondenceForwarding = await importSut();
    await checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken('the-user-token'));

    const [url, options] = get.mock.calls[0];
    expect(url).toBe(`${CORRESPONDENCE_URL}/forward/check`);
    expect(options.headers.Authorization).toBe('Bearer the-user-token');
    expect(options.maxRedirects).toBe(0);
  });

  it('does not allow forwarding when the correspondence disallows it', async () => {
    get.mockResolvedValueOnce({ data: { allowForwarding: false } });
    const checkCorrespondenceForwarding = await importSut();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
      allowed: false,
      forwardUrl: null,
    });
  });

  it.each([{}, { allowForwarding: 'true' }, 'true', null])(
    'does not allow forwarding for the unexpected response body %j',
    async (data) => {
      get.mockResolvedValueOnce({ data });
      const checkCorrespondenceForwarding = await importSut();

      await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
        allowed: false,
        forwardUrl: null,
      });
    },
  );

  it.each([
    '',
    'not-a-uuid',
    '../../profile/api/v1/users/current',
    `${CORRESPONDENCE_ID}/../../profile`,
    `${CORRESPONDENCE_ID}?x=1`,
    `urn:altinn:correspondence-id:${CORRESPONDENCE_ID}`,
  ])('rejects %j without calling Correspondence', async (correspondenceId) => {
    const checkCorrespondenceForwarding = await importSut();

    await expect(checkCorrespondenceForwarding(correspondenceId, contextWithToken())).resolves.toEqual({
      allowed: false,
      forwardUrl: null,
    });
    expect(get).not.toHaveBeenCalled();
  });

  it('does not call Correspondence without a session token', async () => {
    const checkCorrespondenceForwarding = await importSut();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithoutToken())).resolves.toEqual({
      allowed: false,
      forwardUrl: null,
    });
    expect(get).not.toHaveBeenCalled();
  });

  it.each([401, 403])('does not allow forwarding and warns once when the token is rejected with %i', async (status) => {
    get.mockRejectedValueOnce(axiosError(status));
    const checkCorrespondenceForwarding = await importSut();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
      allowed: false,
      forwardUrl: null,
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
    const checkCorrespondenceForwarding = await importSut();

    await expect(checkCorrespondenceForwarding(CORRESPONDENCE_ID, contextWithToken())).resolves.toEqual({
      allowed: false,
      forwardUrl: null,
    });
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
