import { waitFor } from '@testing-library/react';
import 'web-streams-polyfill/es6';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { customRender } from '../../../tests/test-utils.tsx';
import App from '../../App.tsx';
import { server } from '../../mocks/node.ts';
import { isDialogPreviewAvailable } from './availability.ts';

vi.mock('./availability.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./availability.ts')>()),
  isDialogPreviewAvailable: vi.fn(),
}));

describe('dialog builder routes', () => {
  beforeAll(() => {
    server.listen();
    HTMLDialogElement.prototype.show = vi.fn();
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('serves the builder where it is available', async () => {
    vi.mocked(isDialogPreviewAvailable).mockReturnValue(true);
    const { findByRole } = customRender(<App />, { initialEntries: ['/dialog-builder'] });

    expect(await findByRole('heading', { name: 'Dialogbygger' })).toBeTruthy();
  });

  it('does not serve the builder elsewhere', async () => {
    vi.mocked(isDialogPreviewAvailable).mockReturnValue(false);
    const { queryByRole, getByRole } = customRender(<App />, { initialEntries: ['/dialog-builder'] });

    await waitFor(() => expect(getByRole('main')).toBeTruthy());
    expect(queryByRole('heading', { name: 'Dialogbygger' })).toBeNull();
  });

  it('does not serve the preview elsewhere', async () => {
    vi.mocked(isDialogPreviewAvailable).mockReturnValue(false);
    const { queryByText, getByRole } = customRender(<App />, {
      initialEntries: ['/inbox/preview?dialog=abc'],
    });

    await waitFor(() => expect(getByRole('main')).toBeTruthy());
    expect(queryByText('Ingen dialog å vise')).toBeNull();
    expect(queryByText('Dialogen kan ikke vises')).toBeNull();
  });
});
