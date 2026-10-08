import type { Redis } from 'ioredis';
import { describe, expect, it, vi } from 'vitest';
import { RevocableRedisStore } from '../src/auth/sessionStore.ts';

describe('session-store errors', () => {
  it.each([
    null,
    [
      [new Error('command failed'), null],
      [null, 1],
    ],
  ])('reports failed Redis transactions: %j', async (result) => {
    const multi = {
      set: vi.fn().mockReturnThis(),
      del: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(result),
    };
    const store = new RevocableRedisStore({ multi: () => multi } as unknown as Redis);
    await expect(
      new Promise((resolve, reject) =>
        store.destroy('test-session', (error) => (error ? reject(error) : resolve(null))),
      ),
    ).rejects.toThrow('Redis session operation failed');
  });

  it('does not expose token-bearing Redis errors to callers or logging', async () => {
    const error = Object.assign(new Error('Redis error'), { command: { args: ['private-refresh-token'] } });
    const store = new RevocableRedisStore({ get: vi.fn().mockRejectedValue(error) } as unknown as Redis);
    const result = await new Promise((resolve) => store.get('test-session', (error) => resolve(error)));
    expect(result).toEqual(new Error('Redis session operation failed'));
    expect(JSON.stringify(result)).not.toContain('private-refresh-token');
  });
});
