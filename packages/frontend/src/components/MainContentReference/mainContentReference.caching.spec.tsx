import { QueryClient } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../tests/test-utils.tsx';
import { EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { MainContentReference } from './MainContentReference.tsx';

describe('MainContentReference caching', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Hello'),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const contentFetchCount = (spy: ReturnType<typeof vi.fn>, url: string) =>
    spy.mock.calls.filter((c: unknown[]) => c[0] === url).length;

  it('should not re-fetch content when dialogToken changes', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createCustomWrapper(queryClient);
    const contentUrl = 'https://example.com/content';
    const content = { url: contentUrl, mediaType: EmbeddableMediaType.markdown };

    const { rerender } = render(
      <MainContentReference content={content} dialogToken="token-1" id="dialog-1" dialogId="dialog-1" />,
      { wrapper },
    );

    await waitFor(() => expect(contentFetchCount(fetchSpy, contentUrl)).toBe(1));

    // Re-render with a new token (simulates dialog refetch generating a new token)
    rerender(<MainContentReference content={content} dialogToken="token-2" id="dialog-1" dialogId="dialog-1" />);

    // Allow any pending queries to fire
    await new Promise((resolve) => setTimeout(resolve, 50));

    // staleTime: Infinity ensures content is fetched exactly once per dialog visit
    expect(contentFetchCount(fetchSpy, contentUrl)).toBe(1);
  });
});
