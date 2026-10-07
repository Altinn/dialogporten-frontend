import type { SessionStore } from '@fastify/session';
import type { Session } from 'fastify';
import type { Redis } from 'ioredis';

type Callback = Parameters<SessionStore['destroy']>[1];
type CallbackSession = Parameters<SessionStore['get']>[1];

export const sessionKeyPrefix = 'sess:';
export const revokedSessionKeyPrefix = 'sess-revoked:';
const defaultTtlSeconds = 60 * 60 * 24;
export const revokedSessionTtlSeconds = 2 * 60;

const setUnlessRevokedScript = `
if redis.call('EXISTS', KEYS[2]) == 1 then
  return 0
end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
return 1
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
      this.redis.get(sessionKeyPrefix + sessionId).then((data) => (data ? (JSON.parse(data) as Session) : null)),
      callback,
    );
  }

  set(sessionId: string, session: Session, callback: Callback) {
    const ttlSeconds = getTtlSeconds(session);
    if (ttlSeconds <= 0) {
      this.destroy(sessionId, callback);
      return;
    }
    settle(
      this.redis.eval(
        setUnlessRevokedScript,
        2,
        sessionKeyPrefix + sessionId,
        revokedSessionKeyPrefix + sessionId,
        JSON.stringify(session),
        ttlSeconds,
      ),
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
