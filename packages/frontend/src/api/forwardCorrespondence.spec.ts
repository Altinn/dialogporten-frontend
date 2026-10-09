import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forwardCorrespondence } from './forwardCorrespondence.ts';

const { forwardCorrespondenceMutation } = vi.hoisted(() => ({ forwardCorrespondenceMutation: vi.fn() }));

vi.mock('./queries.ts', () => ({
  graphQLSDK: { forwardCorrespondence: forwardCorrespondenceMutation },
}));

const CORRESPONDENCE_ID = '01a0cf07-7569-7011-a8bb-9d56748b1e88';
const KARI = 'kari@example.com';
const OLA = 'ola@example.com';

const response = (success: boolean, status: number | null = null, errorCode: number | null = null) => ({
  forwardCorrespondence: { success, status, errorCode },
});

const respondPerRecipient =
  (responses: Record<string, ReturnType<typeof response> | Error>) =>
  async ({ forwardTo }: { forwardTo: string }) => {
    const value = responses[forwardTo];
    if (value instanceof Error) {
      throw value;
    }
    return value;
  };

describe('forwardCorrespondence', () => {
  const refreshDialogToken = vi.fn<() => Promise<string | undefined>>();

  beforeEach(() => {
    forwardCorrespondenceMutation.mockReset();
    refreshDialogToken.mockReset();
  });

  it('sends one request per recipient with the dialog token', async () => {
    forwardCorrespondenceMutation.mockResolvedValue(response(true));

    const results = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: [KARI, OLA], forwardingText: 'Se denne' },
      'dialog-token',
      refreshDialogToken,
    );

    expect(results).toEqual([
      { forwardTo: KARI, ok: true },
      { forwardTo: OLA, ok: true },
    ]);
    expect(forwardCorrespondenceMutation).toHaveBeenCalledTimes(2);
    expect(forwardCorrespondenceMutation).toHaveBeenCalledWith({
      correspondenceId: CORRESPONDENCE_ID,
      forwardTo: KARI,
      forwardingText: 'Se denne',
      dialogToken: 'dialog-token',
    });
    expect(forwardCorrespondenceMutation).toHaveBeenCalledWith({
      correspondenceId: CORRESPONDENCE_ID,
      forwardTo: OLA,
      forwardingText: 'Se denne',
      dialogToken: 'dialog-token',
    });
    expect(refreshDialogToken).not.toHaveBeenCalled();
  });

  it('returns the outcome for each recipient separately', async () => {
    forwardCorrespondenceMutation.mockImplementation(
      respondPerRecipient({ [KARI]: response(true), [OLA]: response(false, 400, 1064) }),
    );

    const results = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: [KARI, OLA] },
      'token',
      refreshDialogToken,
    );

    expect(results).toEqual([
      { forwardTo: KARI, ok: true },
      { forwardTo: OLA, ok: false, status: 400, errorCode: 1064 },
    ]);
  });

  it('reports a failed request for that recipient without status or error code', async () => {
    forwardCorrespondenceMutation.mockImplementation(
      respondPerRecipient({ [KARI]: response(true), [OLA]: new Error('GraphQL error') }),
    );

    const results = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: [KARI, OLA] },
      'token',
      refreshDialogToken,
    );

    expect(results).toEqual([
      { forwardTo: KARI, ok: true },
      { forwardTo: OLA, ok: false },
    ]);
  });

  it('refreshes the dialog token once and retries only the recipients that got 401', async () => {
    forwardCorrespondenceMutation.mockImplementation(async ({ forwardTo, dialogToken }) => {
      if (dialogToken === 'stale-token' && forwardTo === OLA) {
        return response(false, 401);
      }
      return response(true);
    });
    refreshDialogToken.mockResolvedValueOnce('fresh-token');

    const results = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: [KARI, OLA] },
      'stale-token',
      refreshDialogToken,
    );

    expect(results).toEqual([
      { forwardTo: KARI, ok: true },
      { forwardTo: OLA, ok: true },
    ]);
    expect(refreshDialogToken).toHaveBeenCalledTimes(1);
    expect(forwardCorrespondenceMutation).toHaveBeenCalledTimes(3);
    expect(forwardCorrespondenceMutation.mock.calls[2][0]).toMatchObject({
      forwardTo: OLA,
      dialogToken: 'fresh-token',
    });
  });

  it('gives up after one retry', async () => {
    forwardCorrespondenceMutation.mockResolvedValue(response(false, 401));
    refreshDialogToken.mockResolvedValue('fresh-token');

    const results = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: [KARI] },
      'stale-token',
      refreshDialogToken,
    );

    expect(results).toEqual([{ forwardTo: KARI, ok: false, status: 401, errorCode: undefined }]);
    expect(forwardCorrespondenceMutation).toHaveBeenCalledTimes(2);
  });

  it('fetches a dialog token first when none is available', async () => {
    forwardCorrespondenceMutation.mockResolvedValue(response(true));
    refreshDialogToken.mockResolvedValueOnce('fresh-token');

    const results = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: [KARI] },
      undefined,
      refreshDialogToken,
    );

    expect(results).toEqual([{ forwardTo: KARI, ok: true }]);
    expect(forwardCorrespondenceMutation.mock.calls[0][0].dialogToken).toBe('fresh-token');
  });

  it('does not call the BFF without any dialog token', async () => {
    refreshDialogToken.mockResolvedValueOnce(undefined);

    const results = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: [KARI, OLA] },
      undefined,
      refreshDialogToken,
    );

    expect(results).toEqual([
      { forwardTo: KARI, ok: false, status: 401 },
      { forwardTo: OLA, ok: false, status: 401 },
    ]);
    expect(forwardCorrespondenceMutation).not.toHaveBeenCalled();
  });
});
