import { describe, expect, it } from 'vitest';
import { toTitleCase } from './name.ts';

describe('toTitleCase', () => {
  it('should return empty string for null input', () => {
    const result = toTitleCase(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined input', () => {
    const result = toTitleCase(undefined);
    expect(result).toBe('');
  });

  it('should return empty string for empty string input', () => {
    const result = toTitleCase('');
    expect(result).toBe('');
  });

  it('should capitalize single word', () => {
    const result = toTitleCase('hello');
    expect(result).toBe('Hello');
  });

  it('should capitalize multiple words', () => {
    const result = toTitleCase('hello world');
    expect(result).toBe('Hello World');
  });

  it('should handle words with dashes', () => {
    const result = toTitleCase('anna-maria');
    expect(result).toBe('Anna-Maria');
  });

  it('should handle multiple words with dashes', () => {
    const result = toTitleCase('anna-maria johnson-smith');
    expect(result).toBe('Anna-Maria Johnson-Smith');
  });

  it('should handle company case, "as" word', () => {
    const result = toTitleCase('john as smith');
    expect(result).toBe('John AS Smith');
  });
});
