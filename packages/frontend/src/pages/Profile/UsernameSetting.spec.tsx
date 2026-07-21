import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { customRender } from '../../../tests/test-utils.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({ t: (key: string) => key })),
}));

const mockOpenSnackbar = vi.fn();
vi.mock('@altinn/altinn-components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@altinn/altinn-components')>();
  return { ...actual, useSnackbar: () => ({ openSnackbar: mockOpenSnackbar }) };
});

const mockSaveUsername = vi.fn();
vi.mock('./useUsername.tsx', () => ({
  useUsername: vi.fn(),
}));

import { UsernameSetting } from './UsernameSetting.tsx';
import { useUsername } from './useUsername.tsx';

const setupUsername = (username: string | null = null) => {
  (useUsername as Mock).mockReturnValue({
    username,
    isSaving: false,
    saveUsername: mockSaveUsername,
  });
};

describe('UsernameSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a hint before the user has interacted with the field', () => {
    setupUsername(null);
    customRender(<UsernameSetting partyUuid="party-1" />);

    expect(screen.getByText('profile.username.hint')).toBeTruthy();
  });

  it('shows a format error for an invalid username after blur', () => {
    setupUsername(null);
    customRender(<UsernameSetting partyUuid="party-1" />);

    const input = screen.getByLabelText('profile.username.input_label');
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.blur(input);

    expect(screen.getByText('profile.username.format_error')).toBeTruthy();
  });

  it('shows a success message for a valid, changed username', () => {
    setupUsername(null);
    customRender(<UsernameSetting partyUuid="party-1" />);

    const input = screen.getByLabelText('profile.username.input_label');
    fireEvent.change(input, { target: { value: 'ola.nordmann' } });
    fireEvent.blur(input);

    expect(screen.getByText('profile.username.valid')).toBeTruthy();
  });

  it('does not render a remove button when there is no existing username', () => {
    setupUsername(null);
    customRender(<UsernameSetting partyUuid="party-1" />);

    expect(screen.queryByRole('button', { name: 'profile.username.remove' })).toBeNull();
  });

  it('saves a valid username and shows a success snackbar', async () => {
    setupUsername(null);
    mockSaveUsername.mockResolvedValue({ success: true });
    customRender(<UsernameSetting partyUuid="party-1" />);

    const input = screen.getByLabelText('profile.username.input_label');
    fireEvent.change(input, { target: { value: 'ola.nordmann' } });
    fireEvent.click(screen.getByRole('button', { name: 'word.save' }));

    await waitFor(() => expect(mockSaveUsername).toHaveBeenCalledWith('ola.nordmann'));
    expect(mockOpenSnackbar).toHaveBeenCalledWith(expect.objectContaining({ message: 'profile.username.saved' }));
  });

  it('marks the username as taken when saving fails', async () => {
    setupUsername(null);
    mockSaveUsername.mockResolvedValue({ success: false });
    customRender(<UsernameSetting partyUuid="party-1" />);

    const input = screen.getByLabelText('profile.username.input_label');
    fireEvent.change(input, { target: { value: 'ola.nordmann' } });
    fireEvent.click(screen.getByRole('button', { name: 'word.save' }));

    await waitFor(() => expect(screen.getByText('profile.username.taken')).toBeTruthy());
  });

  it('does not call saveUsername when the format is invalid', () => {
    setupUsername(null);
    customRender(<UsernameSetting partyUuid="party-1" />);

    const input = screen.getByLabelText('profile.username.input_label');
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: 'word.save' }));

    expect(mockSaveUsername).not.toHaveBeenCalled();
  });

  it('removes an existing username and shows a success snackbar', async () => {
    setupUsername('ola.nordmann');
    mockSaveUsername.mockResolvedValue({ success: true });
    customRender(<UsernameSetting partyUuid="party-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'profile.username.remove' }));

    await waitFor(() => expect(mockSaveUsername).toHaveBeenCalledWith(null));
    expect(mockOpenSnackbar).toHaveBeenCalledWith(expect.objectContaining({ message: 'profile.username.removed' }));
  });
});
