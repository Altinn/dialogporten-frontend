import { describe, expect, it } from 'vitest';
import { getSearchLabels, getSearchWords, pruneSearchValue } from './getSearchLabels.ts';

describe('getSearchLabels', () => {
  it('splits a multi-word search into one token per word', () => {
    expect(getSearchLabels('foo bar')).toEqual([
      { type: 'search', value: 'foo', label: 'foo' },
      { type: 'search', value: 'bar', label: 'bar' },
    ]);
  });

  it('returns a single token for an unquoted single word', () => {
    expect(getSearchLabels('foo')).toEqual([{ type: 'search', value: 'foo', label: 'foo' }]);
  });

  it('treats a fully quoted value as a single exact-phrase token', () => {
    expect(getSearchLabels('"foo bar"')).toEqual([{ type: 'search', value: '"foo bar"', label: 'foo bar' }]);
  });

  it('strips stray quotes when splitting unquoted values', () => {
    expect(getSearchLabels('foo" bar')).toEqual([
      { type: 'search', value: 'foo', label: 'foo' },
      { type: 'search', value: 'bar', label: 'bar' },
    ]);
  });

  it('trims surrounding whitespace and ignores empty tokens', () => {
    expect(getSearchLabels('  foo   bar  ')).toEqual([
      { type: 'search', value: 'foo', label: 'foo' },
      { type: 'search', value: 'bar', label: 'bar' },
    ]);
  });

  it('returns an empty array for an empty search value', () => {
    expect(getSearchLabels('')).toEqual([]);
  });

  it('does not treat a single quote character as a quoted phrase', () => {
    expect(getSearchLabels('"')).toEqual([]);
  });
});

describe('getSearchWords', () => {
  it('splits a multi-word search into one word per token', () => {
    expect(getSearchWords('foo bar')).toEqual(['foo', 'bar']);
  });

  it('keeps a fully quoted value as a single word', () => {
    expect(getSearchWords('"foo bar"')).toEqual(['foo bar']);
  });

  it('trims whitespace, strips stray quotes and ignores empty tokens', () => {
    expect(getSearchWords('  foo"   bar  ')).toEqual(['foo', 'bar']);
  });

  it('returns an empty array for an empty search value', () => {
    expect(getSearchWords('')).toEqual([]);
  });
});

describe('pruneSearchValue', () => {
  it('removes a single unbalanced quote', () => {
    expect(pruneSearchValue('foo"')).toEqual('foo');
  });

  it('keeps a balanced quoted phrase intact', () => {
    expect(pruneSearchValue('"foo bar"')).toEqual('"foo bar"');
  });

  it('leaves an unquoted value unchanged', () => {
    expect(pruneSearchValue('foo bar')).toEqual('foo bar');
  });

  it('keeps values with more than two quotes unchanged', () => {
    expect(pruneSearchValue('"foo" "bar"')).toEqual('"foo" "bar"');
  });
});
