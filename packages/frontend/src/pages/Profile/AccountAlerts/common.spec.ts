import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../../tests/test-utils.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({ t: (key: string) => key })),
}));

const mockOpenSnackbar = vi.fn();
vi.mock('@altinn/altinn-components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@altinn/altinn-components')>();
  return { ...actual, useSnackbar: () => ({ openSnackbar: mockOpenSnackbar }) };
});

const mockSendVerificationCode = vi.fn();
const mockVerifyAddress = vi.fn();
vi.mock('../../../api/queries.ts', () => ({
  sendVerificationCode: (...args: unknown[]) => mockSendVerificationCode(...args),
  verifyAddress: (...args: unknown[]) => mockVerifyAddress(...args),
}));

const mockUseVerifiedAddresses = vi.fn();
vi.mock('../useVerifiedAddresses.tsx', () => ({
  useVerifiedAddresses: (...args: unknown[]) => mockUseVerifiedAddresses(...args),
}));

import { useIsAlreadyVerified, useResendCooldown, useVerificationFlow } from './common.ts';

describe('useResendCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('starts at zero', () => {
    const { result } = renderHook(() => useResendCooldown());
    expect(result.current.cooldown).toBe(0);
  });

  it('start sets the cooldown and ticks down every second', () => {
    const { result } = renderHook(() => useResendCooldown());

    act(() => {
      result.current.start(3);
    });
    expect(result.current.cooldown).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.cooldown).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.cooldown).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.cooldown).toBe(0);
  });

  it('start defaults to DEFAULT_RESEND_COOLDOWN_SECONDS when no value given', () => {
    const { result } = renderHook(() => useResendCooldown());
    act(() => {
      result.current.start();
    });
    expect(result.current.cooldown).toBe(60);
  });

  it('reset zeroes the cooldown', () => {
    const { result } = renderHook(() => useResendCooldown());
    act(() => {
      result.current.start(30);
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.cooldown).toBe(0);
  });
});

describe('useIsAlreadyVerified', () => {
  beforeEach(() => {
    mockUseVerifiedAddresses.mockReturnValue({
      verifiedAddresses: [
        { value: 'Test@Example.com', addressType: 'Email' },
        { value: '+4712345678', addressType: 'Sms' },
      ],
    });
  });

  it('matches value case-insensitively for the same channel', () => {
    const { result } = renderHook(() => useIsAlreadyVerified());
    expect(result.current('test@example.com', 'Email')).toBe(true);
    expect(result.current('TEST@EXAMPLE.COM', 'Email')).toBe(true);
  });

  it('does not match when the channel differs', () => {
    const { result } = renderHook(() => useIsAlreadyVerified());
    expect(result.current('test@example.com', 'Sms')).toBe(false);
  });

  it('does not match an unverified value', () => {
    const { result } = renderHook(() => useIsAlreadyVerified());
    expect(result.current('unknown@example.com', 'Email')).toBe(false);
  });
});

describe('useVerificationFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockUseVerifiedAddresses.mockReturnValue({ verifiedAddresses: [] });
  });

  const renderFlow = () => renderHook(() => useVerificationFlow('Email'), { wrapper: createCustomWrapper() });

  it('handleSendCode enters verification flow and starts cooldown on success', async () => {
    mockSendVerificationCode.mockResolvedValue({ sendVerificationCode: { success: true, retryAfter: 45 } });
    const { result } = renderFlow();

    await act(async () => {
      await result.current.handleSendCode('test@example.com');
    });

    expect(mockSendVerificationCode).toHaveBeenCalledWith({ value: 'test@example.com', type: 'Email' });
    expect(result.current.isInVerificationFlow).toBe(true);
    expect(result.current.cooldown).toBe(45);
    expect(result.current.isSending).toBe(false);
    expect(mockOpenSnackbar).not.toHaveBeenCalled();
  });

  it('handleSendCode enters verification flow when only retryAfter is present', async () => {
    mockSendVerificationCode.mockResolvedValue({ sendVerificationCode: { retryAfter: 10 } });
    const { result } = renderFlow();

    await act(async () => {
      await result.current.handleSendCode('test@example.com');
    });

    expect(result.current.isInVerificationFlow).toBe(true);
  });

  it('handleSendCode shows an error snackbar when the response is unsuccessful', async () => {
    mockSendVerificationCode.mockResolvedValue({ sendVerificationCode: { success: false } });
    const { result } = renderFlow();

    await act(async () => {
      await result.current.handleSendCode('test@example.com');
    });

    expect(result.current.isInVerificationFlow).toBe(false);
    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'profile.account_alerts.snackbar.error', color: 'danger' }),
    );
  });

  it('handleSendCode shows an error snackbar when the request throws', async () => {
    mockSendVerificationCode.mockRejectedValue(new Error('network error'));
    const { result } = renderFlow();

    await act(async () => {
      await result.current.handleSendCode('test@example.com');
    });

    expect(result.current.isInVerificationFlow).toBe(false);
    expect(result.current.isSending).toBe(false);
    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'profile.account_alerts.snackbar.error', color: 'danger' }),
    );
  });

  it('handleConfirmCode exits verification flow on success', async () => {
    mockVerifyAddress.mockResolvedValue({ verifyAddress: { success: true } });
    const { result } = renderFlow();

    act(() => {
      result.current.setIsInVerificationFlow(true);
      result.current.setCodeInput('123456');
    });

    await act(async () => {
      await result.current.handleConfirmCode('test@example.com');
    });

    expect(mockVerifyAddress).toHaveBeenCalledWith({
      value: 'test@example.com',
      type: 'Email',
      verificationCode: '123456',
    });
    await waitFor(() => expect(result.current.isInVerificationFlow).toBe(false));
    expect(result.current.codeError).toBe('');
  });

  it('handleConfirmCode sets a code error when verification is unsuccessful', async () => {
    mockVerifyAddress.mockResolvedValue({ verifyAddress: { success: false } });
    const { result } = renderFlow();

    act(() => {
      result.current.setIsInVerificationFlow(true);
    });

    await act(async () => {
      await result.current.handleConfirmCode('test@example.com');
    });

    expect(result.current.isInVerificationFlow).toBe(true);
    expect(result.current.codeError).toBe('profile.verification.code_invalid');
  });

  it('handleConfirmCode shows an error snackbar when the request throws', async () => {
    mockVerifyAddress.mockRejectedValue(new Error('network error'));
    const { result } = renderFlow();

    await act(async () => {
      await result.current.handleConfirmCode('test@example.com');
    });

    expect(result.current.isConfirming).toBe(false);
    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'profile.account_alerts.snackbar.error', color: 'danger' }),
    );
  });
});
