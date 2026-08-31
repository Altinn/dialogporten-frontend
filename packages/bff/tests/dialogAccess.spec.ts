import axios from 'axios';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

vi.mock('axios', () => {
  const post = vi.fn();
  const isAxiosError = (e: unknown): boolean => !!(e as { isAxiosError?: boolean })?.isAxiosError;
  return { default: { post, isAxiosError }, isAxiosError };
});

const DIALOG_ID = '0198f0a1-2b3c-7d4e-8f90-1a2b3c4d5e6f';

const contextWithToken = (accessToken = 'enduser-token') =>
  ({ session: { get: () => ({ access_token: accessToken }) } }) as never;

const contextWithoutToken = () => ({ session: { get: () => undefined } }) as never;

const lookupResponse = (dialogId: string | null) => ({
  data: { data: { dialogLookup: { lookup: dialogId === null ? null : { dialogId } } } },
});

const importSut = async () => (await import('../src/graphql/shared/dialogAccess.ts')).assertDialogAccess;

describe('assertDialogAccess', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('resolves when the lookup returns the requested dialog', async () => {
    (axios.post as unknown as Mock).mockResolvedValueOnce(lookupResponse(DIALOG_ID));
    const assertDialogAccess = await importSut();
    await expect(assertDialogAccess(DIALOG_ID, contextWithToken())).resolves.toBeUndefined();
  });

  it('queries dialogLookup with the enduser token and the dialog-id urn', async () => {
    (axios.post as unknown as Mock).mockResolvedValueOnce(lookupResponse(DIALOG_ID));
    const assertDialogAccess = await importSut();
    await assertDialogAccess(DIALOG_ID, contextWithToken('the-user-token'));

    const [, body, options] = (axios.post as unknown as Mock).mock.calls[0];
    expect(body.variables).toEqual({ instanceRef: `urn:altinn:dialog-id:${DIALOG_ID}` });
    expect(options.headers.Authorization).toBe('Bearer the-user-token');
  });

  it('denies when lookup is null', async () => {
    (axios.post as unknown as Mock).mockResolvedValueOnce(lookupResponse(null));
    const assertDialogAccess = await importSut();
    await expect(assertDialogAccess(DIALOG_ID, contextWithToken())).rejects.toMatchObject({
      message: 'Not authorized to access this dialog',
      extensions: { code: 'UNAUTHORIZED', http: { status: 401 } },
    });
  });

  it('denies when the lookup returns a different dialog', async () => {
    (axios.post as unknown as Mock).mockResolvedValueOnce(lookupResponse('0198f0a1-0000-0000-0000-000000000000'));
    const assertDialogAccess = await importSut();
    await expect(assertDialogAccess(DIALOG_ID, contextWithToken())).rejects.toThrow(
      'Not authorized to access this dialog',
    );
  });

  it('accepts a case-insensitive dialogId match', async () => {
    (axios.post as unknown as Mock).mockResolvedValueOnce(lookupResponse(DIALOG_ID.toUpperCase()));
    const assertDialogAccess = await importSut();
    await expect(assertDialogAccess(DIALOG_ID, contextWithToken())).resolves.toBeUndefined();
  });

  it('denies when there is no session token', async () => {
    const assertDialogAccess = await importSut();
    await expect(assertDialogAccess(DIALOG_ID, contextWithoutToken())).rejects.toThrow(
      'Not authorized to access this dialog',
    );
    expect(axios.post as unknown as Mock).not.toHaveBeenCalled();
  });

  it('fails closed when the lookup returns GraphQL errors', async () => {
    (axios.post as unknown as Mock).mockResolvedValueOnce({ data: { errors: [{ message: 'boom' }] } });
    const assertDialogAccess = await importSut();
    await expect(assertDialogAccess(DIALOG_ID, contextWithToken())).rejects.toThrow(
      'Not authorized to access this dialog',
    );
  });

  it('fails closed when the lookup request throws', async () => {
    (axios.post as unknown as Mock).mockRejectedValueOnce({ isAxiosError: true, response: { status: 503 } });
    const assertDialogAccess = await importSut();
    await expect(assertDialogAccess(DIALOG_ID, contextWithToken())).rejects.toThrow(
      'Not authorized to access this dialog',
    );
  });
});
