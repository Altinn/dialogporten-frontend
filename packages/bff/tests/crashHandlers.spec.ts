import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fatal } = vi.hoisted(() => ({ fatal: vi.fn() }));

vi.mock('@altinn/dialogporten-node-logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@altinn/dialogporten-node-logger')>()),
  logger: { fatal },
}));

import { crashLine, exitAfterCrash, registerCrashHandlers } from '../src/crashHandlers.ts';

const clientCredentials = 'Y2xpZW50OnN1cGVyLXNlY3JldA==';
const refreshToken = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJl';

const refreshError = () =>
  Object.assign(new Error('Request failed with status code 400'), {
    isAxiosError: true,
    config: {
      method: 'post',
      url: 'https://idporten.example/token',
      headers: { Authorization: `Basic ${clientCredentials}` },
      data: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    },
    response: { status: 400, data: { error: 'invalid_grant' } },
  });

describe('crashLine', () => {
  it('keeps the error summary and drops credentials from an axios error', () => {
    const line = crashLine('Unhandled promise rejection', refreshError());

    expect(line).not.toContain(clientCredentials);
    expect(line).not.toContain(refreshToken);
    expect(line.endsWith('\n')).toBe(true);
    expect(JSON.parse(line)).toMatchObject({
      level: 'fatal',
      msg: 'Unhandled promise rejection',
      err: {
        message: 'Request failed with status code 400',
        method: 'POST',
        url: 'https://idporten.example/token',
        status: 400,
      },
    });
  });

  it('redacts sensitive keys on non-error rejection reasons', () => {
    const line = crashLine('Unhandled promise rejection', { access_token: refreshToken, detail: 'boom' });

    expect(JSON.parse(line).err).toEqual({ access_token: '[REDACTED]', detail: 'boom' });
  });
});

describe('exitAfterCrash', () => {
  let exit: ReturnType<typeof vi.spyOn>;
  let write: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fatal.mockReset();
  });

  it('writes a sanitized line, logs and exits with code 1', () => {
    exitAfterCrash('Uncaught exception', refreshError());

    expect(write).toHaveBeenCalledTimes(1);
    expect(String(write.mock.calls[0][0])).not.toContain(clientCredentials);
    expect(fatal).toHaveBeenCalledWith(expect.any(Error), 'Uncaught exception');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('wraps non-error reasons before logging', () => {
    exitAfterCrash('Unhandled promise rejection', 'plain string');

    const [error] = fatal.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).cause).toBe('plain string');
  });

  it('still exits when logging throws', () => {
    fatal.mockImplementation(() => {
      throw new Error('logger failed');
    });

    expect(() => exitAfterCrash('Uncaught exception', new Error('boom'))).toThrow('logger failed');
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe('registerCrashHandlers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers handlers for uncaught exceptions and unhandled rejections', () => {
    const on = vi.spyOn(process, 'on').mockImplementation(() => process);

    registerCrashHandlers();

    expect(on.mock.calls.map(([event]) => event)).toEqual(['uncaughtException', 'unhandledRejection']);
  });
});
