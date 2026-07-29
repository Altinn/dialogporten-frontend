import { QueryClient } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import i18n from 'i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../tests/test-utils.tsx';
import { EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { MainContentReference } from './MainContentReference.tsx';

describe('MainContentReference caching', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Hello'),
    });
    vi.stubGlobal('fetch', fetchSpy);
    await i18n.changeLanguage('nb');
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await i18n.changeLanguage('nb');
  });

  const contentFetchCalls = (spy: ReturnType<typeof vi.fn>, url: string) =>
    spy.mock.calls.filter((c: unknown[]) => c[0] === url) as [string, RequestInit][];

  const contentFetchCount = (spy: ReturnType<typeof vi.fn>, url: string) => contentFetchCalls(spy, url).length;

  const acceptLanguageOf = (call: [string, RequestInit]) =>
    (call[1].headers as Record<string, string>)['Accept-Language'];

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

  it('should send the selected language as Accept-Language', async () => {
    await i18n.changeLanguage('en');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createCustomWrapper(queryClient);
    const contentUrl = 'https://example.com/content';
    const content = { url: contentUrl, mediaType: EmbeddableMediaType.markdown };

    render(<MainContentReference content={content} dialogToken="token-1" id="dialog-1" dialogId="dialog-1" />, {
      wrapper,
    });

    await waitFor(() => expect(contentFetchCount(fetchSpy, contentUrl)).toBe(1));

    expect(acceptLanguageOf(contentFetchCalls(fetchSpy, contentUrl)[0])).toBe('en, nb;q=0.9, nn;q=0.8');
  });

  it('should re-fetch content when the language changes, and reuse the cache when switching back', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createCustomWrapper(queryClient);
    const contentUrl = 'https://example.com/content';
    const content = { url: contentUrl, mediaType: EmbeddableMediaType.markdown };

    render(<MainContentReference content={content} dialogToken="token-1" id="dialog-1" dialogId="dialog-1" />, {
      wrapper,
    });

    await waitFor(() => expect(contentFetchCount(fetchSpy, contentUrl)).toBe(1));

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    // The response varies by language, so a language switch must invalidate the cached content
    await waitFor(() => expect(contentFetchCount(fetchSpy, contentUrl)).toBe(2));
    const calls = contentFetchCalls(fetchSpy, contentUrl);
    expect(acceptLanguageOf(calls[0])).toBe('nb, nn;q=0.9, en;q=0.8');
    expect(acceptLanguageOf(calls[1])).toBe('en, nb;q=0.9, nn;q=0.8');

    await act(async () => {
      await i18n.changeLanguage('nb');
    });

    // Switching back hits the still-cached entry for the original language
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(contentFetchCount(fetchSpy, contentUrl)).toBe(2);
  });
});
