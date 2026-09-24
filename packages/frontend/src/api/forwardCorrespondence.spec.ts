import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forwardCorrespondence } from './forwardCorrespondence.ts';

const { forwardCorrespondenceMutation } = vi.hoisted(() => ({ forwardCorrespondenceMutation: vi.fn() }));

vi.mock('./queries.ts', () => ({
  graphQLSDK: { forwardCorrespondence: forwardCorrespondenceMutation },
}));

const CORRESPONDENCE_ID = '01a0cf07-7569-7011-a8bb-9d56748b1e88';

const response = (success: boolean, status: number | null = null, errorCode: number | null = null) => ({
  forwardCorrespondence: { success, status, errorCode },
});

describe('forwardCorrespondence', () => {
  const refreshDialogToken = vi.fn<() => Promise<string | undefined>>();

  beforeEach(() => {
    forwardCorrespondenceMutation.mockReset();
    refreshDialogToken.mockReset();
  });

  it('sends the request and the dialog token to the BFF', async () => {
    forwardCorrespondenceMutation.mockResolvedValueOnce(response(true));

    const result = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: 'kari@example.com', forwardingText: 'Se denne' },
      'dialog-token',
      refreshDialogToken,
    );

    expect(result).toEqual({ ok: true });
    expect(forwardCorrespondenceMutation).toHaveBeenCalledWith({
      correspondenceId: CORRESPONDENCE_ID,
      forwardTo: 'kari@example.com',
      forwardingText: 'Se denne',
      dialogToken: 'dialog-token',
    });
    expect(refreshDialogToken).not.toHaveBeenCalled();
  });

  it('returns the status and error code when the forward fails', async () => {
    forwardCorrespondenceMutation.mockResolvedValueOnce(response(false, 400, 1064));

    const result = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: 'kari@example.com' },
      'token',
      refreshDialogToken,
    );

    expect(result).toEqual({ ok: false, status: 400, errorCode: 1064 });
  });

  it('reports a failed request without status or error code', async () => {
    forwardCorrespondenceMutation.mockRejectedValueOnce(new Error('GraphQL error'));

    const result = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: 'kari@example.com' },
      'token',
      refreshDialogToken,
    );

    expect(result).toEqual({ ok: false });
  });

  it('refreshes the dialog token and retries once when Correspondence answers 401', async () => {
    forwardCorrespondenceMutation.mockResolvedValueOnce(response(false, 401));
    forwardCorrespondenceMutation.mockResolvedValueOnce(response(true));
    refreshDialogToken.mockResolvedValueOnce('fresh-token');

    const result = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: 'kari@example.com' },
      'stale-token',
      refreshDialogToken,
    );

    expect(result).toEqual({ ok: true });
    expect(forwardCorrespondenceMutation).toHaveBeenCalledTimes(2);
    expect(forwardCorrespondenceMutation.mock.calls[1][0].dialogToken).toBe('fresh-token');
  });

  it('gives up after one retry', async () => {
    forwardCorrespondenceMutation.mockResolvedValue(response(false, 401));
    refreshDialogToken.mockResolvedValue('fresh-token');

    const result = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: 'kari@example.com' },
      'stale-token',
      refreshDialogToken,
    );

    expect(result).toMatchObject({ ok: false, status: 401 });
    expect(forwardCorrespondenceMutation).toHaveBeenCalledTimes(2);
  });

  it('fetches a dialog token first when none is available', async () => {
    forwardCorrespondenceMutation.mockResolvedValueOnce(response(true));
    refreshDialogToken.mockResolvedValueOnce('fresh-token');

    const result = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: 'kari@example.com' },
      undefined,
      refreshDialogToken,
    );

    expect(result).toEqual({ ok: true });
    expect(forwardCorrespondenceMutation.mock.calls[0][0].dialogToken).toBe('fresh-token');
  });

  it('does not call the BFF without any dialog token', async () => {
    refreshDialogToken.mockResolvedValueOnce(undefined);

    const result = await forwardCorrespondence(
      { correspondenceId: CORRESPONDENCE_ID, forwardTo: 'kari@example.com' },
      undefined,
      refreshDialogToken,
    );

    expect(result).toEqual({ ok: false, status: 401 });
    expect(forwardCorrespondenceMutation).not.toHaveBeenCalled();
  });
});
