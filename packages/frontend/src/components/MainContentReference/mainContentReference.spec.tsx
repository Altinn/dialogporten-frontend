import * as ReactQuery from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { type RenderOptions, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createCustomWrapper, customRender } from '../../../utils/test-utils.tsx';
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
      customRender(<MainContentReference content={mockContent} dialogToken={mockDialogToken} id="test" />, {
        wrapper,
      } as RenderOptions),
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
      customRender(<MainContentReference content={mockContent} dialogToken={mockDialogToken} id="test" />, {
        wrapper,
      } as RenderOptions),
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
