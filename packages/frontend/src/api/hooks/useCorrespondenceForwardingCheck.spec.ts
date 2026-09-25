import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../tests/test-utils.tsx';
import {
  getCorrespondenceIdFromInstanceRef,
  useCorrespondenceForwardingCheck,
} from './useCorrespondenceForwardingCheck.ts';

const { dialogAccessInfo, correspondenceForwardingCheck } = vi.hoisted(() => ({
  dialogAccessInfo: vi.fn(),
  correspondenceForwardingCheck: vi.fn(),
}));

vi.mock('../queries.ts', () => ({
  graphQLSDK: { dialogAccessInfo, correspondenceForwardingCheck },
}));

const DIALOG_ID = '01a0cf07-7569-729c-bf1f-9707f5f43512';
const CORRESPONDENCE_ID = '01a0cf07-7569-7011-a8bb-9d56748b1e88';

const lookup = (instanceRef: string) => ({ dialogLookup: { lookup: { instanceRef }, errors: [] } });

describe('getCorrespondenceIdFromInstanceRef', () => {
  it('returns the correspondence id from a correspondence instance ref', () => {
    expect(getCorrespondenceIdFromInstanceRef(`urn:altinn:correspondence-id:${CORRESPONDENCE_ID}`)).toBe(
      CORRESPONDENCE_ID,
    );
  });

  it.each([
    undefined,
    null,
    '',
    `urn:altinn:dialog-id:${DIALOG_ID}`,
    `urn:altinn:instance-id:51234567/${CORRESPONDENCE_ID}`,
    'urn:altinn:correspondence-id:not-a-uuid',
    `urn:altinn:correspondence-id:${CORRESPONDENCE_ID}/forward`,
  ])('returns undefined for %j', (instanceRef) => {
    expect(getCorrespondenceIdFromInstanceRef(instanceRef)).toBeUndefined();
  });
});

describe('useCorrespondenceForwardingCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks forwarding for the correspondence id resolved from the dialog lookup', async () => {
    dialogAccessInfo.mockResolvedValue(lookup(`urn:altinn:correspondence-id:${CORRESPONDENCE_ID}`));
    correspondenceForwardingCheck.mockResolvedValue({
      correspondenceForwardingCheck: { allowed: true },
    });

    const { result } = renderHook(() => useCorrespondenceForwardingCheck(DIALOG_ID), {
      wrapper: createCustomWrapper(),
    });

    await waitFor(() => expect(result.current.allowed).toBe(true));
    expect(result.current.correspondenceId).toBe(CORRESPONDENCE_ID);
    expect(dialogAccessInfo).toHaveBeenCalledWith({ instanceRef: `urn:altinn:dialog-id:${DIALOG_ID}` });
    expect(correspondenceForwardingCheck).toHaveBeenCalledWith({ correspondenceId: CORRESPONDENCE_ID });
  });

  it('reports not allowed when the check says so', async () => {
    dialogAccessInfo.mockResolvedValue(lookup(`urn:altinn:correspondence-id:${CORRESPONDENCE_ID}`));
    correspondenceForwardingCheck.mockResolvedValue({
      correspondenceForwardingCheck: { allowed: false },
    });

    const { result } = renderHook(() => useCorrespondenceForwardingCheck(DIALOG_ID), {
      wrapper: createCustomWrapper(),
    });

    await waitFor(() => expect(correspondenceForwardingCheck).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.allowed).toBe(false);
    expect(result.current.correspondenceId).toBe(CORRESPONDENCE_ID);
  });

  it('does not run the check when the dialog is not a correspondence', async () => {
    dialogAccessInfo.mockResolvedValue(lookup(`urn:altinn:dialog-id:${DIALOG_ID}`));

    const { result } = renderHook(() => useCorrespondenceForwardingCheck(DIALOG_ID), {
      wrapper: createCustomWrapper(),
    });

    await waitFor(() => expect(dialogAccessInfo).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.allowed).toBe(false);
    expect(correspondenceForwardingCheck).not.toHaveBeenCalled();
  });

  it('does nothing while disabled', () => {
    const { result } = renderHook(() => useCorrespondenceForwardingCheck(DIALOG_ID, { enabled: false }), {
      wrapper: createCustomWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(dialogAccessInfo).not.toHaveBeenCalled();
    expect(correspondenceForwardingCheck).not.toHaveBeenCalled();
  });
});
