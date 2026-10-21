import * as ReactQuery from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, type RenderOptions, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper, customRender } from '../../../tests/test-utils.tsx';
import { EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { MainContentReference } from './MainContentReference.tsx';

const queryClient = new QueryClient();
const wrapper = createCustomWrapper(queryClient);
const mockDialogToken = 'mock-token';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('MainContentReference Component', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render markdown content', async () => {
    const mockContent = {
      url: 'https://altinn.mock/content',
      mediaType: EmbeddableMediaType.markdown,
    };

    const mockResponse = '# header ## subheader ### subsubheader';

    vi.spyOn(ReactQuery, 'useQuery').mockImplementation(
      vi.fn().mockReturnValue({ data: mockResponse, isLoading: false, isSuccess: true, isError: false }),
    );

    const { asFragment } = await waitFor(() =>
      customRender(
        <MainContentReference content={mockContent} dialogToken={mockDialogToken} id="test" dialogId="test" />,
        {
          wrapper,
        } as RenderOptions,
      ),
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render html content', async () => {
    const mockContent = {
      url: 'https://altinn.mock/content',
      mediaType: EmbeddableMediaType.html,
    };

    const mockResponse = '<html><body><h1>header 1</h1></body></html>';

    vi.spyOn(ReactQuery, 'useQuery').mockImplementation(
      vi.fn().mockReturnValue({ data: mockResponse, isLoading: false, isSuccess: true, isError: false }),
    );

    const { asFragment } = await waitFor(() =>
      customRender(
        <MainContentReference content={mockContent} dialogToken={mockDialogToken} id="test" dialogId="test" />,
        {
          wrapper,
        } as RenderOptions,
      ),
    );

    expect(asFragment()).toMatchSnapshot();
  });
  it('should post an embedded form back to the service owner with the dialog token', async () => {
    const mockContent = {
      url: 'https://altinn.mock/content',
      mediaType: EmbeddableMediaType.html,
    };

    const mockResponse = `<form method="post" action="https://altinn.mock/submit">
      <input name="enquiry" value="hello" />
      <button type="submit">Send</button>
    </form>`;

    vi.spyOn(ReactQuery, 'useQuery').mockImplementation(
      vi.fn().mockReturnValue({ data: mockResponse, isLoading: false, isSuccess: true, isError: false }),
    );

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    vi.stubGlobal('fetch', fetchMock);

    await waitFor(() =>
      customRender(
        <MainContentReference content={mockContent} dialogToken={mockDialogToken} id="test" dialogId="test" />,
        {
          wrapper,
        } as RenderOptions,
      ),
    );

    fireEvent.submit(await screen.findByRole('button', { name: 'Send' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://altinn.mock/submit');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(`Bearer ${mockDialogToken}`);
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(String(init.body)).toBe('enquiry=hello');
  });
});
