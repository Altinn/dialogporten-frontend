import * as ReactQuery from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { type RenderOptions, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createCustomWrapper, customRender } from '../../../tests/test-utils.tsx';
import { EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { UNAUTHORIZED_URL } from '../../constants/sentinelUrls.ts';
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

  it('should render the no access alert when the url is the unauthorized sentinel', async () => {
    const mockContent = {
      url: UNAUTHORIZED_URL,
      mediaType: EmbeddableMediaType.markdown,
    };

    vi.spyOn(ReactQuery, 'useQuery').mockImplementation(
      vi.fn().mockReturnValue({ data: undefined, isLoading: false, isSuccess: false, isError: false }),
    );

    const { getByText } = await waitFor(() =>
      customRender(
        <MainContentReference content={mockContent} dialogToken={mockDialogToken} id="test" dialogId="test" />,
        {
          wrapper,
        } as RenderOptions,
      ),
    );

    expect(getByText('Du har ikke tilgang til å se dette innholdet.')).toBeTruthy();
  });
});
