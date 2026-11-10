import { afterEach, describe, expect, it, vi } from 'vitest';
import { collapseSlashes, normalizePathSlashes } from './normalizePathSlashes.ts';

const setUrl = (pathAndQuery: string, state: unknown = null) => {
  window.history.replaceState(state, '', `${window.location.origin}${pathAndQuery}`);
};

describe('collapseSlashes', () => {
  it.each([
    ['//inbox/abc/', '/inbox/abc/'],
    ['///inbox/abc', '/inbox/abc'],
    ['/inbox//abc/', '/inbox/abc/'],
    ['//', '/'],
    ['/inbox/abc/', '/inbox/abc/'],
    ['/', '/'],
  ])('%s -> %s', (input, expected) => {
    expect(collapseSlashes(input)).toBe(expected);
  });
});

describe('normalizePathSlashes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setUrl('/');
  });

  it('rewrites a protocol-relative looking path on the same origin, keeping query, hash and state', () => {
    const state = { usr: null, key: 'abc', idx: 0 };
    setUrl('//inbox/abc/?party=urn%3Aaltinn%3Aorganization%3Aidentifier-no%3A123456789#top', state);

    normalizePathSlashes();

    expect(window.location.pathname).toBe('/inbox/abc/');
    expect(window.location.search).toBe('?party=urn%3Aaltinn%3Aorganization%3Aidentifier-no%3A123456789');
    expect(window.location.hash).toBe('#top');
    expect(window.history.state).toEqual(state);
  });

  it('leaves a clean path untouched', () => {
    setUrl('/inbox/abc/?party=x');
    const spy = vi.spyOn(window.history, 'replaceState');

    normalizePathSlashes();

    expect(spy).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/inbox/abc/');
  });
});
