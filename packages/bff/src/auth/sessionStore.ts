import type { SessionStore } from '@fastify/session';
import type { Session } from 'fastify';
import type { Redis } from 'ioredis';

type Callback = Parameters<SessionStore['destroy']>[1];
type CallbackSession = Parameters<SessionStore['get']>[1];
type RedisSession = Session & { __redisSessionId?: string };

export const sessionKeyPrefix = 'sess:';
export const revokedSessionKeyPrefix = 'sess-revoked:';
const defaultTtlSeconds = 60 * 60 * 24;
export const revokedSessionTtlSeconds = 2 * 60;

const setUnlessRevokedScript = `
if redis.call('EXISTS', KEYS[2]) == 1 then
  return 0
end
return redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2], ARGV[3])
`;

const getTtlSeconds = (session: Session) => {
  const expires = session.cookie.expires;
  return expires ? Math.ceil((new Date(expires).getTime() - Date.now()) / 1000) : defaultTtlSeconds;
};

const settle = <T>(promise: Promise<T>, callback: (error: unknown, result?: T) => void) => {
  promise.then(
    (result) => callback(null, result),
    (error) => callback(error),
  );
};

export class RevocableRedisStore implements SessionStore {
  constructor(private readonly redis: Redis) {}

  get(sessionId: string, callback: CallbackSession) {
    settle(
      this.redis.get(sessionKeyPrefix + sessionId).then((data) => {
        if (!data) return null;
        // Fastify reconstructs sessions by copying enumerable string keys, including for legacy Redis data.
        return { ...JSON.parse(data), __redisSessionId: sessionId } as RedisSession;
      }),
      callback,
    );
  }

  set(sessionId: string, session: RedisSession, callback: Callback) {
    const ttlSeconds = getTtlSeconds(session);
    if (ttlSeconds <= 0) {
      this.destroy(sessionId, callback);
      return;
    }
    const isPersisted = session.__redisSessionId === sessionId;
    settle(
      this.redis
        .eval(
          setUnlessRevokedScript,
          2,
          sessionKeyPrefix + sessionId,
          revokedSessionKeyPrefix + sessionId,
          JSON.stringify(session),
          ttlSeconds,
          isPersisted ? 'XX' : 'NX',
        )
        .then((result) => {
          if (result === 'OK') {
            session.__redisSessionId = sessionId;
          } else if (!isPersisted) {
            throw new Error('Session could not be created');
          }
        }),
      callback,
    );
  }

  destroy(sessionId: string, callback: Callback) {
    settle(
      this.redis
        .multi()
        .set(revokedSessionKeyPrefix + sessionId, '1', 'EX', revokedSessionTtlSeconds)
        .del(sessionKeyPrefix + sessionId)
        .exec(),
      callback,
    );
  }
}
