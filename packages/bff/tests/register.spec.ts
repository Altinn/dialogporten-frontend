import axios from 'axios';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

vi.mock('axios', () => {
  const post = vi.fn();
  const isAxiosError = (e: unknown): boolean => !!(e as { isAxiosError?: boolean })?.isAxiosError;
  return { default: { post, isAxiosError }, isAxiosError };
});

vi.mock('../src/auth/maskinporten.ts', () => ({
  getAltinnToken: vi.fn().mockResolvedValue('test-token'),
}));

const PARTY = 'urn:altinn:person:identifier-no:20815497741';

const makeAxiosError = (status: number, data: unknown) => ({
  isAxiosError: true,
  response: { status, data },
});

describe('setUsername', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns success on 200', async () => {
    (axios.post as unknown as Mock).mockResolvedValueOnce({ status: 200 });
    const { setUsername } = await import('../src/graphql/username/service.ts');
    await expect(setUsername(PARTY, 'ola.nordmann')).resolves.toEqual({ success: true });
  });

  it('maps 400 to the validation message', async () => {
    (axios.post as unknown as Mock).mockRejectedValueOnce(
      makeAxiosError(400, { validationErrors: [{ detail: 'Username too short' }] }),
    );
    const { setUsername } = await import('../src/graphql/username/service.ts');
    await expect(setUsername(PARTY, 'abc')).resolves.toEqual({ success: false, message: 'Username too short' });
  });

  it('maps 409 to username-in-use', async () => {
    (axios.post as unknown as Mock).mockRejectedValueOnce(makeAxiosError(409, {}));
    const { setUsername } = await import('../src/graphql/username/service.ts');
    await expect(setUsername(PARTY, 'ola.nordmann')).resolves.toEqual({
      success: false,
      message: 'Username is already in use by another party',
    });
  });

  it('maps 418 to managed-by-Altinn-2', async () => {
    (axios.post as unknown as Mock).mockRejectedValueOnce(makeAxiosError(418, {}));
    const { setUsername } = await import('../src/graphql/username/service.ts');
    await expect(setUsername(PARTY, 'ola.nordmann')).resolves.toEqual({
      success: false,
      message: 'Setting of usernames is currently managed by Altinn 2',
    });
  });
});
